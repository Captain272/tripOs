import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { hasLLM, parseChatToItems, type AIChatParseResult } from "@/lib/llm";
import { ok, fail, unauthorized } from "@/lib/api";

/**
 * Parses an informal group-chat dump into structured trip data.
 * Uses Anthropic Claude when ANTHROPIC_API_KEY is set; falls back to
 * regex heuristics otherwise so the demo still works offline.
 *
 * Optionally inserts the parsed itinerary into a trip when trip_id is
 * supplied and insert=true. Caller must be a joined member.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  text: z.string().min(1).max(8000),
  trip_id: z.string().uuid().optional(),
  insert: z.boolean().optional(),
});

interface ParsedExpense { title: string; amount: number; paid_by: string }
interface ParsedItinerary { day_number: number; title: string; description?: string | null; location_name?: string | null; start_time?: string | null; end_time?: string | null; category?: string | null; estimated_cost?: number | null }
interface ParsedVote { topic: string; preferred: string }
interface ParsedBudget { per_person_cap: number }

interface ParseResult {
  expenses: ParsedExpense[];
  itinerary: ParsedItinerary[];
  votes: ParsedVote[];
  budget: ParsedBudget | null;
  members: string[];
  source: "llm" | "heuristic";
}

function localHeuristics(text: string): Omit<ParseResult, "source"> {
  const lines = text.split(/\n|\.\s|,\s/).map((l) => l.trim()).filter(Boolean);
  const expenses: ParsedExpense[] = [];
  const itinerary: ParsedItinerary[] = [];
  const votes: ParsedVote[] = [];
  const memberSet = new Set<string>();
  let budget: ParsedBudget | null = null;

  for (const line of lines) {
    const expMatch = line.match(/(\w+)\s+(paid|booked|spent|covered)\s+(?:for\s+)?([\w\s]+?)\s*(\d{2,7})/i);
    if (expMatch) {
      memberSet.add(expMatch[1]);
      expenses.push({ title: expMatch[3].trim() || "Expense", amount: Number(expMatch[4]), paid_by: expMatch[1] });
      continue;
    }
    const expSimple = line.match(/(\w+)\s+(petrol|fuel|stay|breakfast|dinner|lunch|safari|hotel)\s+(\d{2,7})/i);
    if (expSimple) {
      memberSet.add(expSimple[1]);
      expenses.push({ title: expSimple[2], amount: Number(expSimple[3]), paid_by: expSimple[1] });
      continue;
    }
    const itinMatch = line.match(/day\s*(\d+)\s+(.+)/i);
    if (itinMatch) {
      itinerary.push({ day_number: Number(itinMatch[1]), title: itinMatch[2].trim() });
      continue;
    }
    const voteMatch = line.match(/(hotel|resort|stay|cafe|restaurant)\s+(\w)\s+(looks better|wins|preferred)/i);
    if (voteMatch) {
      votes.push({ topic: voteMatch[1], preferred: `${voteMatch[1]} ${voteMatch[2]}` });
      continue;
    }
    const budgetMatch = line.match(/budget\s+(?:max\s+)?(?:₹\s*)?(\d+)\s*k?/i);
    if (budgetMatch) {
      const v = Number(budgetMatch[1]) * (line.toLowerCase().includes("k") ? 1000 : 1);
      budget = { per_person_cap: v };
      continue;
    }
  }
  return { expenses, itinerary, votes, budget, members: Array.from(memberSet) };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  let result: Omit<ParseResult, "source">;
  let source: ParseResult["source"];
  if (hasLLM()) {
    try {
      const llm = await parseChatToItems(parsed.data.text);
      result = mapLLMResult(llm);
      source = "llm";
    } catch {
      result = localHeuristics(parsed.data.text);
      source = "heuristic";
    }
  } else {
    result = localHeuristics(parsed.data.text);
    source = "heuristic";
  }

  // Optional: persist itinerary into a trip the caller is a member of.
  if (parsed.data.insert && parsed.data.trip_id && result.itinerary.length) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const admin = getSupabaseAdmin();
    const { data: membership } = await admin
      .from("trip_members")
      .select("id")
      .eq("trip_id", parsed.data.trip_id)
      .eq("user_id", user.id)
      .eq("status", "joined")
      .maybeSingle();
    if (!membership) return fail("not a member of this trip", 403);

    const rows = result.itinerary.map((it) => ({
      trip_id: parsed.data.trip_id!,
      created_by: user.id,
      day_number: it.day_number,
      title: it.title,
      description: it.description ?? null,
      location_name: it.location_name ?? null,
      start_time: it.start_time ?? null,
      end_time: it.end_time ?? null,
      category: it.category ?? null,
      estimated_cost: it.estimated_cost ?? null,
    }));
    const { error } = await admin.from("itinerary_items").insert(rows);
    if (error) return fail(error.message, 500);
  }

  return ok({ ...result, source });
}

function mapLLMResult(r: AIChatParseResult): Omit<ParseResult, "source"> {
  return {
    expenses: r.expenses,
    itinerary: r.itinerary.map((it) => ({
      day_number: it.day_number,
      title: it.title,
      description: it.description ?? null,
      location_name: it.location_name ?? null,
      start_time: it.start_time ?? null,
      end_time: it.end_time ?? null,
      category: it.category ?? null,
      estimated_cost: it.estimated_cost ?? null,
    })),
    votes: r.votes,
    budget: r.budget,
    members: r.members,
  };
}
