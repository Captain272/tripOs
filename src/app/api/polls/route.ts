import { NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { createPollSchema } from "@/lib/validations";
import { ok, fail, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const tripId = req.nextUrl.searchParams.get("trip_id");
  if (!tripId) return fail("trip_id required", 400);
  const supabase = await createSupabaseServerClient();

  const { data: polls, error } = await supabase
    .from("polls").select("*, options:poll_options(*)")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });
  if (error) return fail(error.message, 500);

  // Tally votes
  const pollIds = (polls || []).map((p) => p.id);
  let voteRows: { poll_id: string; option_id: string; user_id: string }[] = [];
  if (pollIds.length) {
    const { data: vRows } = await supabase
      .from("votes").select("poll_id, option_id, user_id").in("poll_id", pollIds);
    voteRows = vRows || [];
  }
  const result = (polls || []).map((p) => {
    const v = voteRows.filter((r) => r.poll_id === p.id);
    const myVote = v.find((r) => r.user_id === user.id)?.option_id ?? null;
    return {
      ...p,
      total_votes: v.length,
      voted_option_id: myVote,
      options: (p.options || []).map((opt: { id: string }) => ({
        ...opt,
        vote_count: v.filter((r) => r.option_id === opt.id).length,
      })),
    };
  });
  return ok({ polls: result });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = createPollSchema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const supabase = await createSupabaseServerClient();
  const { data: poll, error } = await supabase
    .from("polls")
    .insert({
      trip_id: parsed.data.trip_id,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      closes_at: parsed.data.closes_at,
      created_by: user.id,
    }).select("*").single();
  if (error || !poll) return fail(error?.message || "poll create failed", 500);

  const { error: optErr } = await supabase
    .from("poll_options")
    .insert(parsed.data.options.map((o) => ({ ...o, poll_id: poll.id })));
  if (optErr) return fail(optErr.message, 500);

  return ok({ poll });
}
