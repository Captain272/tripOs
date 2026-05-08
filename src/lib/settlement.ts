/**
 * Settlement: from a list of expenses + splits, compute net balances and
 * the minimum-transaction settlement plan.
 *
 *   balance(user) = Σ amount they paid  −  Σ amount they owe
 *
 * Greedy minimization: pair the most-positive creditor with the
 * most-negative debtor each step. Not optimal in pathological cases,
 * but produces clean results on small (5–10) groups.
 */

export interface SettlementInputExpense {
  id: string;
  amount: number;
  paid_by: string | null;
}

export interface SettlementInputSplit {
  expense_id: string;
  user_id: string;
  split_amount: number;
}

export interface MemberBalance {
  user_id: string;
  /** Net amount: positive = should receive, negative = should pay. */
  balance: number;
}

export interface SettlementTx {
  from_user_id: string;
  to_user_id: string;
  amount: number;
}

/** Round to nearest paise / 2-decimal currency unit. */
const round2 = (n: number) => Math.round(n * 100) / 100;
const ABS_EPSILON = 0.5; // ignore residuals smaller than 50 paise

export function computeBalances(
  expenses: SettlementInputExpense[],
  splits: SettlementInputSplit[]
): MemberBalance[] {
  const totals = new Map<string, number>();

  for (const e of expenses) {
    if (!e.paid_by) continue;
    totals.set(e.paid_by, (totals.get(e.paid_by) ?? 0) + Number(e.amount));
  }
  for (const s of splits) {
    totals.set(s.user_id, (totals.get(s.user_id) ?? 0) - Number(s.split_amount));
  }

  return Array.from(totals.entries()).map(([user_id, balance]) => ({
    user_id,
    balance: round2(balance),
  }));
}

export function minimizeTransactions(balances: MemberBalance[]): SettlementTx[] {
  const creditors = balances
    .filter((b) => b.balance > ABS_EPSILON)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance);
  const debtors = balances
    .filter((b) => b.balance < -ABS_EPSILON)
    .map((b) => ({ ...b, balance: -b.balance }))
    .sort((a, b) => b.balance - a.balance);

  const txs: SettlementTx[] = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const c = creditors[i];
    const d = debtors[j];
    const transfer = round2(Math.min(c.balance, d.balance));
    if (transfer <= ABS_EPSILON) break;

    txs.push({
      from_user_id: d.user_id,
      to_user_id: c.user_id,
      amount: transfer,
    });
    c.balance = round2(c.balance - transfer);
    d.balance = round2(d.balance - transfer);
    if (c.balance <= ABS_EPSILON) i++;
    if (d.balance <= ABS_EPSILON) j++;
  }
  return txs;
}

export function summarize(
  expenses: SettlementInputExpense[],
  memberCount: number
) {
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const perPerson = memberCount > 0 ? total / memberCount : 0;
  return { total_spend: round2(total), per_person_average: round2(perPerson) };
}
