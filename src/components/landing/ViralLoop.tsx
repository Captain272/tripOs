"use client";

/**
 * ViralLoop — circular flow showing how every trip creates the next trip.
 * Steps animate sequentially. SVG ring + node cards.
 */

import { motion } from "framer-motion";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { VIRAL_STEPS } from "@/constants/landing";
import type { IconName } from "@/types/landing";

export function ViralLoop() {
  return (
    <Section id="loop">
      <Container>
        <SectionHeading
          eyebrow="The loop"
          eyebrowAccent="emerald"
          title={
            <>
              Every trip{" "}
              <span className="text-gradient-aurora">creates the next trip.</span>
            </>
          }
          description="Invites, settlement reports, Trip Capsules, and creator templates turn each completed trip into 3-5 new ones."
        />

        <div className="mt-14 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          {/* Left: rotating ring */}
          <div className="relative aspect-square w-full max-w-[480px] mx-auto">
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <defs>
                <linearGradient id="loopRing" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#38e1ff" />
                  <stop offset="0.5" stopColor="#a78bfa" />
                  <stop offset="1" stopColor="#ff8c4a" />
                </linearGradient>
              </defs>
              <circle
                cx="200"
                cy="200"
                r="160"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="2"
              />
              <motion.circle
                cx="200"
                cy="200"
                r="160"
                fill="none"
                stroke="url(#loopRing)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="6 6"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "200px 200px" }}
              />
              {/* center icon */}
              <g>
                <circle cx="200" cy="200" r="42" fill="rgba(56,225,255,0.08)" />
                <circle cx="200" cy="200" r="42" fill="none" stroke="rgba(56,225,255,0.3)" />
              </g>
              <text
                x="200"
                y="195"
                textAnchor="middle"
                fill="#7ce9ff"
                fontSize="9"
                fontFamily="ui-sans-serif, system-ui"
                letterSpacing="2"
                style={{ textTransform: "uppercase" }}
              >
                Trip
              </text>
              <text
                x="200"
                y="210"
                textAnchor="middle"
                fill="#fff"
                fontSize="14"
                fontWeight="600"
                fontFamily="var(--font-display), ui-sans-serif"
              >
                TripOS
              </text>
            </svg>
            {/* nodes positioned around the ring */}
            {VIRAL_STEPS.map((s, i) => {
              const angle = (i / VIRAL_STEPS.length) * Math.PI * 2 - Math.PI / 2;
              const r = 50; // % from center
              const x = 50 + r * Math.cos(angle);
              const y = 50 + r * Math.sin(angle);
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.7 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className="grid place-items-center w-10 h-10 rounded-full bg-gradient-to-br from-cyan/20 to-violet/20 text-cyan ring-1 ring-white/15 backdrop-blur-md">
                    <Icon name={s.icon as IconName} className="w-4 h-4" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right: ordered steps */}
          <div className="space-y-2.5">
            {VIRAL_STEPS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-surface/40 px-4 py-3 hover:border-white/15 transition-colors"
              >
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-cyan/10 text-cyan text-[11px] font-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-white/[0.04] text-fg/80">
                  <Icon name={s.icon as IconName} className="w-4 h-4" />
                </span>
                <span className="text-sm text-fg/90 font-medium">{s.label}</span>
                {i === VIRAL_STEPS.length - 1 && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-emerald">
                    new trip starts
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
