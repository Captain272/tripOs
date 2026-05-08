import { NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { ok, fail, unauthorized, notFound } from "@/lib/api";
import { z } from "zod";

/**
 * Mock storybook generator: builds a structured story_content jsonb from
 * existing trip data (members, itinerary, expenses, photos). Real LLM
 * narrative generation can be plugged in later.
 */

export const dynamic = "force-dynamic";
const schema = z.object({ trip_id: z.string().uuid() });

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400);
  const { trip_id } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const [{ data: trip }, { data: itinerary }, { data: members }, { data: photos }, { data: expenses }] =
    await Promise.all([
      supabase.from("trips").select("*").eq("id", trip_id).single(),
      supabase.from("itinerary_items").select("*").eq("trip_id", trip_id).order("day_number"),
      supabase
        .from("trip_members")
        .select("user_id, profile:profiles(id, full_name, avatar_url)")
        .eq("trip_id", trip_id).eq("status", "joined"),
      supabase.from("trip_media").select("*").eq("trip_id", trip_id).eq("file_type", "image"),
      supabase.from("expenses").select("amount").eq("trip_id", trip_id),
    ]);
  if (!trip) return notFound("trip");

  const total_spend = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
  const traveler_count = (members || []).length;
  const days =
    trip.start_date && trip.end_date
      ? Math.max(1, Math.round((+new Date(trip.end_date) - +new Date(trip.start_date)) / 86400000) + 1)
      : null;

  // Group itinerary by day
  type ItinItem = { day_number: number | null; title: string };
  const byDay = new Map<number, ItinItem[]>();
  for (const it of (itinerary || []) as ItinItem[]) {
    const k = it.day_number || 1;
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(it);
  }

  const story_content = {
    cover: { title: trip.title, destination: trip.destination, dates: { start: trip.start_date, end: trip.end_date } },
    members: ((members || []) as unknown as { profile: { full_name: string | null; avatar_url: string | null } | null }[]).map((m) => ({
      name: m.profile?.full_name,
      avatar_url: m.profile?.avatar_url,
    })),
    days: Array.from(byDay.entries())
      .sort(([a], [b]) => a - b)
      .map(([day, items]) => ({
        day,
        title: `Day ${day}`,
        // simple AI-feel narrative — replace with LLM call when wired
        story: items.length
          ? `${items.length} stops · ${items.map((i) => i.title).join(", ")}`
          : "Free day",
        items,
      })),
    photos: (photos || []).slice(0, 24),
    wrapped: {
      total_spend,
      per_person_average: traveler_count ? Math.round(total_spend / traveler_count) : 0,
      traveler_count,
      days,
      photo_count: (photos || []).length,
      place_count: (itinerary || []).length,
    },
  };

  // Persist to trip_capsules (upsert)
  const { error } = await supabase.from("trip_capsules").upsert(
    {
      trip_id,
      title: trip.title,
      story_content,
      cover_image_url: trip.cover_image_url,
    },
    { onConflict: "trip_id" }
  );
  if (error) return fail(error.message, 500);

  return ok({ story_content });
}
