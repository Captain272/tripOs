import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { chatPlanTurn, hasLLM, type ItemPatch } from "@/lib/llm";
import { ok, fail, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  trip_id: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
});

const HISTORY_LIMIT = 20;

interface PatchRow {
  day_number?: number | null;
  title?: string;
  description?: string | null;
  location_name?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  category?: string | null;
  estimated_cost?: number | null;
  image_query?: string | null;
}

function patchToRow(data: Record<string, unknown>): PatchRow {
  const out: PatchRow = {};
  const fields: (keyof PatchRow)[] = [
    "day_number",
    "title",
    "description",
    "location_name",
    "start_time",
    "end_time",
    "category",
    "estimated_cost",
    "image_query",
  ];
  for (const f of fields) {
    if (f in data) (out as Record<string, unknown>)[f] = data[f] as unknown;
  }
  return out;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasLLM()) return fail("AI is not configured (set OPENROUTER_API_KEY)", 503);

  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const admin = getSupabaseAdmin();
  const { trip_id, message } = parsed.data;

  const { data: trip, error: tripError } = await admin
    .from("trips")
    .select("id, title, destination, start_date, end_date, budget_per_person, currency")
    .eq("id", trip_id)
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

  const [{ data: items }, { data: history }] = await Promise.all([
    admin
      .from("itinerary_items")
      .select("id, day_number, title, description, location_name, start_time, end_time, category, estimated_cost")
      .eq("trip_id", trip.id)
      .order("day_number", { ascending: true })
      .order("start_time", { ascending: true }),
    admin
      .from("trip_chat_messages")
      .select("role, content")
      .eq("trip_id", trip.id)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT),
  ]);

  const orderedHistory = (history || []).slice().reverse().map((h) => ({
    role: h.role as "user" | "assistant",
    content: h.content,
  }));

  // Persist the user message immediately so it's never lost.
  await admin.from("trip_chat_messages").insert({
    trip_id: trip.id,
    user_id: user.id,
    role: "user",
    content: message,
  });

  let turn;
  try {
    turn = await chatPlanTurn({
      trip: {
        destination: trip.destination,
        start_date: trip.start_date,
        end_date: trip.end_date,
        budget_per_person: trip.budget_per_person,
        currency: trip.currency,
      },
      items: items || [],
      history: orderedHistory,
      user_message: message,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI failed";
    return fail(`AI error: ${msg}`, 502);
  }

  // Apply patches: add / update / delete.
  let added = 0, updated = 0, deleted = 0;
  for (const p of turn.patches as ItemPatch[]) {
    if (p.op === "add") {
      const { error } = await admin.from("itinerary_items").insert({
        ...patchToRow(p.data as unknown as Record<string, unknown>),
        trip_id: trip.id,
        created_by: user.id,
      });
      if (!error) added++;
    } else if (p.op === "update") {
      const row = patchToRow(p.data as unknown as Record<string, unknown>);
      if (Object.keys(row).length) {
        const { error } = await admin
          .from("itinerary_items")
          .update(row)
          .eq("id", p.id)
          .eq("trip_id", trip.id);
        if (!error) updated++;
      }
    } else if (p.op === "delete") {
      const { error } = await admin
        .from("itinerary_items")
        .delete()
        .eq("id", p.id)
        .eq("trip_id", trip.id);
      if (!error) deleted++;
    }
  }

  const toolSummary = added || updated || deleted ? { added, updated, deleted } : null;

  const { data: assistantRow } = await admin
    .from("trip_chat_messages")
    .insert({
      trip_id: trip.id,
      user_id: null,
      role: "assistant",
      content: turn.message,
      quick_replies: turn.quick_replies.length ? turn.quick_replies : null,
      tool_summary: toolSummary,
    })
    .select("*")
    .single();

  return ok({
    message: assistantRow,
    changed: Boolean(toolSummary),
    summary: toolSummary,
  });
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const tripId = req.nextUrl.searchParams.get("trip_id");
  if (!tripId) return fail("trip_id required", 400);
  const admin = getSupabaseAdmin();
  const { data: membership } = await admin
    .from("trip_members")
    .select("id")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .eq("status", "joined")
    .maybeSingle();
  if (!membership) return fail("not a member of this trip", 403);
  const { data, error } = await admin
    .from("trip_chat_messages")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });
  if (error) return fail(error.message, 500);
  return ok({ messages: data || [] });
}
