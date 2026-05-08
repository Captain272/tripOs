"use client";

/**
 * WaitlistSection — primary conversion surface.
 *
 * Conversion lifts vs v1:
 *   • Live counter ("1,247 groups already on waitlist") — social proof
 *   • Benefit list ("what you get for joining")
 *   • 2-step flow: collect email first (1 field, lowest friction),
 *     then optional details after.
 *   • Trust line + privacy reassurance
 *   • Stronger gradient CTA + glow
 *   • Full-width on mobile, side-by-side on desktop
 *
 * Tracking:
 *   • WAITLIST_SUBMIT  — every submit, with `source: "main_waitlist"` and
 *     selected `planning` value.
 *   • CREATOR_INTEREST_SUBMIT — also fired when planning === "Creator".
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Plane,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Container, Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { CountUp } from "@/components/ui/CountUp";
import { useToast } from "@/components/ui/Toast";
import {
  WAITLIST_OPTIONS,
  WAITLIST_BENEFITS,
  WAITLIST_COUNT_BASE,
  TRIP_MEMBERS,
} from "@/constants/landing";
import { Avatar } from "@/components/ui/Avatar";
import { track, EVENTS } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Stage = "email" | "details" | "done";

export function WaitlistSection() {
  const { push } = useToast();
  const [stage, setStage] = React.useState<Stage>("email");
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const detailsRef = React.useRef<HTMLDivElement | null>(null);

  // Stage 1 — email only (lowest friction)
  function onEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setStage("details");
    // small delay so the new section renders before scroll
    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  // Stage 2 — full submit hits the real API
  async function onDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const planning = String(data.get("planning") || "");
    const userTypeMap: Record<string, string> = {
      "Friends trip": "friends_trip",
      "College trip": "college_trip",
      "Office offsite": "office_offsite",
      "Travel organizer": "travel_organizer",
      "Hotel partner": "hotel_partner",
      Creator: "creator",
    };
    setSubmitting(true);

    track(EVENTS.WAITLIST_SUBMIT, {
      source: "main_waitlist",
      planning,
      city: String(data.get("city") || ""),
      has_phone: Boolean(data.get("phone")),
      has_name: Boolean(data.get("name")),
    });
    if (planning === "Creator") {
      track(EVENTS.CREATOR_INTEREST_SUBMIT, {
        source: "main_waitlist",
        city: String(data.get("city") || ""),
      });
    }

    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email,
        phone: data.get("phone") || null,
        city: data.get("city") || null,
        user_type: userTypeMap[planning] || null,
        source: "main_waitlist",
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!json.ok) {
      push({ title: "Submission failed", body: json.error || "Try again." });
      return;
    }
    setStage("done");
    push({
      title: "You're on the list ✈️",
      body: "Watch your inbox — early users get free Pro Trip access.",
    });
  }

  return (
    <Section id="waitlist">
      <Container>
        <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-surface to-ink p-6 sm:p-10 lg:p-14">
          {/* aurora backdrop */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute -top-32 left-1/3 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(56,225,255,0.6), transparent 60%)",
              }}
            />
            <div
              className="absolute -bottom-32 right-1/4 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,140,74,0.6), transparent 60%)",
              }}
            />
            <div className="absolute inset-0 noise-overlay" />
          </div>

          <div className="grid lg:grid-cols-[1fr_1.05fr] gap-10 items-start">
            {/* ─────────────────────────────────────────── LEFT */}
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cyan font-medium mb-4">
                <Sparkles className="w-3 h-3" /> Founding members · Free Pro Trip
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.05] tracking-tight">
                Be one of the first groups{" "}
                <span className="text-gradient-aurora">to try TripOS.</span>
              </h2>
              <p className="mt-5 text-base sm:text-lg text-muted leading-relaxed max-w-xl">
                We&apos;re onboarding small batches every week — friends, college
                squads, organizers, and partners. Join now and we&apos;ll text
                you when your group&apos;s slot opens.
              </p>

              {/* Live counter card */}
              <div className="mt-7 inline-flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <div className="flex -space-x-2">
                  {TRIP_MEMBERS.slice(0, 4).map((m) => (
                    <Avatar key={m.name} member={m} size={28} />
                  ))}
                  <span className="grid place-items-center w-7 h-7 rounded-full bg-cyan/15 text-cyan text-[10px] font-semibold ring-2 ring-bg">
                    +
                  </span>
                </div>
                <div className="text-[13px]">
                  <div className="font-semibold text-fg">
                    <CountUp to={WAITLIST_COUNT_BASE} /> groups
                  </div>
                  <div className="text-faint text-[11px]">
                    already on the waitlist · 38 joined this week
                  </div>
                </div>
              </div>

              {/* Benefit grid */}
              <div className="mt-7 grid sm:grid-cols-2 gap-3">
                {WAITLIST_BENEFITS.map((b, i) => (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-white/[0.07] bg-bg/40 p-4"
                  >
                    <div className="flex items-center gap-2 text-[12.5px] font-semibold">
                      <span className="grid place-items-center w-5 h-5 rounded-full bg-cyan/15 text-cyan">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>
                      {b.title}
                    </div>
                    <div className="mt-1 text-[12px] text-muted leading-relaxed">
                      {b.body}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ─────────────────────────────────────────── RIGHT (form) */}
            <div ref={detailsRef}>
              <div className="rounded-2xl border border-white/[0.1] bg-bg/60 p-5 sm:p-7 backdrop-blur-md shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
                {/* Step pills */}
                <div className="flex items-center gap-2 mb-5">
                  <Plane className="w-4 h-4 text-cyan" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-cyan font-medium">
                    Join the waitlist
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-faint">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        stage !== "email" ? "bg-emerald" : "bg-cyan animate-pulse"
                      )}
                    />
                    Step {stage === "email" ? "1" : "2"} of 2
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  {stage === "email" && (
                    <motion.form
                      key="email-stage"
                      onSubmit={onEmail}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label htmlFor="wl-email">Your email</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          id="wl-email"
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <Button type="submit" className="sm:shrink-0" size="md">
                          Continue
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="mt-3 text-[11px] text-faint inline-flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3" />
                        One field. ~12 seconds. We&apos;ll do the rest.
                      </p>
                    </motion.form>
                  )}

                  {stage === "details" && (
                    <motion.form
                      key="details-stage"
                      onSubmit={onDetails}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <input type="hidden" name="email" value={email} />
                      <div className="rounded-xl border border-emerald/30 bg-emerald/5 px-3 py-2 text-[12px] text-emerald flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          Saved <strong className="font-semibold">{email}</strong>{" "}
                          — one more step.
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <Label htmlFor="name">What should we call you?</Label>
                          <Input id="name" name="name" required placeholder="Abhi" />
                        </div>
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input id="city" name="city" placeholder="Bangalore" />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone (optional)</Label>
                          <Input id="phone" name="phone" type="tel" placeholder="+91 ..." />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor="planning">What are you planning?</Label>
                          <Select id="planning" name="planning" defaultValue="">
                            <option value="" disabled>
                              Choose
                            </option>
                            {WAITLIST_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="mt-5 w-full"
                        size="lg"
                        disabled={submitting}
                      >
                        {submitting ? "Saving your spot…" : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Lock in my founding-member spot
                          </>
                        )}
                      </Button>
                      <p className="mt-3 text-[11px] text-faint text-center">
                        No spam. We&apos;ll only email you about access.
                      </p>
                    </motion.form>
                  )}

                  {stage === "done" && (
                    <motion.div
                      key="done-stage"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-center py-6"
                    >
                      <div className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald to-cyan text-bg mb-4 shadow-[0_15px_40px_-10px_rgba(52,211,153,0.6)]">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h3 className="font-display text-2xl font-semibold tracking-tight">
                        You&apos;re in. ✨
                      </h3>
                      <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
                        We&apos;ll text you when your group&apos;s slot opens.
                        Founding-member free Pro Trip is reserved.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setStage("email");
                          setEmail("");
                        }}
                        className="mt-5 text-[12px] text-cyan hover:text-cyan-soft transition-colors"
                      >
                        Refer a friend &rarr;
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
