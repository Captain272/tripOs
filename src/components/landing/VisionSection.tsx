"use client";

/**
 * VisionSection — YC-style narrative + a vision pyramid
 * built from the bottom up so each layer earns the next.
 */

import { motion } from "framer-motion";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { VISION_LAYERS } from "@/constants/landing";

const LAYER_COLORS = [
  "from-cyan/30 to-cyan/10",
  "from-violet/30 to-violet/10",
  "from-emerald/30 to-emerald/10",
  "from-gold/30 to-gold/10",
  "from-sunset/30 to-sunset/10",
  "from-rose/30 to-rose/10",
];

export function VisionSection() {
  // Reverse so the foundation (Trip Workspace) is at the bottom
  const layersBottomUp = [...VISION_LAYERS].reverse();
  const totalWidthAtTop = 50; // smallest layer width %

  return (
    <Section id="vision">
      <Container>
        <SectionHeading
          eyebrow="The vision"
          eyebrowAccent="cyan"
          title={
            <>
              The future of group travel
              <br className="hidden sm:block" />{" "}
              isn&apos;t booking.{" "}
              <span className="text-gradient-aurora">It&apos;s coordination.</span>
            </>
          }
          description="Travel platforms focus on discovery and booking. But group travel breaks before the booking — when people need to agree, pay, coordinate, and remember. TripOS starts with the group workspace and expands into bookings, partners, creators, and travel commerce."
        />

        <div className="mt-14 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          {/* Pyramid */}
          <div className="relative max-w-[520px] mx-auto w-full">
            <div className="space-y-2">
              {layersBottomUp.map((layer, i) => {
                // i=0 -> base (widest), i=last -> tip (narrowest)
                const total = layersBottomUp.length;
                const width =
                  100 - ((total - 1 - i) * (100 - totalWidthAtTop)) / (total - 1);
                const colorIdx =
                  layersBottomUp.length - 1 - i; // align colors with original order
                return (
                  <motion.div
                    key={layer.label}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (total - 1 - i) * 0.07 }}
                    className="mx-auto rounded-xl border border-white/[0.08] bg-gradient-to-r overflow-hidden"
                    style={{ width: `${width}%` }}
                  >
                    <div
                      className={`px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between gap-3 bg-gradient-to-r ${LAYER_COLORS[colorIdx]}`}
                    >
                      <div className="text-[13px] sm:text-sm font-medium text-fg truncate">
                        {layer.label}
                      </div>
                      <div className="text-[10px] text-faint hidden sm:block truncate">
                        {layer.note}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {/* base label */}
            <div className="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-cyan">
              Foundation: Trip Workspace
            </div>
          </div>

          {/* Right: narrative */}
          <div className="space-y-5">
            {[
              {
                k: "Today",
                t: "Group trip workspace",
                b: "Plan, vote, split, settle, remember. Free for small trips, premium for the rest.",
              },
              {
                k: "Tomorrow",
                t: "Partner marketplace",
                b: "High-intent group leads for hotels, homestays, cafes, and activity providers.",
              },
              {
                k: "Long-term",
                t: "Group travel network",
                b: "Cloneable creator templates, organizer tooling, and the network that makes group travel one tap.",
              },
            ].map((p) => (
              <motion.div
                key={p.k}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-white/[0.08] bg-surface/40 p-5"
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-cyan font-medium">
                  {p.k}
                </div>
                <div className="font-display text-lg font-semibold mt-1">
                  {p.t}
                </div>
                <p className="text-sm text-muted mt-1 leading-relaxed">{p.b}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
