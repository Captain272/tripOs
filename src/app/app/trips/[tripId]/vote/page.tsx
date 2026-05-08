"use client";

import * as React from "react";
import { use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Vote as VoteIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface PollOption {
  id: string; title: string; description: string | null;
  vote_count: number;
}
interface Poll {
  id: string; title: string; description: string | null; type: string | null;
  options: PollOption[]; total_votes: number; voted_option_id: string | null;
}

export default function VotePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const { push } = useToast();
  const [polls, setPolls] = React.useState<Poll[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [optionRows, setOptionRows] = React.useState([{ title: "" }, { title: "" }]);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/polls?trip_id=${tripId}`);
    const json = await res.json();
    if (json.ok) setPolls(json.data.polls);
    setLoading(false);
  }, [tripId]);
  React.useEffect(() => { void load(); }, [load]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = {
      trip_id: tripId,
      title: data.get("title"),
      description: data.get("description") || null,
      type: data.get("type") || null,
      options: optionRows.filter((o) => o.title.trim()).map((o) => ({ title: o.title })),
    };
    if (body.options.length < 2) {
      push({ title: "Need at least 2 options" });
      return;
    }
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) { push({ title: "Failed", body: json.error }); return; }
    setShowForm(false);
    setOptionRows([{ title: "" }, { title: "" }]);
    void load();
  }

  async function castVote(poll_id: string, option_id: string) {
    // optimistic UI
    setPolls((prev) => prev.map((p) => {
      if (p.id !== poll_id) return p;
      const prevVoted = p.voted_option_id;
      return {
        ...p,
        voted_option_id: option_id,
        total_votes: prevVoted ? p.total_votes : p.total_votes + 1,
        options: p.options.map((o) => ({
          ...o,
          vote_count:
            o.id === option_id
              ? o.vote_count + 1
              : o.id === prevVoted
              ? Math.max(0, o.vote_count - 1)
              : o.vote_count,
        })),
      };
    }));
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poll_id, option_id }),
    });
    const json = await res.json();
    if (!json.ok) {
      push({ title: "Vote failed", body: json.error });
      void load();
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Group polls</h2>
          <p className="text-sm text-muted">One vote per person. Closes when admin sets a deadline.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} size="sm">
          <Plus className="w-4 h-4" /> {showForm ? "Cancel" : "New poll"}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={onCreate}
            className="overflow-hidden mb-6"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-ink/40 p-5 space-y-4">
              <div>
                <Label htmlFor="title">Question</Label>
                <Input id="title" name="title" required placeholder="Hotel A or Hotel B?" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select id="type" name="type" defaultValue="">
                    <option value="">—</option>
                    <option value="hotel">Hotel</option>
                    <option value="activity">Activity</option>
                    <option value="date">Date</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="custom">Custom</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Notes (optional)</Label>
                <Textarea id="description" name="description" />
              </div>
              <div>
                <Label>Options</Label>
                <div className="space-y-2">
                  {optionRows.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={opt.title}
                        onChange={(e) => {
                          const next = [...optionRows];
                          next[i] = { title: e.target.value };
                          setOptionRows(next);
                        }}
                        placeholder={`Option ${i + 1}`}
                      />
                      {optionRows.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setOptionRows((p) => p.filter((_, j) => j !== i))}
                          className="grid place-items-center w-11 h-11 rounded-xl text-faint hover:text-rose hover:bg-rose/10"
                          aria-label="Remove option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setOptionRows((p) => [...p, { title: "" }])}
                  className="mt-2 text-[12px] text-cyan hover:text-cyan-soft"
                >
                  + add option
                </button>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Create poll</Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-sm text-faint">Loading polls…</div>
      ) : polls.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.12] bg-surface/30 p-10 text-center">
          <VoteIcon className="mx-auto w-6 h-6 text-faint mb-3" />
          <div className="font-display text-lg">No polls yet.</div>
          <p className="text-sm text-muted mt-1">Create one — group decisions in 90 seconds.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {polls.map((p) => {
            const winning = p.options.reduce<PollOption | null>(
              (w, o) => (!w || o.vote_count > w.vote_count ? o : w),
              null
            );
            return (
              <div key={p.id} className="rounded-2xl border border-white/[0.07] bg-surface/40 p-5">
                <div className="font-display font-semibold">{p.title}</div>
                {p.description && <div className="text-[12.5px] text-muted mt-1">{p.description}</div>}
                <div className="space-y-2 mt-4">
                  {p.options.map((o) => {
                    const total = Math.max(1, p.total_votes);
                    const pct = (o.vote_count / total) * 100;
                    const myChoice = p.voted_option_id === o.id;
                    const isWinner = winning?.id === o.id && o.vote_count > 0;
                    return (
                      <button
                        key={o.id}
                        onClick={() => castVote(p.id, o.id)}
                        className={cn(
                          "w-full text-left rounded-xl border px-3 py-2.5 transition-colors group",
                          myChoice
                            ? "border-cyan/40 bg-cyan/10"
                            : "border-white/[0.07] bg-bg/40 hover:border-white/[0.18]"
                        )}
                      >
                        <div className="flex justify-between text-[13px] mb-1">
                          <span className={cn(isWinner && "text-emerald font-medium")}>
                            {o.title} {isWinner ? "✓" : ""}
                          </span>
                          <span className="text-faint font-mono text-[11px]">{o.vote_count} / {p.total_votes}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isWinner
                                ? "bg-gradient-to-r from-cyan to-emerald"
                                : "bg-violet/60"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
