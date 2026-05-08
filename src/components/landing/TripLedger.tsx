"use client";

/**
 * TripLedger section — explains why trip-context money beats generic splitters.
 * Pairs a feature list with a bigger ledger table preview that shows
 * AI superpowers (OCR, duplicate detection, missing payer, etc.).
 */

import { motion } from "framer-motion";
import {
  ScanLine,
  Copy,
  UserMinus,
  SplitSquareHorizontal,
  Layers3,
  Bell,
  BadgeCheck,
} from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Avatar } from "@/components/ui/Avatar";
import { EXPENSES, TRIP_MEMBERS } from "@/constants/landing";
import { inr, cn } from "@/lib/utils";

const AI_FEATURES = [
  { icon: ScanLine, title: "Receipt OCR", body: "Snap a bill — AI fills the row." },
  { icon: Copy, title: "Duplicate detection", body: "Flags when the same bill is added twice." },
  { icon: UserMinus, title: "Missing payer", body: "Notices when a stop has no expense logged." },
  { icon: SplitSquareHorizontal, title: "Custom splits", body: "Exclude members per item, no math needed." },
  { icon: Layers3, title: "Settlement minimization", body: "Fewest possible transactions to clear all dues." },
  { icon: Bell, title: "WhatsApp reminders", body: "Polite nudges with UPI links to settle." },
];

export function TripLedger() {
  return (
    <Section id="ledger">
      <Container>
        <SectionHeading
          eyebrow="The money layer"
          eyebrowAccent="emerald"
          align="left"
          title={
            <>
              The money layer built
              <br />
              specifically for{" "}
              <span className="text-gradient-aurora">travel.</span>
            </>
          }
          description="Splitwise is generic. TripOS connects every rupee to a day, a place, a person, and an itinerary item. So you actually know what was spent — and why."
        />

        <div className="mt-12 grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10 items-start">
          {/* Bigger ledger preview */}
          <div className="rounded-3xl border border-white/[0.08] bg-ink/60 p-4 sm:p-5 overflow-hidden">
            {/* mock window header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="text-[11px] uppercase tracking-wider text-faint">
                Ledger · 5 entries · Mar 2026
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald">
                <BadgeCheck className="w-3 h-3" /> AI verified
              </span>
            </div>
            <div className="overflow-x-auto -mx-1 mt-2">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-faint">
                    <th className="px-2 py-2 font-medium">Date</th>
                    <th className="px-2 py-2 font-medium">Place</th>
                    <th className="px-2 py-2 font-medium">Paid by</th>
                    <th className="px-2 py-2 font-medium">Category</th>
                    <th className="px-2 py-2 font-medium">Split</th>
                    <th className="px-2 py-2 font-medium">Receipt</th>
                    <th className="px-2 py-2 font-medium text-right">Amount</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {EXPENSES.map((e, i) => {
                    const paid = TRIP_MEMBERS.find((m) => m.name === e.paidBy);
                    return (
                      <motion.tr
                        key={e.id}
                        initial={{ opacity: 0, y: 6 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="border-t border-white/[0.04] hover:bg-white/[0.02]"
                      >
                        <td className="px-2 py-2.5 font-mono text-faint whitespace-nowrap">
                          {e.date}
                        </td>
                        <td className="px-2 py-2.5 text-fg/90 whitespace-nowrap max-w-[10rem] truncate">
                          {e.place}
                        </td>
                        <td className="px-2 py-2.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            {paid && <Avatar member={paid} size={20} />}
                            <span>{e.paidBy}</span>
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-fg/70">
                            {e.category}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-faint whitespace-nowrap">
                          {e.splitBetween.length} ways
                        </td>
                        <td className="px-2 py-2.5">
                          {e.receipt ? (
                            <span className="inline-flex items-center gap-1 text-emerald text-[10px]">
                              <ScanLine className="w-3 h-3" /> AI
                            </span>
                          ) : (
                            <span className="text-faint text-[10px]">missing</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-right font-mono text-fg whitespace-nowrap">
                          {inr(e.amount)}
                        </td>
                        <td className="px-2 py-2.5">
                          <span
                            className={cn(
                              "inline-flex text-[10px] px-2 py-0.5 rounded-full",
                              e.status === "settled"
                                ? "bg-emerald/15 text-emerald"
                                : "bg-gold/15 text-gold"
                            )}
                          >
                            {e.status}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-xl border border-cyan/20 bg-cyan/5 px-4 py-3 text-[12px] flex items-start gap-3">
              <ScanLine className="w-4 h-4 text-cyan mt-0.5 shrink-0" />
              <span className="text-fg/85">
                <span className="text-cyan font-medium">AI:</span> Receipt for
                Coorgi Cuisine looks missing. Tap to scan one — split was
                detected automatically.
              </span>
            </div>
          </div>

          {/* Right: feature grid */}
          <div>
            <p className="text-base text-muted leading-relaxed mb-6">
              <strong className="text-fg">Every receipt belongs to a place,
                a day, and a person.</strong>{" "}
              That context unlocks superpowers no spreadsheet can match.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {AI_FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-white/[0.08] bg-surface/40 p-4 hover:border-emerald/30 transition-colors"
                >
                  <span className="grid place-items-center w-9 h-9 rounded-lg bg-emerald/10 text-emerald mb-3">
                    <f.icon className="w-4 h-4" />
                  </span>
                  <div className="text-sm font-medium">{f.title}</div>
                  <div className="text-xs text-muted mt-1">{f.body}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
