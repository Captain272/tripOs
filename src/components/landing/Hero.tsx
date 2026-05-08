"use client";

/**
 * Hero — the cinematic moment.
 *
 * Composition (desktop):
 *  ┌──────────────────────┬────────────────────────┐
 *  │ press row · headline │  3D-tilted dashboard   │
 *  │ subhead · ctas       │  with WhatsApp bubbles │
 *  │ inline email capture │  morphing into cards   │
 *  │ social proof row     │                        │
 *  └──────────────────────┴────────────────────────┘
 *  ▼ activity ticker (full-width marquee)
 *
 * Animation choreography:
 *   t=0.0  — background fades in
 *   t=0.1  — eyebrow / press row
 *   t=0.2  — headline (line-by-line mask reveal)
 *   t=0.5  — subhead
 *   t=0.7  — CTAs
 *   t=0.9  — email + social proof
 *   t=0.4+ — dashboard arrives + tilt enabled
 *   t=1.0+ — inner dashboard cards stagger in
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Calendar,
  Vote as VoteIcon,
  Receipt,
  Camera,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Tilt } from "@/components/ui/Tilt";
import { Marquee } from "@/components/ui/Marquee";
import { CountUp } from "@/components/ui/CountUp";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import {
  HERO,
  TRIP_MEMBERS,
  TRIP,
  LIVE_ACTIVITY,
  WAITLIST_COUNT_BASE,
  PRESS_ROW,
} from "@/constants/landing";
import type { IconName } from "@/types/landing";
import { inr, num } from "@/lib/utils";
import { track, EVENTS } from "@/lib/analytics";

/* ──────────────────────────────────────────────────────── background */

function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* dotted grid (masked into a soft ellipse) */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black, transparent 70%)",
        }}
      />
      {/* slowly-drifting orbs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ duration: 1.2 }}
        className="absolute -top-40 -left-32 w-[42rem] h-[42rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,225,255,0.55), transparent 60%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ duration: 1.2, delay: 0.15 }}
        className="absolute -bottom-44 -right-36 w-[46rem] h-[46rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,140,74,0.5), transparent 60%)",
        }}
      />
      {/* aurora streak */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[80rem] h-[20rem] opacity-25 blur-3xl"
        style={{
          background:
            "linear-gradient(90deg, transparent, #38e1ff, #a78bfa, #ff8c4a, transparent)",
        }}
      />
      {/* subtle grain */}
      <div className="absolute inset-0 noise-overlay" />
    </div>
  );
}

/* ──────────────────────────────────────────── line-by-line headline */

function LineReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <span
      className={"block overflow-hidden " + (className ?? "")}
    >
      <motion.span
        className="block"
        initial={reduce ? { y: 0, opacity: 1 } : { y: "110%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1], delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ───────────────────────────────────────────────────── route map svg */

function RouteMap() {
  return (
    <svg viewBox="0 0 280 110" className="w-full h-[80px]" aria-hidden>
      <defs>
        <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38e1ff" />
          <stop offset="100%" stopColor="#ff8c4a" />
        </linearGradient>
      </defs>
      <path
        d="M10,80 C60,20 110,90 160,40 S250,80 270,30"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="2"
      />
      <path
        d="M10,80 C60,20 110,90 160,40 S250,80 270,30"
        fill="none"
        stroke="url(#routeGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 8"
        style={{ animation: "route-dash 5s linear infinite" }}
      />
      {[
        { x: 10, y: 80, c: "#38e1ff", label: "BLR" },
        { x: 160, y: 40, c: "#a78bfa", label: "Coorg" },
        { x: 270, y: 30, c: "#ff8c4a", label: "Goa" },
      ].map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="5" fill={p.c} />
          <circle cx={p.x} cy={p.y} r="9" fill={p.c} opacity="0.25" />
        </g>
      ))}
    </svg>
  );
}

/* ──────────────────────────────────────────── floating WA / photos */

function WaBubble({
  delay,
  text,
  className,
}: {
  delay: number;
  text: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16, y: 6 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={
        "absolute pointer-events-none select-none max-w-[170px] rounded-2xl rounded-bl-md bg-[#1f3a2e] text-[#d8f5e1] text-[11px] leading-snug px-3 py-2 shadow-lg border border-emerald/20 " +
        (className ?? "")
      }
    >
      {text}
    </motion.div>
  );
}

// Pre-computed stable photo metadata so SSR + client match.
const PHOTO_CARDS = [
  { id: 142, hue: "#ff8c4a" },
  { id: 318, hue: "#38e1ff" },
];

function PhotoCard({
  className,
  delay,
  hue,
  id,
}: {
  className?: string;
  delay: number;
  hue: string;
  id: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: -6 }}
      animate={{ opacity: 1, y: 0, rotate: -6 }}
      transition={{ duration: 0.7, delay }}
      className={
        "absolute w-28 h-36 rounded-xl border border-white/15 shadow-2xl overflow-hidden " +
        (className ?? "")
      }
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(150deg, ${hue} 0%, rgba(0,0,0,0.5) 100%)`,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.35),transparent_50%)]" />
      <div className="absolute bottom-0 inset-x-0 p-2 text-[9px] uppercase tracking-wider text-white/80 font-medium">
        IMG · {id}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────── activity card */

function ActivityChip({
  who,
  verb,
  obj,
  where,
  icon,
}: (typeof LIVE_ACTIVITY)[number]) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md px-3.5 py-1.5 text-[12px] whitespace-nowrap">
      <span className="grid place-items-center w-5 h-5 rounded-full bg-cyan/15 text-cyan">
        <Icon name={icon as IconName} className="w-3 h-3" />
      </span>
      <span className="text-fg/90">
        <span className="font-medium">{who}</span>{" "}
        <span className="text-faint">{verb}</span>{" "}
        <span className="text-fg">{obj}</span>{" "}
        <span className="text-faint">· {where}</span>
      </span>
    </div>
  );
}

/* ───────────────────────────────────────────── inline email capture */

function InlineEmailCapture() {
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "");
    setSubmitting(true);
    track(EVENTS.WAITLIST_SUBMIT, {
      source: "hero_inline",
      has_email: Boolean(email),
    });
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "hero_inline" }),
      });
    } catch {
      /* never block UX on analytics-style failure */
    }
    setSubmitting(false);
    setDone(true);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative w-full max-w-md"
      aria-label="Quick waitlist email signup"
    >
      <div className="group relative flex items-center rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md p-1.5 pl-5 transition-colors focus-within:border-cyan/40">
        <input
          type="email"
          required
          name="email"
          placeholder="you@email.com"
          aria-label="Email"
          disabled={done}
          className="flex-1 bg-transparent text-sm text-fg placeholder:text-faint outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={submitting || done}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-cyan to-cyan-soft text-bg text-[13px] font-semibold px-4 h-9 hover:brightness-110 disabled:opacity-70"
        >
          {done ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              You&apos;re in
            </>
          ) : submitting ? (
            "Saving…"
          ) : (
            <>
              Get early access
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
      <div className="mt-2 text-[11px] text-faint pl-5">
        Free for early users · No spam · Unsubscribe anytime
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────── main */

export function Hero() {
  return (
    <section
      id="top"
      className="relative pt-28 sm:pt-32 lg:pt-36 pb-12 sm:pb-16 overflow-hidden"
    >
      <HeroBackground />

      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-10 items-center">
        {/* ════════════════════════════════════════════ LEFT COLUMN */}
        <div className="relative">
          {/* Press / status row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="flex items-center gap-2"
          >
            <Badge accent="cyan">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex w-full h-full rounded-full bg-cyan opacity-70 animate-ping" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-cyan" />
              </span>
              {HERO.badge}
            </Badge>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-faint">
              <span className="h-px w-4 bg-white/20" /> YC W26 application
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="mt-6 font-display font-semibold leading-[1.02] tracking-[-0.02em] text-[2.5rem] sm:text-[3.25rem] lg:text-[4rem] xl:text-[4.5rem]">
            <LineReveal delay={0.15}>Stop planning</LineReveal>
            <LineReveal delay={0.32}>
              group trips on{" "}
              <span className="relative inline-block">
                <span className="text-gradient-sunset">WhatsApp.</span>
                <svg
                  className="absolute -bottom-1.5 sm:-bottom-2 left-0 w-full"
                  viewBox="0 0 200 12"
                  fill="none"
                  aria-hidden
                >
                  <motion.path
                    d="M2,8 Q60,2 110,7 T198,5"
                    stroke="url(#heroUnderline)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9, delay: 0.95 }}
                  />
                  <defs>
                    <linearGradient id="heroUnderline">
                      <stop stopColor="#ffd27a" />
                      <stop offset="1" stopColor="#ff8c4a" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </LineReveal>
          </h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-6 sm:mt-7 max-w-xl text-[15px] sm:text-lg text-muted leading-relaxed"
          >
            {HERO.subheadline}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-7 sm:mt-8 flex flex-col sm:flex-row gap-3"
          >
            <MagneticButton
              href={HERO.primaryCta.href}
              className="group"
              onClick={() =>
                track(EVENTS.HERO_CTA_CLICK, {
                  cta: "primary",
                  label: HERO.primaryCta.label,
                  href: HERO.primaryCta.href,
                })
              }
            >
              <Sparkles className="w-4 h-4" />
              {HERO.primaryCta.label}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </MagneticButton>
            <ButtonLink
              href="#product"
              variant="ghost"
              size="lg"
              onClick={() =>
                track(EVENTS.HERO_CTA_CLICK, {
                  cta: "secondary",
                  label: "See how it works",
                  href: "#product",
                })
              }
            >
              See how it works
            </ButtonLink>
          </motion.div>

          {/* Inline email capture */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="mt-6 sm:mt-7"
          >
            <InlineEmailCapture />
          </motion.div>

          {/* Social proof: counter + avatars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3"
          >
            <div className="flex items-center gap-2.5">
              <AvatarStack members={TRIP_MEMBERS} size={26} />
              <div className="text-[12px] sm:text-[13px] text-fg/80">
                <CountUp
                  to={WAITLIST_COUNT_BASE}
                  className="font-semibold text-fg"
                />{" "}
                <span className="text-faint">groups already on the waitlist</span>
              </div>
            </div>
            <div className="hidden sm:block h-4 w-px bg-white/10" />
            <p className="text-xs text-faint">{HERO.microcopy}</p>
          </motion.div>

          {/* Press / "spotted in" tiny row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.15 }}
            className="mt-8 pt-6 border-t border-white/[0.06]"
          >
            <div className="text-[10px] uppercase tracking-[0.18em] text-faint mb-3">
              Spotted in
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-fg/60">
              {PRESS_ROW.map((p, i) => (
                <span key={p} className="flex items-center gap-3">
                  {p}
                  {i < PRESS_ROW.length - 1 && (
                    <span className="hidden sm:block w-1 h-1 rounded-full bg-white/15" />
                  )}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ════════════════════════════════════════════ RIGHT COLUMN */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative"
          >
            {/* WhatsApp bubbles — desktop only to keep mobile uncluttered */}
            <WaBubble
              delay={0.6}
              text="Yaar Goa weekend pakka? 🤞"
              className="hidden sm:block -left-10 -top-2"
            />
            <WaBubble
              delay={0.9}
              text="Stay link bhej raha hu"
              className="hidden sm:block -left-12 top-28"
            />
            <WaBubble
              delay={1.2}
              text="Petrol 3200 paid 🚗"
              className="hidden sm:block -left-8 top-60"
            />

            {/* Photo cards — desktop only */}
            {PHOTO_CARDS.map((p, i) => (
              <PhotoCard
                key={p.id}
                id={p.id}
                hue={p.hue}
                delay={1.3 + i * 0.2}
                className={
                  i === 0
                    ? "hidden md:block -right-6 -top-6 rotate-6"
                    : "hidden lg:block -right-12 top-40 -rotate-3"
                }
              />
            ))}

            {/* Tilted dashboard */}
            <Tilt max={5}>
              <div className="relative glass-strong rounded-3xl p-4 sm:p-5 shadow-[0_30px_120px_-30px_rgba(0,0,0,0.9)]">
                {/* Window chrome */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-gold/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald/70" />
                  </div>
                  <div className="text-[11px] text-faint font-mono truncate">
                    trip · goa-weekend-2026
                  </div>
                  <div className="text-[11px] text-faint hidden sm:block">
                    3 days · 5 ppl
                  </div>
                </div>

                {/* Trip header */}
                <div className="pt-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-cyan font-medium">
                      Active trip
                    </div>
                    <div className="font-display text-xl sm:text-2xl font-semibold tracking-tight truncate">
                      {TRIP.name}
                    </div>
                  </div>
                  <AvatarStack members={TRIP_MEMBERS} size={26} />
                </div>

                {/* Map */}
                <div className="mt-3 rounded-xl border border-white/[0.07] bg-ink/60 p-3">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-faint mb-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan" /> Route
                    </span>
                    <span>{num(TRIP.km)} km</span>
                  </div>
                  <RouteMap />
                </div>

                {/* Itinerary timeline */}
                <div className="mt-3 rounded-xl border border-white/[0.07] bg-ink/60 p-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-faint mb-2">
                    <Calendar className="w-3 h-3 text-cyan" /> Day 1 · Bangalore → Coorg
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { t: "06:30", l: "Departure", c: "#38e1ff" },
                      { t: "09:45", l: "Breakfast — Hassan", c: "#a78bfa" },
                      { t: "15:00", l: "Homestay check-in", c: "#ff8c4a" },
                    ].map((s) => (
                      <div key={s.l} className="flex items-center gap-3 text-[12px]">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: s.c,
                            boxShadow: `0 0 0 3px ${s.c}33`,
                          }}
                        />
                        <span className="text-faint w-10 font-mono">{s.t}</span>
                        <span className="text-fg/90 truncate">{s.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Two-column: vote + receipt scan */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0, duration: 0.5 }}
                    className="rounded-xl border border-white/[0.07] bg-ink/60 p-3"
                  >
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-faint mb-2">
                      <VoteIcon className="w-3 h-3 text-violet" /> Group vote
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div>
                        <div className="flex justify-between">
                          <span>Hotel A</span>
                          <span className="text-faint">2 / 5</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/5 mt-1">
                          <motion.div
                            className="h-full rounded-full bg-violet/60"
                            initial={{ width: 0 }}
                            animate={{ width: "40%" }}
                            transition={{ duration: 0.9, delay: 1.2 }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <span className="text-emerald">Hotel B ✓</span>
                          <span className="text-faint">4 / 5</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/5 mt-1">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-cyan to-emerald"
                            initial={{ width: 0 }}
                            animate={{ width: "80%" }}
                            transition={{ duration: 1.1, delay: 1.3 }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.15, duration: 0.5 }}
                    className="relative rounded-xl border border-white/[0.07] bg-ink/60 p-3 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-faint mb-2">
                      <Receipt className="w-3 h-3 text-sunset" /> AI receipt
                    </div>
                    <div className="text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-faint">Indian Oil</span>
                        <span className="text-fg">{inr(3200)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-faint">Paid by</span>
                        <span className="text-fg flex items-center gap-1">
                          <Avatar member={TRIP_MEMBERS[0]} size={14} /> Abhi
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-faint">Split</span>
                        <span className="text-fg">5 ways</span>
                      </div>
                    </div>
                    {/* scan line */}
                    <motion.div
                      initial={{ y: -10 }}
                      animate={{ y: 80 }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatType: "mirror",
                      }}
                      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan to-transparent"
                    />
                  </motion.div>
                </div>

                {/* Settle summary */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                  className="mt-3 rounded-xl border border-emerald/20 bg-emerald/5 p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-[12px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald" />
                    <span className="font-medium">3 transactions settle all</span>
                  </div>
                  <span className="text-[11px] text-emerald font-mono">
                    {inr(2520)}
                  </span>
                </motion.div>

                {/* Memories preview */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.45, duration: 0.5 }}
                  className="mt-3 rounded-xl border border-white/[0.07] bg-gradient-to-br from-sunset/10 via-gold/5 to-violet/10 p-3 flex items-center gap-3"
                >
                  <span className="grid place-items-center w-9 h-9 rounded-lg bg-sunset/15 text-sunset">
                    <Camera className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium">Trip Capsule ready</div>
                    <div className="text-[10px] text-faint">
                      {num(TRIP.photos)} photos · {TRIP.days} days · storybook draft
                    </div>
                  </div>
                  <span className="text-[10px] text-gold font-mono uppercase tracking-wider">
                    Wrap
                  </span>
                </motion.div>
              </div>
            </Tilt>

            <div
              className="absolute -bottom-10 inset-x-8 h-20 rounded-full opacity-50 blur-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(56,225,255,0.4), transparent 70%)",
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* ═════════════════════════════════════════ ACTIVITY MARQUEE */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.3 }}
        className="relative mt-16 sm:mt-20 border-y border-white/[0.06] bg-ink/40 py-3.5"
      >
        <div className="absolute left-1/2 -top-3 -translate-x-1/2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-faint bg-bg px-3 py-1 rounded-full border border-white/[0.06]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
          Live activity
        </div>
        <Marquee speed={48}>
          {LIVE_ACTIVITY.map((a, i) => (
            <ActivityChip key={i} {...a} />
          ))}
        </Marquee>
      </motion.div>
    </section>
  );
}
