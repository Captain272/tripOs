import { NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { updateTripSchema } from "@/lib/validations";
import { ok, fail, unauthorized, notFound } from "@/lib/api";

export const dynamic = "force-dynamic";

interface Params { params: Promise<{ tripId: string }>; }

export async function GET(_: NextRequest, { params }: Params) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const supabase = await createSupabaseServerClient();
  const { data: trip, error } = await supabase
    .from("trips").select("*").eq("id", tripId).single();
  if (error || !trip) return notFound("trip");

  const { data: members } = await supabase
    .from("trip_members")
    .select("*, profile:profiles(id, full_name, email, avatar_url)")
    .eq("trip_id", tripId);

  return ok({ trip, members: members || [] });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = updateTripSchema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trips").update(parsed.data).eq("id", tripId).select("*").single();
  if (error || !data) return fail(error?.message || "update failed", 500);
  return ok({ trip: data });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) return fail(error.message, 500);
  return ok({ deleted: true });
}
