"use client";

/**
 * ComparisonSection — TripOS vs single-purpose tools.
 *
 * Layouts:
 *   - Desktop (md+): a 5-column matrix.
 *   - Mobile     : each feature becomes a stacked card showing the
 *                  TripOS check (highlighted) on top of three small
 *                  competitor pills. Far easier to scan on a phone.
 */

import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { COMPARISON } from "@/constants/landing";
import { cn } from "@/lib/utils";

const COL_LABELS = [
  { key: "planner", label: "AI itinerary tool", short: "Planner" },
  { key: "splitter", label: "Expense splitter", short: "Splitter" },
  { key: "storage", label: "Photo storage", short: "Storage" },
] as const;

function Cell({ on, highlight }: { on: boolean; highlight?: boolean }) {
  if (!on)
    return (
      <span className="grid place-items-center text-faint">
        <Minus className="w-4 h-4" />
      </span>
    );
  return (
    <span
      className={cn(
        "grid place-items-center w-7 h-7 rounded-full mx-auto",
        highlight
          ? "bg-emerald/15 text-emerald ring-1 ring-emerald/30"
          : "bg-white/[0.05] text-fg/70"
      )}
    >
      <Check className="w-4 h-4" strokeWidth={3} />
    </span>
  );
}

function MobileRowCard({
  row,
  i,
}: {
  row: (typeof COMPARISON)[number];
  i: number;
}) {
  const competitorVals: { key: "planner" | "splitter" | "storage"; on: boolean }[] = [
    { key: "planner", on: row.competitors.planner },
    { key: "splitter", on: row.competitors.splitter },
    { key: "storage", on: row.competitors.storage },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.03 }}
      className="rounded-2xl border border-white/[0.08] bg-ink/60 p-4"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-[14px] font-medium">{row.feature}</div>
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald bg-emerald/10 ring-1 ring-emerald/30 rounded-full pl-1.5 pr-2.5 py-0.5">
          <Check className="w-3 h-3" strokeWidth={3} />
          TripOS
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {competitorVals.map((c) => {
          const meta = COL_LABELS.find((cl) => cl.key === c.key)!;
          return (
            <div
              key={c.key}
              className={cn(
                "rounded-lg border px-2.5 py-2 flex items-center justify-between text-[11px]",
                c.on
                  ? "border-white/[0.12] bg-white/[0.03] text-fg/80"
                  : "border-white/[0.05] bg-bg/40 text-faint"
              )}
            >
              <span className="truncate">{meta.short}</span>
              {c.on ? (
                <Check className="w-3.5 h-3.5 text-fg/60 shrink-0" strokeWidth={2.5} />
              ) : (
                <Minus className="w-3.5 h-3.5 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function ComparisonSection() {
  return (
    <Section id="compare">
      <Container>
        <SectionHeading
          eyebrow="The difference"
          title={
            <>
              Not another itinerary planner.{" "}
              <span className="text-gradient-aurora">
                A shared OS for group travel.
              </span>
            </>
          }
          description="Most tools solve one part of the journey. TripOS connects the full lifecycle — from chaotic group chat to a beautiful, shareable trip story."
        />

        {/* ── Desktop matrix (md+) ─────────────────────── */}
        <div className="mt-12 hidden md:block rounded-3xl border border-white/[0.08] bg-ink/60 overflow-hidden">
          <div className="grid grid-cols-[1.6fr_repeat(4,1fr)] text-[11px] uppercase tracking-wider text-faint border-b border-white/[0.06]">
            <div className="px-4 sm:px-6 py-4 font-medium">Feature</div>
            {COL_LABELS.map((c) => (
              <div key={c.key} className="px-2 py-4 font-medium text-center">
                {c.label}
              </div>
            ))}
            <div className="px-2 py-4 text-center font-medium text-cyan">
              TripOS
            </div>
          </div>

          {COMPARISON.map((row, i) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "grid grid-cols-[1.6fr_repeat(4,1fr)] items-center border-b border-white/[0.04] last:border-0",
                i % 2 === 1 && "bg-white/[0.015]"
              )}
            >
              <div className="px-4 sm:px-6 py-3.5 text-[13px] text-fg/90">
                {row.feature}
              </div>
              <div className="px-2 py-3.5 text-center">
                <Cell on={row.competitors.planner} />
              </div>
              <div className="px-2 py-3.5 text-center">
                <Cell on={row.competitors.splitter} />
              </div>
              <div className="px-2 py-3.5 text-center">
                <Cell on={row.competitors.storage} />
              </div>
              <div className="px-2 py-3.5 text-center">
                <Cell on={row.tripos} highlight />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Mobile stacked cards (under md) ──────────── */}
        <div className="mt-12 md:hidden space-y-3">
          {COMPARISON.map((row, i) => (
            <MobileRowCard key={row.feature} row={row} i={i} />
          ))}
        </div>

        <p className="mt-8 text-[12px] text-faint text-center max-w-2xl mx-auto">
          We&apos;re fans of every tool above — they each do their thing well.
          TripOS is the connective tissue that turns them into a single group
          experience.
        </p>
      </Container>
    </Section>
  );
}
