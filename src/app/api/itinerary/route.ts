import { NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { itineraryItemSchema } from "@/lib/validations";
import { ok, fail, unauthorized } from "@/lib/api";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const tripId = req.nextUrl.searchParams.get("trip_id");
  if (!tripId) return fail("trip_id required", 400);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("itinerary_items").select("*").eq("trip_id", tripId)
    .order("day_number", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) return fail(error.message, 500);
  return ok({ items: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = itineraryItemSchema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("itinerary_items")
    .insert({ ...parsed.data, created_by: user.id })
    .select("*").single();
  if (error || !data) return fail(error?.message || "insert failed", 500);
  return ok({ item: data });
}

const deleteSchema = z.object({ id: z.string().uuid() });
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("itinerary_items").delete().eq("id", parsed.data.id);
  if (error) return fail(error.message, 500);
  return ok({ deleted: true });
}
