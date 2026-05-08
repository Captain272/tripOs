"use client";

/**
 * AiParserDemo — left: messy chat-style input, right: structured AI output.
 * Lines fade in on the left and "parse" into structured cards on the right.
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2 } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { track, EVENTS } from "@/lib/analytics";
import {
  AI_PARSER_INPUT,
  AI_PARSER_OUTPUT,
  TRIP_MEMBERS,
} from "@/constants/landing";
import type { IconName } from "@/types/landing";
import { cn } from "@/lib/utils";

const KIND_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  expense: { bg: "bg-cyan/10", text: "text-cyan", label: "Expense" },
  split: { bg: "bg-violet/10", text: "text-violet", label: "Split rule" },
  itinerary: { bg: "bg-emerald/10", text: "text-emerald", label: "Itinerary" },
  vote: { bg: "bg-sunset/10", text: "text-sunset", label: "Vote" },
  budget: { bg: "bg-gold/10", text: "text-gold", label: "Budget" },
};

export function AiParserDemo() {
  // step = number of parsed lines visible. Cycles via interval.
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s >= AI_PARSER_INPUT.length ? 0 : s + 1));
    }, 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <Section id="ai">
      <Container>
        <SectionHeading
          eyebrow="The AI"
          eyebrowAccent="sunset"
          title={
            <>
              Paste messy trip chaos.
              <br />
              <span className="text-gradient-sunset">
                AI turns it into structure.
              </span>
            </>
          }
          description="Voice notes, screenshots, half-sentences from the group chat. TripOS reads it all and builds your itinerary, ledger, and settlement automatically."
        />

        <div className="mt-12 grid lg:grid-cols-2 gap-5 lg:gap-7 items-start">
          {/* INPUT — chat style */}
          <div className="relative rounded-3xl border border-white/[0.08] bg-ink/60 p-5 sm:p-6 min-h-[440px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-faint">
                <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                Group chat · Goa squad
              </div>
              <span className="text-[10px] font-mono text-faint">
                {AI_PARSER_INPUT.length} messages
              </span>
            </div>
            <div className="space-y-2.5">
              {AI_PARSER_INPUT.map((line, i) => {
                const member = TRIP_MEMBERS[i % TRIP_MEMBERS.length];
                const visible = i < step;
                return (
                  <motion.div
                    key={i}
                    animate={{
                      opacity: visible ? 1 : 0.35,
                      x: 0,
                    }}
                    transition={{ duration: 0.4 }}
                    className="flex items-start gap-2.5"
                  >
                    <span
                      className="mt-1 grid place-items-center w-6 h-6 rounded-full text-[9px] font-semibold text-bg"
                      style={{ background: member.color }}
                    >
                      {member.initials}
                    </span>
                    <div
                      className={cn(
                        "relative max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2 text-[13px] leading-snug border",
                        visible
                          ? "bg-[#1a3a2a] text-[#d8f5e1] border-emerald/20"
                          : "bg-white/[0.03] text-faint border-white/[0.06]"
                      )}
                    >
                      {line}
                      {visible && i === step - 1 && (
                        <motion.span
                          layoutId="parse-cursor"
                          className="absolute -right-2 -top-2 grid place-items-center w-5 h-5 rounded-full bg-cyan text-bg text-[9px]"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* parser status footer */}
            <div className="mt-6 pt-4 border-t border-white/[0.05] flex items-center justify-between">
              <div className="text-[11px] text-faint">AI parser status</div>
              <div className="text-[11px] text-cyan font-mono">
                {step} / {AI_PARSER_INPUT.length} parsed
              </div>
            </div>
          </div>

          {/* OUTPUT — structured cards */}
          <div className="relative rounded-3xl border border-cyan/20 bg-gradient-to-br from-surface/70 to-ink/70 p-5 sm:p-6 min-h-[440px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-cyan">
                <Wand2 className="w-3 h-3" /> Structured by TripOS AI
              </div>
              <span className="text-[10px] font-mono text-faint">live</span>
            </div>

            <div className="space-y-2.5">
              <AnimatePresence>
                {AI_PARSER_OUTPUT.slice(0, step).map((o, i) => {
                  const style = KIND_STYLES[o.kind];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-ink/70 px-3.5 py-3"
                    >
                      <span
                        className={cn(
                          "grid place-items-center w-9 h-9 rounded-lg shrink-0",
                          style.bg,
                          style.text
                        )}
                      >
                        <Icon name={o.icon as IconName} className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "text-[10px] uppercase tracking-wider font-medium",
                            style.text
                          )}
                        >
                          {style.label}
                        </div>
                        <div className="text-[13px] text-fg/90 leading-snug truncate">
                          {o.text}
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald font-mono">
                        ✓
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {step === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center">
                  <div className="text-sm text-muted">
                    Watching the chat for messages…
                  </div>
                  <div className="text-[11px] text-faint mt-1">
                    Structured cards will appear here
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.05] flex items-center justify-between">
              <div className="text-[11px] text-faint">
                Itinerary · Ledger · Vote · Budget — auto-updated
              </div>
              <ButtonLink
                href="#waitlist"
                size="sm"
                onClick={() =>
                  track(EVENTS.TRIP_PARSER_DEMO_CLICK, {
                    parsed_lines: step,
                    source: "ai_parser_section",
                  })
                }
              >
                Try the AI parser
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
