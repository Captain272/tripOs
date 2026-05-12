import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getValidAccessToken } from "@/lib/google-oauth";
import { listFolderImages, parseDriveTime, type DriveImage } from "@/lib/google-drive";
import { ok, fail, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({ trip_id: z.string().uuid() });

interface StopRow {
  id: string;
  day_number: number | null;
  start_time: string | null;
  end_time: string | null;
  latitude: number | null;
  longitude: number | null;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());
  const { trip_id } = parsed.data;

  const admin = getSupabaseAdmin();
  const { data: trip, error: tripError } = await admin
    .from("trips")
    .select("id, start_date, end_date, drive_folder_id")
    .eq("id", trip_id)
    .single();
  if (tripError || !trip) return fail("trip not found", 404);
  if (!trip.drive_folder_id) return fail("no Drive folder selected for this trip", 400);

  const { data: membership } = await admin
    .from("trip_members")
    .select("id")
    .eq("trip_id", trip_id)
    .eq("user_id", user.id)
    .eq("status", "joined")
    .maybeSingle();
  if (!membership) return fail("not a member of this trip", 403);

  let accessToken: string;
  try { accessToken = await getValidAccessToken(user.id); }
  catch { return fail("Google Drive not connected", 401); }

  let images: DriveImage[];
  try { images = await listFolderImages(trip.drive_folder_id, accessToken); }
  catch (e) { return fail(e instanceof Error ? e.message : "drive listing failed", 502); }

  const { data: stops } = await admin
    .from("itinerary_items")
    .select("id, day_number, start_time, end_time, latitude, longitude")
    .eq("trip_id", trip_id);

  const tripStart = trip.start_date ? new Date(trip.start_date) : null;

  const rows: Record<string, unknown>[] = [];
  for (const img of images) {
    const takenAtIso = parseDriveTime(img.imageMediaMetadata?.time || undefined)
      || img.createdTime
      || null;
    const lat = img.imageMediaMetadata?.location?.latitude ?? null;
    const lng = img.imageMediaMetadata?.location?.longitude ?? null;
    const day = deriveDayNumber(takenAtIso, tripStart);
    const itemId = bindToStop({ takenAtIso, lat, lng, day, stops: (stops || []) as StopRow[] });

    rows.push({
      trip_id,
      uploaded_by: user.id,
      file_url: `https://drive.google.com/uc?id=${img.id}`,
      thumbnail_url: img.thumbnailLink || null,
      file_type: "image",
      taken_at: takenAtIso,
      latitude: lat,
      longitude: lng,
      day_number: day,
      itinerary_item_id: itemId,
      drive_file_id: img.id,
      caption: null,
    });
  }

  let inserted = 0;
  if (rows.length) {
    const { data, error } = await admin
      .from("trip_media")
      .upsert(rows, { onConflict: "trip_id,drive_file_id", ignoreDuplicates: false })
      .select("id");
    if (error) return fail(error.message, 500);
    inserted = data?.length ?? 0;
  }

  await admin
    .from("trips")
    .update({ drive_last_synced_at: new Date().toISOString() })
    .eq("id", trip_id);

  return ok({ count: rows.length, written: inserted });
}

function deriveDayNumber(takenAtIso: string | null, tripStart: Date | null): number | null {
  if (!takenAtIso || !tripStart) return null;
  const t = new Date(takenAtIso);
  if (isNaN(+t)) return null;
  const days = Math.floor((+t - +tripStart) / 86400000) + 1;
  return days >= 1 && days <= 60 ? days : null;
}

interface BindArgs {
  takenAtIso: string | null;
  lat: number | null;
  lng: number | null;
  day: number | null;
  stops: StopRow[];
}

/**
 * Score each candidate stop and pick the best:
 *   - Same-day match required if we know the day.
 *   - With GPS: pick the stop with the smallest geographic distance.
 *   - Without GPS but with time: pick the stop whose start_time is closest.
 *   - With neither: leave unbound (return null).
 */
function bindToStop({ takenAtIso, lat, lng, day, stops }: BindArgs): string | null {
  if (!stops.length) return null;
  const candidates = day != null
    ? stops.filter((s) => s.day_number === day)
    : stops;
  if (!candidates.length) return null;

  if (lat != null && lng != null) {
    let best: { id: string; d: number } | null = null;
    for (const s of candidates) {
      if (s.latitude == null || s.longitude == null) continue;
      const d = haversine(lat, lng, Number(s.latitude), Number(s.longitude));
      if (!best || d < best.d) best = { id: s.id, d };
    }
    if (best) return best.id;
  }

  if (takenAtIso) {
    const tMin = new Date(takenAtIso).getUTCHours() * 60 + new Date(takenAtIso).getUTCMinutes();
    let best: { id: string; d: number } | null = null;
    for (const s of candidates) {
      if (!s.start_time) continue;
      const [hh, mm] = s.start_time.split(":").map((n) => parseInt(n, 10));
      const sMin = hh * 60 + (mm || 0);
      const d = Math.abs(tMin - sMin);
      if (!best || d < best.d) best = { id: s.id, d };
    }
    if (best) return best.id;
  }

  return null;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
