import { NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { castVoteSchema } from "@/lib/validations";
import { ok, fail, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = castVoteSchema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const supabase = await createSupabaseServerClient();
  // upsert on (poll_id, user_id) — replace previous vote
  const { error: delErr } = await supabase
    .from("votes").delete()
    .eq("poll_id", parsed.data.poll_id)
    .eq("user_id", user.id);
  if (delErr) return fail(delErr.message, 500);

  const { data, error } = await supabase
    .from("votes")
    .insert({
      poll_id: parsed.data.poll_id,
      option_id: parsed.data.option_id,
      user_id: user.id,
    }).select("*").single();
  if (error || !data) return fail(error?.message || "vote failed", 500);
  return ok({ vote: data });
}
