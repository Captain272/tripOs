import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/google-oauth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fail, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/google/drive/image?id=FILE_ID&trip_id=TRIP_ID
 *   Streams the file from Drive using the calling user's access token,
 *   provided that drive_file_id is registered on a trip they're a member of.
 *   Returns a 1-day cached response.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const id = req.nextUrl.searchParams.get("id");
  const tripId = req.nextUrl.searchParams.get("trip_id");
  if (!id || !tripId) return fail("id and trip_id required", 400);

  const admin = getSupabaseAdmin();

  // Confirm the user is a member of the trip and the file is registered there.
  const { data: membership } = await admin
    .from("trip_members")
    .select("id")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .eq("status", "joined")
    .maybeSingle();
  if (!membership) return fail("not a member", 403);

  const { data: media } = await admin
    .from("trip_media")
    .select("id")
    .eq("trip_id", tripId)
    .eq("drive_file_id", id)
    .maybeSingle();
  if (!media) return fail("file not in trip media", 404);

  let token: string;
  try { token = await getValidAccessToken(user.id); }
  catch { return fail("not connected", 401); }

  const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!driveRes.ok || !driveRes.body) {
    return fail(`drive fetch failed: ${driveRes.status}`, 502);
  }

  return new Response(driveRes.body, {
    status: 200,
    headers: {
      "Content-Type": driveRes.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
