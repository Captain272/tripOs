"use client";

/**
 * Problem section — 5 animated cards + a "chaos collapses into workspace" visual.
 */

import { motion } from "framer-motion";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { PROBLEMS } from "@/constants/landing";
import { cn } from "@/lib/utils";

const accentBg: Record<string, string> = {
  cyan: "bg-cyan/10 text-cyan",
  sunset: "bg-sunset/10 text-sunset",
  gold: "bg-gold/10 text-gold",
  emerald: "bg-emerald/10 text-emerald",
  violet: "bg-violet/10 text-violet",
  rose: "bg-rose/10 text-rose",
};

export function ProblemSection() {
  return (
    <Section id="problem">
      <Container>
        <SectionHeading
          eyebrow="The chaos"
          eyebrowAccent="sunset"
          title={
            <>
              Group trips are fun.
              <br />
              <span className="text-gradient-sunset">Planning them is chaos.</span>
            </>
          }
          description="Right now, every group trip lives across WhatsApp, Maps, Splitwise, screenshots, and 4 different camera rolls. Here's what breaks."
        />

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className={cn(
                "group relative rounded-2xl border border-white/[0.07] bg-surface/40 p-6 overflow-hidden",
                "hover:border-white/[0.14] transition-colors"
              )}
            >
              <div
                className={cn(
                  "grid place-items-center w-11 h-11 rounded-xl mb-5",
                  accentBg[p.accent]
                )}
              >
                <Icon name={p.icon} className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-semibold tracking-tight mb-1.5">
                {p.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">{p.body}</p>

              {/* hover sheen */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute -top-1/2 left-0 w-full h-32 bg-gradient-to-b from-white/[0.06] to-transparent" />
              </div>
            </motion.div>
          ))}

          {/* 6th tile: visual collapsing chaos -> workspace */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl border border-cyan/30 bg-gradient-to-br from-cyan/10 via-violet/5 to-sunset/10 p-6 overflow-hidden flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-cyan font-medium">
                With TripOS
              </div>
              <div className="font-display text-lg font-semibold tracking-tight mt-2 leading-snug">
                One workspace.
                <br />
                Zero chaos.
              </div>
            </div>

            {/* mini chaos -> order viz */}
            <div className="relative h-16">
              {[
                "0%", "12%", "24%", "36%", "48%", "60%", "72%", "84%",
              ].map((left, i) => (
                <motion.span
                  key={left}
                  className="absolute top-0 w-7 h-7 rounded-md border border-white/15 bg-ink/70 backdrop-blur-md"
                  style={{ left }}
                  initial={{ rotate: (i % 2 ? -1 : 1) * (10 + i * 3), y: 0 }}
                  whileInView={{ rotate: 0, y: 0, x: i * 2 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.1 + i * 0.05 }}
                />
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="absolute right-0 bottom-0 text-[11px] text-cyan font-mono"
              >
                → trip-workspace
              </motion.div>
            </div>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
