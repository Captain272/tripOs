import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateItinerary, hasLLM } from "@/lib/llm";
import { ok, fail, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  trip_id: z.string().uuid(),
  preferences: z.string().max(1000).optional().nullable(),
  replace_existing: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasLLM()) return fail("AI is not configured (set OPENROUTER_API_KEY)", 503);

  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const admin = getSupabaseAdmin();

  const { data: trip, error: tripError } = await admin
    .from("trips")
    .select("id, destination, start_date, end_date, budget_per_person, currency, title")
    .eq("id", parsed.data.trip_id)
    .single();
  if (tripError || !trip) return fail("trip not found", 404);

  const { data: membership } = await admin
    .from("trip_members")
    .select("id")
    .eq("trip_id", trip.id)
    .eq("user_id", user.id)
    .eq("status", "joined")
    .maybeSingle();
  if (!membership) return fail("not a member of this trip", 403);

  let items;
  try {
    items = await generateItinerary({
      destination: trip.destination || trip.title || "the destination",
      start_date: trip.start_date,
      end_date: trip.end_date,
      budget_per_person: trip.budget_per_person,
      currency: trip.currency,
      preferences: parsed.data.preferences ?? undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI failed";
    return fail(`AI error: ${msg}`, 502);
  }

  if (parsed.data.replace_existing) {
    await admin.from("itinerary_items").delete().eq("trip_id", trip.id);
  }

  const rows = items.map((it) => ({ ...it, trip_id: trip.id, created_by: user.id }));
  const { data: inserted, error: insertError } = await admin
    .from("itinerary_items")
    .insert(rows)
    .select("*");
  if (insertError) return fail(insertError.message, 500);

  return ok({ items: inserted, count: inserted?.length ?? 0 });
}
