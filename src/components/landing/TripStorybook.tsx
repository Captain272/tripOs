"use client";

/**
 * TripStorybook — the emotional payoff section.
 * Centerpiece: a "book" with a flip-on-hover cover and an open spread.
 * Trip Wrapped stats below as a strip of large numbers.
 */

import * as React from "react";
import { motion } from "framer-motion";
import { Camera, MapPin, Sparkles, Download, Share2 } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { TRIP } from "@/constants/landing";
import { inr, num } from "@/lib/utils";

function BookCover() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -2 }}
      whileInView={{ opacity: 1, y: 0, rotate: -2 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      whileHover={{ rotate: 0, y: -4 }}
      className="relative w-[280px] sm:w-[340px] aspect-[3/4] rounded-2xl overflow-hidden shrink-0 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)]"
    >
      {/* spine */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/40 z-10" />
      {/* cover photo grid */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 gap-0.5">
        {[
          "#ff8c4a", "#38e1ff", "#a78bfa", "#34d399",
          "#ffd27a", "#fb7185", "#38e1ff", "#ff8c4a",
          "#a78bfa", "#34d399", "#ffd27a", "#fb7185",
        ].map((c, i) => (
          <div
            key={i}
            style={{
              background: `linear-gradient(${135 + i * 7}deg, ${c}, rgba(0,0,0,0.55))`,
            }}
          />
        ))}
      </div>
      {/* dim overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
      {/* foil shimmer */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          background:
            "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)",
        }}
      />
      {/* title */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gold">
            Trip Capsule
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/70">
            № 0001
          </span>
        </div>
        <div>
          <div className="font-display text-3xl font-semibold leading-tight tracking-tight">
            {TRIP.name}
          </div>
          <div className="mt-2 text-[12px] text-white/80">
            5 travelers · 3 days · 412 photos
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-gold/0 via-gold to-gold/0" />
          <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/70">
            <span>Mar 2026</span>
            <span>Coorg · Karnataka</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BookSpread() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: 1.5 }}
      whileInView={{ opacity: 1, y: 0, rotate: 1.5 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.1 }}
      whileHover={{ rotate: 0 }}
      className="relative w-full max-w-[640px] aspect-[16/10] rounded-2xl border border-white/10 bg-gradient-to-br from-surface to-ink p-5 sm:p-6 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)] overflow-hidden"
    >
      <div className="grid grid-cols-2 h-full gap-5">
        {/* Left page: route + day story */}
        <div className="flex flex-col">
          <div className="text-[9px] uppercase tracking-wider text-cyan">
            Day 1 · Bangalore → Coorg
          </div>
          <div className="font-display text-base font-semibold mt-1">
            The drive at dawn
          </div>
          {/* mini map */}
          <svg viewBox="0 0 220 80" className="mt-3 w-full">
            <defs>
              <linearGradient id="bookRoute" x1="0" x2="1">
                <stop offset="0" stopColor="#38e1ff" />
                <stop offset="1" stopColor="#ff8c4a" />
              </linearGradient>
            </defs>
            <path
              d="M5,60 Q60,5 110,40 T215,20"
              stroke="url(#bookRoute)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 5"
            />
            <circle cx="5" cy="60" r="4" fill="#38e1ff" />
            <circle cx="110" cy="40" r="4" fill="#a78bfa" />
            <circle cx="215" cy="20" r="4" fill="#ff8c4a" />
          </svg>
          <p className="text-[11px] text-muted mt-3 leading-relaxed">
            We left at 6:30. Sneha forgot her charger. Stopped at A2B for
            breakfast. The ghats opened up around noon.
          </p>
          <div className="mt-auto flex items-center gap-2 text-[10px] text-faint">
            <MapPin className="w-3 h-3" /> 4 places · 261 km
          </div>
        </div>
        {/* Right page: photo grid */}
        <div className="flex flex-col">
          <div className="text-[9px] uppercase tracking-wider text-sunset">
            Day 1 · highlights
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-2 flex-1">
            {[
              "#ff8c4a", "#38e1ff", "#a78bfa", "#34d399", "#ffd27a", "#fb7185",
            ].map((c, i) => (
              <div
                key={i}
                className="rounded-md border border-white/10"
                style={{
                  background: `linear-gradient(${130 + i * 12}deg, ${c}, rgba(0,0,0,0.55))`,
                }}
              />
            ))}
          </div>
          <div className="mt-3 text-[10px] text-faint flex items-center justify-between">
            <span>140 photos</span>
            <span>Auto-curated</span>
          </div>
        </div>
      </div>
      {/* spine seam */}
      <div className="absolute top-3 bottom-3 left-1/2 -translate-x-1/2 w-px bg-white/10" />
    </motion.div>
  );
}

export function TripStorybook() {
  return (
    <Section id="memories" className="overflow-hidden">
      <Container>
        <SectionHeading
          eyebrow="The memory"
          eyebrowAccent="gold"
          title={
            <>
              Every trip becomes a{" "}
              <span className="text-gradient-sunset">story.</span>
            </>
          }
          description="Your trip should not disappear into everyone's camera roll. After the journey, TripOS auto-generates a Trip Capsule — a private storybook with your route, photos, moments, expenses, and final settlement."
        />

        {/* Books */}
        <div className="relative mt-16 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-10">
          {/* ambient glow */}
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[420px] blur-3xl opacity-50"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255,140,74,0.35), rgba(56,225,255,0.2) 40%, transparent 70%)",
            }}
          />
          <BookCover />
          <BookSpread />
        </div>

        {/* Trip Wrapped strip */}
        <div className="mt-16 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-surface/60 to-ink/60 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-gold inline-flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Trip Wrapped
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1">
                Your group, in numbers.
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-1.5 text-[12px] px-3.5 py-2 rounded-full border border-white/15 hover:bg-white/[0.06]">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button className="inline-flex items-center gap-1.5 text-[12px] px-3.5 py-2 rounded-full bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25">
                <Share2 className="w-3.5 h-3.5" /> Share Capsule
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[
              { l: "Travelers", v: num(TRIP.travelers), accent: "text-cyan" },
              { l: "Days", v: num(TRIP.days), accent: "text-cyan" },
              { l: "Photos", v: num(TRIP.photos), accent: "text-violet" },
              { l: "Places", v: num(TRIP.places), accent: "text-emerald" },
              { l: "KM traveled", v: num(TRIP.km), accent: "text-sunset" },
              { l: "Per person", v: inr(TRIP.perHead), accent: "text-gold" },
            ].map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="relative rounded-2xl border border-white/[0.07] bg-ink/60 p-4 sm:p-5"
              >
                <div className="text-[10px] uppercase tracking-wider text-faint">
                  {s.l}
                </div>
                <div
                  className={`font-display text-2xl sm:text-3xl font-semibold mt-1 ${s.accent}`}
                >
                  {s.v}
                </div>
                <Camera className="absolute top-3 right-3 w-3.5 h-3.5 text-faint" />
              </motion.div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted max-w-2xl">
            Plus a shared trip drive, private photo upload, receipts archive, an
            AI-generated day-wise story, and a shareable private link. (Printed
            photo book? Coming soon.)
          </p>
        </div>
      </Container>
    </Section>
  );
}
