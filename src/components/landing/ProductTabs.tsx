"use client";

/**
 * ProductTabs — the in-page interactive product demo.
 * Six tabs (Plan / Vote / Budget / Ledger / Settle / Memories), each with a
 * unique mocked UI. Tab buttons scroll horizontally on mobile.
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Receipt as ReceiptIcon,
  Camera,
  Download,
  Share2,
  Sparkles,
  Clock,
} from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import {
  PRODUCT_TABS,
  TRIP_MEMBERS,
  TRIP,
  ITINERARY,
  EXPENSES,
  SETTLEMENT,
} from "@/constants/landing";
import type { ProductTabKey } from "@/types/landing";
import { inr, num, cn } from "@/lib/utils";

// --- Per-tab mock UIs ----------------------------------------------------

function PlanTab() {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {ITINERARY.map((d) => (
        <div
          key={d.day}
          className="rounded-xl border border-white/[0.07] bg-ink/60 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-cyan">
                Day {d.day}
              </div>
              <div className="text-sm font-medium">{d.date}</div>
            </div>
            <div className="text-[10px] text-faint font-mono text-right max-w-[6rem] truncate">
              {d.route}
            </div>
          </div>
          <div className="space-y-2 relative">
            <span className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-white/10" />
            {d.stops.map((s, i) => (
              <div
                key={i}
                className="relative flex items-start gap-3 text-[12px]"
              >
                <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-cyan/80 ring-2 ring-cyan/20" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <span className="text-fg/90 truncate">{s.title}</span>
                    <span className="text-faint font-mono text-[10px]">
                      {s.time}
                    </span>
                  </div>
                  {s.note && (
                    <div className="text-faint text-[10.5px] mt-0.5">
                      {s.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function VoteTab() {
  const polls = [
    {
      title: "Hotel pick",
      options: [
        { name: "Hotel A · Pool view", votes: 2, color: "violet" },
        { name: "Hotel B · Misty Estate", votes: 4, color: "cyan", winning: true },
        { name: "Hotel C · Budget stay", votes: 0, color: "rose" },
      ],
      meta: "Closes today · 9 PM",
    },
    {
      title: "Day 2 activity",
      options: [
        { name: "Jeep Safari", votes: 5, color: "emerald", winning: true },
        { name: "Plantation walk", votes: 3, color: "gold" },
      ],
      meta: "Closed · selected",
    },
  ];
  const colorBar: Record<string, string> = {
    violet: "from-violet/40 to-violet/80",
    cyan: "from-cyan/60 to-emerald/80",
    emerald: "from-emerald/60 to-cyan/80",
    rose: "from-rose/40 to-rose/70",
    gold: "from-gold/60 to-sunset/70",
  };
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {polls.map((p) => {
        const total = p.options.reduce((s, o) => s + o.votes, 0) || 1;
        return (
          <div
            key={p.title}
            className="rounded-xl border border-white/[0.07] bg-ink/60 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">{p.title}</div>
              <div className="text-[10px] text-faint flex items-center gap-1">
                <Clock className="w-3 h-3" /> {p.meta}
              </div>
            </div>
            <div className="space-y-2.5">
              {p.options.map((o) => (
                <div key={o.name}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span
                      className={cn(
                        "truncate",
                        o.winning ? "text-emerald font-medium" : "text-fg/85"
                      )}
                    >
                      {o.name} {o.winning && "✓"}
                    </span>
                    <span className="text-faint font-mono text-[10px]">
                      {o.votes} / {total}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        colorBar[o.color]
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${(o.votes / total) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BudgetTab() {
  const rows = [
    { label: "Stay", value: 3200, color: "#38e1ff" },
    { label: "Food", value: 1800, color: "#a78bfa" },
    { label: "Transport", value: 2400, color: "#34d399" },
  ];
  const total = rows.reduce((s, r) => s + r.value, 0);
  const cap = 6000;
  const over = total - cap;
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="rounded-xl border border-white/[0.07] bg-ink/60 p-5">
        <div className="text-[10px] uppercase tracking-wider text-cyan mb-1">
          Per person estimate
        </div>
        <div className="font-display text-3xl font-semibold tracking-tight">
          {inr(total)}
        </div>
        <div className="text-[11px] text-faint">Group of 5 · 3 days</div>

        {/* Stacked bar */}
        <div className="mt-5 h-2.5 rounded-full overflow-hidden bg-white/5 flex">
          {rows.map((r) => (
            <div
              key={r.label}
              style={{ width: `${(r.value / total) * 100}%`, background: r.color }}
            />
          ))}
        </div>
        <div className="mt-3 space-y-1.5">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex justify-between items-center text-[12px]"
            >
              <span className="flex items-center gap-2 text-fg/85">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: r.color }}
                />
                {r.label}
              </span>
              <span className="font-mono text-faint">{inr(r.value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-sunset/30 bg-sunset/5 p-5 flex flex-col">
        <div className="flex items-center gap-2 text-sunset text-[11px] uppercase tracking-wider font-medium">
          <AlertTriangle className="w-3.5 h-3.5" /> AI alert
        </div>
        <div className="font-display text-lg font-semibold mt-2 leading-snug">
          Group cap is{" "}
          <span className="text-gradient-sunset">{inr(cap)} / person</span>
        </div>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          You’re currently <strong className="text-fg">{inr(over)}</strong> over
          the cap. Tip: switch to Hotel B (saves ₹900) or skip Day 3 lunch
          buffet.
        </p>
        <div className="mt-auto pt-4 flex items-center gap-2">
          <span className="text-[11px] text-faint">Suggested action</span>
          <ArrowRight className="w-3 h-3 text-sunset" />
          <span className="text-[12px] text-sunset font-medium">
            Apply &amp; revote
          </span>
        </div>
      </div>
    </div>
  );
}

function LedgerTab() {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-ink/60 overflow-hidden">
      {/* Horizontal scroll wrapper for narrow viewports */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[640px]">
      <div className="grid grid-cols-[0.8fr_1.5fr_1fr_0.8fr_0.6fr_0.6fr] gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider text-faint border-b border-white/[0.05] bg-white/[0.02]">
        <span>Date</span>
        <span>Place</span>
        <span>Paid by</span>
        <span>Cat.</span>
        <span className="text-right">Receipt</span>
        <span className="text-right">Amount</span>
      </div>
      <div>
        {EXPENSES.map((e, i) => {
          const paid = TRIP_MEMBERS.find((m) => m.name === e.paidBy);
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-[0.8fr_1.5fr_1fr_0.8fr_0.6fr_0.6fr] gap-3 px-4 py-3 text-[12px] items-center border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
            >
              <span className="text-faint font-mono">{e.date}</span>
              <span className="text-fg/90 truncate">{e.place}</span>
              <span className="flex items-center gap-2 min-w-0">
                {paid && <Avatar member={paid} size={20} />}
                <span className="text-fg/90 truncate">{e.paidBy}</span>
              </span>
              <span>
                <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-fg/70">
                  {e.category}
                </span>
              </span>
              <span className="flex justify-end">
                {e.receipt ? (
                  <span className="inline-flex items-center gap-1 text-emerald text-[10px]">
                    <ReceiptIcon className="w-3 h-3" /> AI
                  </span>
                ) : (
                  <span className="text-faint text-[10px]">—</span>
                )}
              </span>
              <span className="text-right font-mono text-fg">
                {inr(e.amount)}
              </span>
            </motion.div>
          );
        })}
      </div>
        </div>
      </div>
    </div>
  );
}

function SettleTab() {
  return (
    <div className="grid sm:grid-cols-[1.2fr_1fr] gap-4">
      <div className="rounded-xl border border-white/[0.07] bg-ink/60 p-5">
        <div className="text-[10px] uppercase tracking-wider text-emerald mb-1">
          Final settlement · Goa Weekend 2026
        </div>
        <div className="font-display text-lg font-semibold mb-4">
          3 transactions clear all balances
        </div>
        <div className="space-y-2">
          {SETTLEMENT.map((tx, i) => {
            const from = TRIP_MEMBERS.find((m) => m.name === tx.from);
            const to = TRIP_MEMBERS.find((m) => m.name === tx.to);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
              >
                <div className="flex items-center gap-2 text-[12px] min-w-0">
                  {from && <Avatar member={from} size={22} />}
                  <span className="text-fg/90 truncate">{tx.from}</span>
                  <ArrowRight className="w-3 h-3 text-faint" />
                  {to && <Avatar member={to} size={22} />}
                  <span className="text-fg/90 truncate">{tx.to}</span>
                </div>
                <span className="font-mono text-emerald text-sm">
                  {inr(tx.amount)}
                </span>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border border-white/15 hover:bg-white/[0.06]">
            <Share2 className="w-3 h-3" /> Send to WhatsApp
          </button>
          <button className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border border-white/15 hover:bg-white/[0.06]">
            <Download className="w-3 h-3" /> Download PDF
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-5">
        <CheckCircle2 className="w-5 h-5 text-emerald mb-3" />
        <div className="font-display text-lg font-semibold leading-snug">
          Settle the trip without
          <br />
          awkward money fights.
        </div>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          TripOS minimizes the number of transactions, sends polite reminders,
          and exports a signed PDF receipt for the group.
        </p>
      </div>
    </div>
  );
}

function MemoriesTab() {
  return (
    <div className="grid sm:grid-cols-[1.1fr_1fr] gap-4">
      {/* Storybook cover preview */}
      <div className="relative rounded-xl border border-white/[0.07] bg-gradient-to-br from-sunset/15 via-violet/10 to-cyan/15 p-5 overflow-hidden min-h-[280px]">
        {/* photo grid */}
        <div className="grid grid-cols-4 gap-1.5 mb-5">
          {[
            "#ff8c4a", "#38e1ff", "#a78bfa", "#34d399",
            "#ffd27a", "#fb7185", "#38e1ff", "#ff8c4a",
          ].map((c, i) => (
            <div
              key={i}
              className="aspect-square rounded-md border border-white/15"
              style={{
                background: `linear-gradient(135deg, ${c}, rgba(0,0,0,0.5))`,
              }}
            />
          ))}
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gold">
          Trip Capsule
        </div>
        <div className="font-display text-2xl font-semibold mt-1">
          {TRIP.name}
        </div>
        <div className="text-[12px] text-muted mt-1">
          A storybook by 5 travelers · Mar 2026
        </div>
        <div className="absolute bottom-4 right-5 inline-flex items-center gap-1.5 text-[10px] text-gold">
          <Camera className="w-3 h-3" /> {num(TRIP.photos)} photos
        </div>
      </div>

      {/* Wrapped stats */}
      <div className="rounded-xl border border-white/[0.07] bg-ink/60 p-5 flex flex-col">
        <div className="text-[10px] uppercase tracking-wider text-cyan mb-1">
          Trip Wrapped
        </div>
        <div className="font-display text-lg font-semibold leading-snug">
          Your group, in numbers
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            { l: "Travelers", v: num(TRIP.travelers) },
            { l: "Days", v: num(TRIP.days) },
            { l: "Photos", v: num(TRIP.photos) },
            { l: "Places", v: num(TRIP.places) },
            { l: "KM traveled", v: num(TRIP.km) },
            { l: "Per person", v: inr(TRIP.perHead) },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-lg bg-white/[0.025] border border-white/[0.05] px-3 py-2.5"
            >
              <div className="font-mono text-[10px] text-faint">{s.l}</div>
              <div className="font-display text-base font-semibold mt-0.5">
                {s.v}
              </div>
            </div>
          ))}
        </div>
        <button className="mt-5 inline-flex items-center justify-center gap-1.5 text-[12px] px-4 py-2 rounded-full bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25">
          <Download className="w-3.5 h-3.5" /> Download storybook PDF
        </button>
      </div>
    </div>
  );
}

const RENDERERS: Record<ProductTabKey, React.ComponentType> = {
  plan: PlanTab,
  vote: VoteTab,
  budget: BudgetTab,
  ledger: LedgerTab,
  settle: SettleTab,
  memories: MemoriesTab,
};

export function ProductTabs() {
  const [active, setActive] = React.useState<ProductTabKey>("plan");
  const tab = PRODUCT_TABS.find((t) => t.key === active)!;
  const Render = RENDERERS[active];

  return (
    <Section id="product">
      <Container>
        <SectionHeading
          eyebrow="The product"
          title={
            <>
              Everything your group needs,
              <br className="hidden sm:block" />{" "}
              <span className="text-gradient-aurora">in one trip workspace.</span>
            </>
          }
          description="Six tabs. One trip. Click through to see what your group sees."
        />

        {/* Tab buttons */}
        <div className="mt-12 -mx-5 sm:mx-0">
          <div className="no-scrollbar overflow-x-auto px-5 sm:px-0">
            <div className="inline-flex gap-1.5 p-1.5 rounded-full border border-white/[0.07] bg-surface/50 backdrop-blur-md">
              {PRODUCT_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={cn(
                    "relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap",
                    active === t.key
                      ? "text-bg"
                      : "text-muted hover:text-fg"
                  )}
                >
                  {active === t.key && (
                    <motion.span
                      layoutId="active-tab"
                      className="absolute inset-0 rounded-full bg-gradient-to-b from-cyan to-cyan-soft -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                    />
                  )}
                  <Icon name={t.icon} className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-8 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-surface/60 to-ink/60 p-5 sm:p-7 lg:p-8 shadow-[0_30px_120px_-30px_rgba(0,0,0,0.7)]">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="max-w-xl">
              <div className="text-[11px] uppercase tracking-[0.2em] text-cyan font-medium mb-2 inline-flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> {tab.label}
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-semibold leading-snug tracking-tight">
                {tab.headline}
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                {tab.description}
              </p>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Render />
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </Section>
  );
}
