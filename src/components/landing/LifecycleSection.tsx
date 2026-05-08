"use client";

/**
 * Lifecycle: Before -> During -> After
 * Horizontal animated timeline with glowing nodes; each phase is a card with bullets.
 */

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { LIFECYCLE } from "@/constants/landing";
import { cn } from "@/lib/utils";

const accentMap: Record<string, { dot: string; glow: string; text: string; ring: string }> = {
  cyan: {
    dot: "bg-cyan",
    glow: "shadow-[0_0_0_6px_rgba(56,225,255,0.15)]",
    text: "text-cyan",
    ring: "ring-cyan/30",
  },
  sunset: {
    dot: "bg-sunset",
    glow: "shadow-[0_0_0_6px_rgba(255,140,74,0.15)]",
    text: "text-sunset",
    ring: "ring-sunset/30",
  },
  emerald: {
    dot: "bg-emerald",
    glow: "shadow-[0_0_0_6px_rgba(52,211,153,0.15)]",
    text: "text-emerald",
    ring: "ring-emerald/30",
  },
};

export function LifecycleSection() {
  return (
    <Section id="lifecycle">
      <Container>
        <SectionHeading
          eyebrow="The lifecycle"
          title={
            <>
              One workspace for the
              <br className="hidden sm:block" />{" "}
              <span className="text-gradient-aurora">whole trip lifecycle.</span>
            </>
          }
          description="Most tools solve one part of the journey. TripOS connects before, during, and after — into a single shared space your group can live in."
        />

        {/* Timeline */}
        <div className="relative mt-16">
          {/* connecting line (desktop) */}
          <div className="hidden lg:block absolute top-8 left-[8%] right-[8%] h-px bg-gradient-to-r from-cyan/0 via-cyan/40 to-sunset/40" />
          <div className="hidden lg:block absolute top-8 left-1/2 right-[8%] h-px bg-gradient-to-r from-sunset/40 to-emerald/40" />

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {LIFECYCLE.map((phase, i) => {
              const a = accentMap[phase.accent];
              return (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="relative"
                >
                  {/* Node */}
                  <div className="flex items-center gap-4 mb-5 lg:justify-start">
                    <span
                      className={cn(
                        "relative grid place-items-center w-4 h-4 rounded-full",
                        a.dot,
                        a.glow
                      )}
                    >
                      <span
                        className={cn(
                          "absolute inset-0 rounded-full opacity-70 animate-ping",
                          a.dot
                        )}
                      />
                    </span>
                    <span
                      className={cn(
                        "text-[11px] uppercase tracking-[0.2em] font-medium",
                        a.text
                      )}
                    >
                      {phase.phase} the trip
                    </span>
                  </div>

                  {/* Card */}
                  <div
                    className={cn(
                      "rounded-2xl border border-white/10 bg-surface/40 p-6 sm:p-7 ring-1",
                      a.ring
                    )}
                  >
                    <h3 className="font-display text-xl sm:text-2xl font-semibold tracking-tight">
                      {phase.title}
                    </h3>
                    <ul className="mt-5 space-y-2.5">
                      {phase.items.map((it) => (
                        <li
                          key={it}
                          className="flex items-start gap-2.5 text-sm text-fg/85"
                        >
                          <span
                            className={cn(
                              "mt-0.5 grid place-items-center w-4 h-4 rounded-full bg-white/[0.06]",
                              a.text
                            )}
                          >
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </span>
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
