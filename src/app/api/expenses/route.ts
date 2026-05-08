import { NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { expenseSchema } from "@/lib/validations";
import { ok, fail, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const tripId = req.nextUrl.searchParams.get("trip_id");
  if (!tripId) return fail("trip_id required", 400);

  const supabase = await createSupabaseServerClient();
  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("*, splits:expense_splits(*), payer:profiles!expenses_paid_by_fkey(id, full_name, avatar_url)")
    .eq("trip_id", tripId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return fail(error.message, 500);
  return ok({ expenses: expenses || [] });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const supabase = await createSupabaseServerClient();
  const {
    split_user_ids,
    custom_splits,
    ...expenseData
  } = parsed.data;

  // 1. insert expense
  const { data: expense, error: expErr } = await supabase
    .from("expenses")
    .insert({ ...expenseData, created_by: user.id })
    .select("*").single();
  if (expErr || !expense) return fail(expErr?.message || "expense create failed", 500);

  // 2. compute splits
  let splits: { expense_id: string; user_id: string; split_amount: number }[];
  if (custom_splits?.length) {
    const sum = custom_splits.reduce((s, x) => s + x.split_amount, 0);
    if (Math.abs(sum - expense.amount) > 0.5) {
      // rollback
      await supabase.from("expenses").delete().eq("id", expense.id);
      return fail("custom splits must sum to expense amount", 400);
    }
    splits = custom_splits.map((c) => ({
      expense_id: expense.id, user_id: c.user_id, split_amount: c.split_amount,
    }));
  } else {
    const each = Math.round((expense.amount / split_user_ids.length) * 100) / 100;
    splits = split_user_ids.map((uid) => ({
      expense_id: expense.id, user_id: uid, split_amount: each,
    }));
    // adjust last split to absorb rounding remainder
    const total = splits.reduce((s, x) => s + x.split_amount, 0);
    const drift = Math.round((expense.amount - total) * 100) / 100;
    if (drift !== 0 && splits.length) splits[splits.length - 1].split_amount += drift;
  }

  const { error: splitErr } = await supabase.from("expense_splits").insert(splits);
  if (splitErr) {
    await supabase.from("expenses").delete().eq("id", expense.id);
    return fail(splitErr.message, 500);
  }

  return ok({ expense, splits });
}
