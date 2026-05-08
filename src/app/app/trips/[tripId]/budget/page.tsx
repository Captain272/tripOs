import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { inr } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CATEGORY_COLORS: Record<string, string> = {
  stay: "#38e1ff",
  food: "#a78bfa",
  fuel: "#34d399",
  activity: "#ff8c4a",
  transfer: "#7ce9ff",
  shopping: "#fb7185",
  other: "#ffd27a",
};

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data: trip }, { data: itinerary }, { data: expenses }, { count: memberCount }] =
    await Promise.all([
      supabase.from("trips").select("*").eq("id", tripId).single(),
      supabase.from("itinerary_items").select("estimated_cost, category").eq("trip_id", tripId),
      supabase.from("expenses").select("amount, category").eq("trip_id", tripId),
      supabase.from("trip_members").select("*", { count: "exact", head: true })
        .eq("trip_id", tripId).eq("status", "joined"),
    ]);

  const estimatedTotal = (itinerary || []).reduce((s, i) => s + Number(i.estimated_cost || 0), 0);
  const actualTotal = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
  const members = memberCount || 1;
  const perPersonActual = Math.round(actualTotal / members);
  const cap = trip?.budget_per_person ? Number(trip.budget_per_person) : null;

  // category breakdown (actual)
  const byCat = new Map<string, number>();
  for (const e of expenses || []) {
    const c = e.category || "other";
    byCat.set(c, (byCat.get(c) || 0) + Number(e.amount));
  }

  const overBudget = cap !== null && perPersonActual > cap;

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { l: "Estimated total", v: inr(estimatedTotal) },
          { l: "Actual spend", v: inr(actualTotal) },
          { l: "Per person actual", v: inr(perPersonActual) },
          { l: "Cap / person", v: cap ? inr(cap) : "—", warn: overBudget },
        ].map((s) => (
          <div
            key={s.l}
            className={cn(
              "rounded-2xl border bg-surface/40 p-4",
              s.warn ? "border-rose/40" : "border-white/[0.07]"
            )}
          >
            <div className="text-[10px] uppercase tracking-wider text-faint">{s.l}</div>
            <div className={cn(
              "font-display text-xl sm:text-2xl font-semibold mt-1",
              s.warn && "text-rose"
            )}>{s.v}</div>
          </div>
        ))}
      </div>

      {overBudget && cap && (
        <div className="mb-6 rounded-2xl border border-rose/30 bg-rose/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose mt-0.5" />
          <div>
            <div className="font-medium">Over the cap by {inr(perPersonActual - cap)} / person.</div>
            <div className="text-[13px] text-muted mt-0.5">Trim a category or revote on a cheaper option.</div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/[0.07] bg-surface/40 p-5">
        <div className="text-[10px] uppercase tracking-wider text-faint mb-3">Spend by category</div>
        {byCat.size === 0 ? (
          <div className="text-sm text-faint">No expenses yet — add some in Ledger.</div>
        ) : (
          <div className="space-y-2.5">
            {Array.from(byCat.entries()).map(([cat, total]) => {
              const pct = (total / actualTotal) * 100;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-[12.5px] mb-1">
                    <span className="capitalize">{cat}</span>
                    <span className="text-faint font-mono">{inr(total)} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: CATEGORY_COLORS[cat] || "#7ce9ff" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {estimatedTotal > 0 && (
        <div className="mt-6 rounded-2xl border border-white/[0.07] bg-surface/40 p-5">
          <div className="text-[10px] uppercase tracking-wider text-faint mb-3 inline-flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-cyan" /> Estimated vs. actual
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] text-faint mb-1">Estimated</div>
              <div className="font-mono text-lg">{inr(estimatedTotal)}</div>
            </div>
            <div>
              <div className="text-[11px] text-faint mb-1">Actual</div>
              <div className="font-mono text-lg">{inr(actualTotal)}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
