"use client";

import * as React from "react";
import { use } from "react";
import { motion } from "framer-motion";
import { Handshake, Sparkles, Send, Copy, CheckCircle2, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { track, EVENTS } from "@/lib/analytics";
import { inr } from "@/lib/utils";

interface SettleTx { from: string; from_user_id: string; to: string; to_user_id: string; amount: number; }
interface SettleResponse {
  total_spend: number;
  per_person_average: number;
  transactions: SettleTx[];
  balances: { user_id: string; name: string; balance: number }[];
  report: { id: string };
}

export default function SettlePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const { push } = useToast();
  const [data, setData] = React.useState<SettleResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [tripTitle, setTripTitle] = React.useState("Trip");

  React.useEffect(() => {
    fetch(`/api/trips/${tripId}`)
      .then((r) => r.json())
      .then((j) => { if (j.ok) setTripTitle(j.data.trip.title); });
  }, [tripId]);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/settlement/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trip_id: tripId }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) { push({ title: "Failed", body: json.error }); return; }
    setData(json.data);
    track(EVENTS.SETTLEMENT_GENERATED, { trip_id: tripId, transactions: json.data.transactions.length });
  }

  async function sendEmail() {
    const res = await fetch("/api/email/send-settlement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trip_id: tripId }),
    });
    const json = await res.json();
    if (!json.ok) push({ title: "Email failed", body: json.error });
    else push({ title: `Email sent to ${json.data.recipients} member${json.data.recipients === 1 ? "" : "s"}` });
  }

  function whatsappText() {
    if (!data) return "";
    if (!data.transactions.length) return `${tripTitle} settlement:\nAll settled — no transactions needed.`;
    return [
      `${tripTitle} settlement:`,
      ...data.transactions.map((t) => `${t.from} pays ${t.to} ${inr(Math.round(t.amount))}`),
    ].join("\n");
  }

  async function copyWa() {
    await navigator.clipboard.writeText(whatsappText());
    push({ title: "Copied to clipboard" });
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold tracking-tight">Settle the trip</h2>
        <p className="text-sm text-muted">Minimum-transaction split. No spreadsheets, no awkwardness.</p>
      </div>

      {!data ? (
        <div className="rounded-3xl border border-dashed border-white/[0.12] bg-surface/30 p-10 text-center">
          <div className="mx-auto grid place-items-center w-12 h-12 rounded-full bg-emerald/10 text-emerald mb-4">
            <Handshake className="w-5 h-5" />
          </div>
          <div className="font-display text-lg">Generate the settlement</div>
          <p className="text-sm text-muted mt-1 max-w-md mx-auto">
            Pulls every expense + split, computes net balances, and lays out the fewest possible transactions.
          </p>
          <Button onClick={generate} size="lg" className="mt-6" disabled={loading}>
            {loading ? "Calculating…" : (<><Sparkles className="w-4 h-4" /> Generate settlement</>)}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/[0.07] bg-surface/40 p-4">
              <div className="text-[10px] uppercase tracking-wider text-faint">Total spend</div>
              <div className="font-display text-2xl font-semibold mt-1">{inr(data.total_spend)}</div>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-surface/40 p-4">
              <div className="text-[10px] uppercase tracking-wider text-faint">Per person average</div>
              <div className="font-display text-2xl font-semibold mt-1">{inr(data.per_person_average)}</div>
            </div>
            <div className="rounded-2xl border border-emerald/30 bg-emerald/5 p-4">
              <div className="text-[10px] uppercase tracking-wider text-emerald">Transactions to clear</div>
              <div className="font-display text-2xl font-semibold mt-1">{data.transactions.length}</div>
            </div>
          </div>

          {/* Net balances */}
          <div className="rounded-2xl border border-white/[0.07] bg-surface/40 p-5">
            <div className="text-[10px] uppercase tracking-wider text-faint mb-3">Net balances</div>
            <ul className="grid sm:grid-cols-2 gap-2">
              {data.balances.map((b) => (
                <li
                  key={b.user_id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-bg/40 px-3 py-2.5 text-[13px]"
                >
                  <span>{b.name}</span>
                  <span className={
                    b.balance > 0 ? "text-emerald font-mono" : b.balance < 0 ? "text-rose font-mono" : "text-faint font-mono"
                  }>
                    {b.balance > 0 ? "+" : ""}{inr(Math.round(Math.abs(b.balance)))}{b.balance < 0 ? " owed" : b.balance > 0 ? " to receive" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.07] bg-surface/40 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-wider text-faint">Settle plan</div>
              <span className="text-[11px] text-emerald inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Minimal
              </span>
            </div>
            {data.transactions.length === 0 ? (
              <div className="text-sm text-muted">All settled — no transactions needed.</div>
            ) : (
              <ul className="space-y-2">
                {data.transactions.map((t, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-bg/40 px-3 py-2.5 text-[13px]">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{t.from}</span>
                      <ArrowRight className="w-3 h-3 text-faint" />
                      <span className="truncate">{t.to}</span>
                    </span>
                    <span className="font-mono text-emerald">{inr(Math.round(t.amount))}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={copyWa} variant="ghost" size="sm">
                <Copy className="w-3.5 h-3.5" /> Copy WhatsApp summary
              </Button>
              <Button onClick={sendEmail} variant="ghost" size="sm">
                <Mail className="w-3.5 h-3.5" /> Email all members
              </Button>
              <Button onClick={generate} variant="ghost" size="sm">
                <Sparkles className="w-3.5 h-3.5" /> Re-generate
              </Button>
            </div>
          </motion.div>

          {/* WhatsApp preview */}
          <details className="rounded-2xl border border-white/[0.07] bg-ink/40 p-5">
            <summary className="cursor-pointer text-[12px] text-faint uppercase tracking-wider">WhatsApp preview</summary>
            <pre className="mt-3 p-3 rounded-lg bg-[#0d291f] text-[#d8f5e1] text-[12px] leading-relaxed whitespace-pre-wrap font-mono">
{whatsappText()}
            </pre>
          </details>
        </div>
      )}
    </>
  );
}
