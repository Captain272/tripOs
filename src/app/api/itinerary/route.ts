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

const patchSchema = z.object({
  id: z.string().uuid(),
  image_url: z.string().url().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const { id, ...rest } = parsed.data;
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) update[k] = v;
  }
  if (!Object.keys(update).length) return ok({ updated: false });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("itinerary_items")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(error.message, 500);
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
