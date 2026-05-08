import { NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { generateSettlementSchema } from "@/lib/validations";
import { ok, fail, unauthorized } from "@/lib/api";
import { computeBalances, minimizeTransactions, summarize } from "@/lib/settlement";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = generateSettlementSchema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400);
  const { trip_id } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const [{ data: expenses, error: eErr }, { data: splits, error: sErr }, { data: members, error: mErr }] =
    await Promise.all([
      supabase.from("expenses").select("id, amount, paid_by").eq("trip_id", trip_id),
      supabase
        .from("expense_splits")
        .select("expense_id, user_id, split_amount, expense:expenses!inner(trip_id)")
        .eq("expense.trip_id", trip_id),
      supabase
        .from("trip_members")
        .select("user_id, profile:profiles(id, full_name)")
        .eq("trip_id", trip_id)
        .eq("status", "joined"),
    ]);
  if (eErr) return fail(eErr.message, 500);
  if (sErr) return fail(sErr.message, 500);
  if (mErr) return fail(mErr.message, 500);

  const balances = computeBalances(
    (expenses || []).map((e) => ({ id: e.id, amount: Number(e.amount), paid_by: e.paid_by })),
    (splits || []).map((s) => ({
      expense_id: s.expense_id, user_id: s.user_id, split_amount: Number(s.split_amount),
    }))
  );
  const txs = minimizeTransactions(balances);
  const memberCount = (members || []).filter((m) => m.user_id).length || 1;
  const stats = summarize(
    (expenses || []).map((e) => ({ id: e.id, amount: Number(e.amount), paid_by: e.paid_by })),
    memberCount
  );

  // Persist a snapshot.
  const { data: report, error: rErr } = await supabase
    .from("settlement_reports")
    .insert({
      trip_id,
      total_spend: stats.total_spend,
      per_person_average: stats.per_person_average,
      summary: { balances, member_count: memberCount },
      generated_by: user.id,
    }).select("*").single();
  if (rErr || !report) return fail(rErr?.message || "report failed", 500);

  if (txs.length) {
    const { error: txErr } = await supabase.from("settlement_transactions").insert(
      txs.map((t) => ({ ...t, report_id: report.id, status: "pending" as const }))
    );
    if (txErr) return fail(txErr.message, 500);
  }

  // Build name map for response
  type MemberWithProfile = { user_id: string | null; profile: { id: string; full_name: string | null } | null };
  const memberList = (members || []) as unknown as MemberWithProfile[];
  const nameOf = (uid: string) =>
    memberList.find((m) => m.profile?.id === uid)?.profile?.full_name || "Member";

  const transactions = txs.map((t) => ({
    from: nameOf(t.from_user_id),
    from_user_id: t.from_user_id,
    to: nameOf(t.to_user_id),
    to_user_id: t.to_user_id,
    amount: t.amount,
  }));

  return ok({
    report,
    transactions,
    balances: balances.map((b) => ({ ...b, name: nameOf(b.user_id) })),
    total_spend: stats.total_spend,
    per_person_average: stats.per_person_average,
  });
}
