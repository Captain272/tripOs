import { NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createTripSchema } from "@/lib/validations";
import { ok, fail, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/trips — list trips for the current user. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_members")
    .select("trip:trip_id(*)")
    .eq("user_id", user.id)
    .eq("status", "joined")
    .order("created_at", { ascending: false });
  if (error) return fail(error.message, 500);
  const trips = (data || []).map((r) => r.trip).filter(Boolean);
  return ok({ trips });
}

/** POST /api/trips — create a trip + add the user as owner.
 *  User is authenticated via getCurrentUser; the insert uses the service-role
 *  client (same pattern as trips/invite) because the trip + initial owner row
 *  must be written together before any membership exists for RLS to recognize. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid json", 400);
  }
  const parsed = createTripSchema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const admin = getSupabaseAdmin();

  // Ensure a profile row exists for this user (auto-trigger may not have fired
  // for users who signed up before migrations were applied).
  await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const { data: trip, error } = await admin
    .from("trips")
    .insert({ ...parsed.data, created_by: user.id })
    .select("*")
    .single();
  if (error || !trip) return fail(error?.message || "create failed", 500);

  const { error: memberError } = await admin.from("trip_members").insert({
    trip_id: trip.id,
    user_id: user.id,
    email: user.email,
    role: "owner",
    status: "joined",
    joined_at: new Date().toISOString(),
  });
  if (memberError) return fail(memberError.message, 500);

  return ok({ trip });
}
