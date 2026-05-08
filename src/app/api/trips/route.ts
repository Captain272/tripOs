import { NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
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

/** POST /api/trips — create a trip + add the user as owner. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const supabase = await createSupabaseServerClient();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid json", 400);
  }
  const parsed = createTripSchema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const { data: trip, error } = await supabase
    .from("trips")
    .insert({ ...parsed.data, created_by: user.id })
    .select("*")
    .single();
  if (error || !trip) return fail(error?.message || "create failed", 500);

  // Owner membership row. RLS: members insert allowed when user_id = auth.uid().
  const { error: memberError } = await supabase.from("trip_members").insert({
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
