import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail } from "@/lib/api";

/**
 * Mock AI parser. Detects expenses ("Abhi paid 3200"), votes,
 * itinerary ("Day 2 Jeep Safari"), members, and budget caps via simple
 * regex heuristics. Returns a typed structured response so the UI can
 * preview what would happen — and the same shape can be plugged into a
 * real LLM call later (see commented-out section).
 */

export const dynamic = "force-dynamic";

const schema = z.object({ text: z.string().min(1).max(8000) });

interface ParsedExpense { title: string; amount: number; paid_by: string }
interface ParsedItinerary { day: number; title: string }
interface ParsedVote { topic: string; preferred: string }
interface ParsedBudget { per_person_cap: number }

interface ParseResult {
  expenses: ParsedExpense[];
  itinerary: ParsedItinerary[];
  votes: ParsedVote[];
  budget: ParsedBudget | null;
  members: string[];
}

function localHeuristics(text: string): ParseResult {
  const lines = text.split(/\n|\.\s|,\s/).map((l) => l.trim()).filter(Boolean);
  const expenses: ParsedExpense[] = [];
  const itinerary: ParsedItinerary[] = [];
  const votes: ParsedVote[] = [];
  const memberSet = new Set<string>();
  let budget: ParsedBudget | null = null;

  for (const line of lines) {
    // expense: "<Name> paid <amount>" / "<Name> booked <thing> <amount>"
    const expMatch = line.match(/(\w+)\s+(paid|booked|spent|covered)\s+(?:for\s+)?([\w\s]+?)\s*(\d{2,7})/i);
    if (expMatch) {
      memberSet.add(expMatch[1]);
      expenses.push({
        title: expMatch[3].trim() || "Expense",
        amount: Number(expMatch[4]),
        paid_by: expMatch[1],
      });
      continue;
    }

    // simpler: "<Name> petrol 3200"
    const expSimple = line.match(/(\w+)\s+(petrol|fuel|stay|breakfast|dinner|lunch|safari|hotel)\s+(\d{2,7})/i);
    if (expSimple) {
      memberSet.add(expSimple[1]);
      expenses.push({
        title: expSimple[2],
        amount: Number(expSimple[3]),
        paid_by: expSimple[1],
      });
      continue;
    }

    // itinerary: "Day 2 Jeep Safari"
    const itinMatch = line.match(/day\s*(\d+)\s+(.+)/i);
    if (itinMatch) {
      itinerary.push({ day: Number(itinMatch[1]), title: itinMatch[2].trim() });
      continue;
    }

    // vote: "Hotel B looks better" / "<X> better than <Y>"
    const voteMatch = line.match(/(hotel|resort|stay|cafe|restaurant)\s+(\w)\s+(looks better|wins|preferred)/i);
    if (voteMatch) {
      votes.push({ topic: voteMatch[1], preferred: voteMatch[1] + " " + voteMatch[2] });
      continue;
    }

    // budget: "Budget max 8k each" / "₹8000 per person"
    const budgetMatch = line.match(/budget\s+(?:max\s+)?(?:₹\s*)?(\d+)\s*k?/i);
    if (budgetMatch) {
      const v = Number(budgetMatch[1]) * (line.toLowerCase().includes("k") ? 1000 : 1);
      budget = { per_person_cap: v };
      continue;
    }
  }

  return {
    expenses,
    itinerary,
    votes,
    budget,
    members: Array.from(memberSet),
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400);

  const result = localHeuristics(parsed.data.text);

  // FUTURE — real LLM call. Drop in OPTIONAL_AI_API_KEY + fetch Anthropic / OpenAI:
  // if (process.env.OPTIONAL_AI_API_KEY) {
  //   const llm = await callLLM(parsed.data.text);
  //   return ok({ ...result, ...llm, source: "llm" });
  // }

  return ok({ ...result, source: "heuristic" });
}
