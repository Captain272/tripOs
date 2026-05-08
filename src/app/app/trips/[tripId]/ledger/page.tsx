"use client";

import * as React from "react";
import { use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Receipt as ReceiptIcon, Upload, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { track, EVENTS } from "@/lib/analytics";
import { inr, cn } from "@/lib/utils";

interface MemberLite { user_id: string | null; profile: { id: string; full_name: string | null; email: string | null } | null; }
interface SplitRow { id: string; user_id: string; split_amount: number; }
interface ExpenseRow {
  id: string;
  title: string;
  amount: number;
  expense_date: string | null;
  paid_by: string | null;
  category: string | null;
  receipt_url: string | null;
  notes: string | null;
  splits: SplitRow[];
  payer: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

const CATS = ["stay", "food", "fuel", "activity", "transfer", "shopping", "other"] as const;

export default function LedgerPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const { push } = useToast();

  const [members, setMembers] = React.useState<MemberLite[]>([]);
  const [expenses, setExpenses] = React.useState<ExpenseRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [mRes, eRes] = await Promise.all([
      fetch(`/api/trips/${tripId}`),
      fetch(`/api/expenses?trip_id=${tripId}`),
    ]);
    const mJson = await mRes.json();
    const eJson = await eRes.json();
    if (mJson.ok) setMembers(mJson.data.members);
    if (eJson.ok) setExpenses(eJson.data.expenses);
    setLoading(false);
  }, [tripId]);
  React.useEffect(() => { void load(); }, [load]);

  // form state
  const [paidBy, setPaidBy] = React.useState<string>("");
  const [splitIds, setSplitIds] = React.useState<Set<string>>(new Set());
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    // default: include everyone in the split, payer is the first member
    if (members.length && !paidBy) {
      const me = members.find((m) => m.profile)?.profile?.id || "";
      setPaidBy(me);
      setSplitIds(new Set(members.map((m) => m.profile?.id).filter((x): x is string => Boolean(x))));
    }
  }, [members, paidBy]);

  function toggleSplit(id: string) {
    setSplitIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function uploadReceipt(file: File): Promise<string | null> {
    const supabase = createSupabaseBrowserClient();
    const path = `${tripId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("trip-receipts").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      push({ title: "Upload failed", body: error.message });
      return null;
    }
    // signed URL (1 hour) — the row stores the path; we use the URL for preview only
    const { data } = await supabase.storage.from("trip-receipts").createSignedUrl(path, 60 * 60);
    return data?.signedUrl ?? path;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!paidBy) { push({ title: "Pick who paid" }); return; }
    if (splitIds.size === 0) { push({ title: "Pick at least one person to split with" }); return; }
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    let receipt_url: string | null = null;
    if (receiptFile) {
      receipt_url = await uploadReceipt(receiptFile);
    }
    const body = {
      trip_id: tripId,
      title: String(data.get("title") || ""),
      amount: Number(data.get("amount")),
      paid_by: paidBy,
      category: data.get("category") || null,
      expense_date: data.get("expense_date") || null,
      notes: data.get("notes") || null,
      receipt_url,
      split_user_ids: Array.from(splitIds),
    };
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!json.ok) { push({ title: "Could not add", body: json.error }); return; }
    track(EVENTS.EXPENSE_CREATED, { trip_id: tripId, amount: body.amount, category: body.category as string | null });
    push({ title: "Expense added" });
    setShowForm(false);
    setReceiptFile(null);
    (e.target as HTMLFormElement).reset();
    void load();
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Ledger</h2>
          <p className="text-sm text-muted">Every receipt belongs to a place, a day, and a person.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} size="sm">
          <Plus className="w-4 h-4" /> {showForm ? "Cancel" : "Add expense"}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={onSubmit}
            className="overflow-hidden mb-6"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-ink/40 p-5 grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="title">What was it?</Label>
                <Input id="title" name="title" required placeholder="Petrol — Indian Oil Hassan" />
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input id="amount" name="amount" type="number" min={0} step="0.01" required />
              </div>
              <div>
                <Label htmlFor="expense_date">Date</Label>
                <Input id="expense_date" name="expense_date" type="date" defaultValue={new Date().toISOString().slice(0,10)} />
              </div>
              <div>
                <Label htmlFor="paid_by">Paid by</Label>
                <Select id="paid_by" value={paidBy} onChange={(e) => setPaidBy(e.target.value)} required>
                  <option value="" disabled>Choose</option>
                  {members.map((m) => (
                    m.profile ? (
                      <option key={m.profile.id} value={m.profile.id}>
                        {m.profile.full_name || m.profile.email}
                      </option>
                    ) : null
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select id="category" name="category" defaultValue="">
                  <option value="">—</option>
                  {CATS.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Split with</Label>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    if (!m.profile) return null;
                    const checked = splitIds.has(m.profile.id);
                    return (
                      <button
                        type="button"
                        key={m.profile.id}
                        onClick={() => toggleSplit(m.profile!.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[12px] border transition-colors",
                          checked
                            ? "border-cyan/40 bg-cyan/15 text-cyan"
                            : "border-white/10 text-muted hover:text-fg"
                        )}
                      >
                        {m.profile.full_name || m.profile.email}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-faint mt-2">
                  {splitIds.size > 0 ? `Equal split between ${splitIds.size}` : "Pick at least one person"}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="receipt">Receipt (optional)</Label>
                <label className="flex items-center gap-3 rounded-xl border border-dashed border-white/[0.15] bg-bg/40 px-4 py-3 cursor-pointer hover:border-cyan/40">
                  <Upload className="w-4 h-4 text-faint" />
                  <span className="text-[12.5px] text-muted truncate">
                    {receiptFile ? receiptFile.name : "Upload a JPG / PNG / PDF"}
                  </span>
                  <input
                    id="receipt"
                    type="file"
                    className="sr-only"
                    accept="image/*,application/pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" placeholder="Any details" />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>) : "Add expense"}
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Total chip */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-surface/40 px-4 py-1.5 text-[12.5px]">
        <span className="text-faint">Total ledger:</span>
        <span className="font-mono font-semibold">{inr(total)}</span>
      </div>

      {loading ? (
        <div className="text-sm text-faint">Loading…</div>
      ) : expenses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.12] bg-surface/30 p-10 text-center">
          <ReceiptIcon className="mx-auto w-6 h-6 text-faint mb-3" />
          <div className="font-display text-lg">No expenses yet.</div>
          <p className="text-sm text-muted mt-1">Add one — splits and settlement will follow.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-ink/60 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="min-w-[640px] w-full text-[13px] border-collapse">
              <thead className="text-[10px] uppercase tracking-wider text-faint bg-white/[0.02]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Paid by</th>
                  <th className="text-left px-4 py-3 font-medium">Cat.</th>
                  <th className="text-left px-4 py-3 font-medium">Split</th>
                  <th className="text-left px-4 py-3 font-medium">Receipt</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-faint font-mono whitespace-nowrap">
                      {e.expense_date ? new Date(e.expense_date).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3 max-w-[14rem] truncate">{e.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{e.payer?.full_name || "—"}</td>
                    <td className="px-4 py-3">
                      {e.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-fg/70 capitalize">{e.category}</span>}
                    </td>
                    <td className="px-4 py-3 text-faint">{e.splits?.length ?? 0} ways</td>
                    <td className="px-4 py-3">
                      {e.receipt_url ? (
                        <a href={e.receipt_url} target="_blank" rel="noopener" className="text-emerald text-[11px] inline-flex items-center gap-1">
                          <ReceiptIcon className="w-3 h-3" /> view
                        </a>
                      ) : <span className="text-faint text-[11px]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{inr(Number(e.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
