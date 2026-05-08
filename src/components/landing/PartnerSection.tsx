"use client";

/**
 * PartnerSection — pitch for hotels / homestays / cafes / activity providers /
 * organizers.
 *
 *   • Eyebrow + section heading
 *   • Metrics row (CountUp on scroll)
 *   • 3 archetype cards (Hotels / Activity / Organizers)
 *   • 3-step "how it works" rail
 *   • Inquiry form (mock submit, fires PARTNER_LEAD_SUBMIT)
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Megaphone,
  Wallet,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { CountUp } from "@/components/ui/CountUp";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import {
  PARTNER_TYPES,
  PARTNER_METRICS,
  PARTNER_ARCHETYPES,
  PARTNER_HOW_IT_WORKS,
} from "@/constants/landing";
import type { IconName } from "@/types/landing";
import { track, EVENTS } from "@/lib/analytics";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────────────── metrics row

const METRIC_COLORS: Record<string, string> = {
  cyan: "text-cyan",
  sunset: "text-sunset",
  emerald: "text-emerald",
  gold: "text-gold",
};

function MetricsRow() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {PARTNER_METRICS.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: i * 0.06 }}
          className="rounded-2xl border border-white/[0.07] bg-surface/40 p-4 sm:p-5"
        >
          <div
            className={cn(
              "font-display text-3xl sm:text-4xl font-semibold tracking-tight",
              METRIC_COLORS[m.accent] ?? "text-fg"
            )}
          >
            <CountUp to={m.value} />
            <span>{m.suffix}</span>
          </div>
          <div className="mt-1.5 text-[12px] sm:text-[13px] text-muted leading-snug">
            {m.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────── archetypes

const ARCHETYPE_RING: Record<string, string> = {
  emerald: "ring-emerald/30 hover:border-emerald/40",
  sunset: "ring-sunset/30 hover:border-sunset/40",
  cyan: "ring-cyan/30 hover:border-cyan/40",
};
const ARCHETYPE_BG: Record<string, string> = {
  emerald: "from-emerald/15 to-emerald/0",
  sunset: "from-sunset/15 to-sunset/0",
  cyan: "from-cyan/15 to-cyan/0",
};
const ARCHETYPE_ICON_BG: Record<string, string> = {
  emerald: "bg-emerald/10 text-emerald",
  sunset: "bg-sunset/10 text-sunset",
  cyan: "bg-cyan/10 text-cyan",
};

function ArchetypeCard({
  arch,
  i,
}: {
  arch: (typeof PARTNER_ARCHETYPES)[number];
  i: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay: i * 0.08 }}
      whileHover={{ y: -3 }}
      className={cn(
        "group relative rounded-2xl border border-white/[0.08] bg-ink/40 p-6 overflow-hidden ring-1 transition-colors",
        ARCHETYPE_RING[arch.accent]
      )}
    >
      <div
        className={cn(
          "absolute -top-16 -right-16 w-44 h-44 rounded-full blur-2xl opacity-60 bg-gradient-to-br",
          ARCHETYPE_BG[arch.accent]
        )}
      />
      <div className="relative">
        <span
          className={cn(
            "grid place-items-center w-11 h-11 rounded-xl mb-5",
            ARCHETYPE_ICON_BG[arch.accent]
          )}
        >
          <Icon name={arch.icon as IconName} className="w-5 h-5" />
        </span>
        <h3 className="font-display text-lg font-semibold tracking-tight">
          {arch.title}
        </h3>
        <p className="text-sm text-muted leading-relaxed mt-1.5">{arch.body}</p>
        <ul className="mt-5 space-y-1.5">
          {arch.bullets.map((b) => (
            <li
              key={b}
              className="flex items-center gap-2 text-[12.5px] text-fg/80"
            >
              <span className="w-1 h-1 rounded-full bg-current opacity-60" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────── how-it-works

function HowItWorks() {
  return (
    <div className="relative">
      {/* connector line desktop */}
      <div className="hidden md:block absolute top-9 left-[16%] right-[16%] h-px bg-gradient-to-r from-cyan/0 via-cyan/40 to-sunset/40" />
      <div className="grid md:grid-cols-3 gap-5">
        {PARTNER_HOW_IT_WORKS.map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="relative rounded-2xl border border-white/[0.07] bg-surface/40 p-5 sm:p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-gradient-to-b from-cyan to-cyan-soft text-bg text-[12px] font-bold font-mono">
                {s.step}
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-faint">
                Step {i + 1}
              </span>
            </div>
            <div className="font-display text-base font-semibold">{s.title}</div>
            <div className="text-sm text-muted mt-1.5 leading-relaxed">
              {s.body}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────── form

function PartnerForm() {
  const { push } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const partnerType = String(data.get("type") || "")
      .toLowerCase()
      .replace(/\s+/g, "_") || null;

    setSubmitting(true);
    track(EVENTS.PARTNER_LEAD_SUBMIT, {
      business_name: String(data.get("business") || ""),
      partner_type: partnerType,
      location: String(data.get("location") || ""),
      has_phone: Boolean(data.get("phone")),
      has_instagram: Boolean(data.get("instagram")),
      has_message: Boolean(data.get("message")),
    });

    const res = await fetch("/api/partners/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_name: data.get("business"),
        business_type: partnerType,
        location: data.get("location") || null,
        contact_name: null,
        phone: data.get("phone") || null,
        email: data.get("email") || null,
        instagram_or_website: data.get("instagram") || null,
        message: data.get("message") || null,
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!json.ok) {
      push({ title: "Submission failed", body: json.error || "Try again." });
      return;
    }
    push({
      title: "We've got your details ✓",
      body: "We'll reach out within 48 hours to onboard you.",
    });
    form.reset();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-white/[0.08] bg-ink/60 p-6 sm:p-7"
    >
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <div className="font-display text-xl font-semibold tracking-tight">
            Become an early partner
          </div>
          <p className="text-sm text-muted mt-1">
            48-hour onboarding · Featured placement for first 100 partners.
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-gold border border-gold/30 bg-gold/10 rounded-full px-2.5 py-1 shrink-0">
          <Sparkles className="w-3 h-3" /> Early access
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="biz">Business name</Label>
          <Input id="biz" name="business" required placeholder="Misty Falls Estate" />
        </div>
        <div>
          <Label htmlFor="loc">Location</Label>
          <Input id="loc" name="location" required placeholder="Coorg, Karnataka" />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select id="type" name="type" required defaultValue="">
            <option value="" disabled>
              Choose
            </option>
            {PARTNER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="phone">Contact (WhatsApp preferred)</Label>
          <Input id="phone" name="phone" type="tel" placeholder="+91 ..." />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="hello@..." />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ig">Instagram / website (optional)</Label>
          <Input id="ig" name="instagram" placeholder="@..." />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="msg">Anything we should know? (optional)</Label>
          <Textarea
            id="msg"
            name="message"
            placeholder="Group sizes you can host, packages, dates blocked, anything else."
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-[11px] text-faint inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3" />
          We never share your info. Trip leads only.
        </p>
        <Button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto"
          size="lg"
        >
          {submitting ? "Submitting…" : (
            <>
              List my business
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ──────────────────────────────────────────────────────── default export

const VALUE_TILES = [
  { Icon: Eye, label: "Discovered while groups plan" },
  { Icon: Megaphone, label: "Direct lead, not a listing" },
  { Icon: Wallet, label: "Group-deal pricing tools" },
];

export function PartnerSection() {
  return (
    <Section id="partners">
      <Container>
        <SectionHeading
          eyebrow="For partners"
          eyebrowAccent="gold"
          align="left"
          title={
            <>
              Reach groups{" "}
              <span className="text-gradient-sunset">while they plan,</span>
              <br className="hidden sm:block" /> not after they book.
            </>
          }
          description="Group travel is the highest-intent moment in tourism. TripOS puts your business inside the workspace where 5–8 friends are deciding where to go, where to stay, and what to do."
        />

        {/* Value tiles directly under heading */}
        <div className="mt-8 flex flex-wrap gap-2">
          {VALUE_TILES.map(({ Icon: I, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[12.5px] text-fg/85"
            >
              <I className="w-3.5 h-3.5 text-gold" />
              {label}
            </span>
          ))}
        </div>

        {/* Metrics row */}
        <div className="mt-12">
          <div className="text-[10px] uppercase tracking-[0.18em] text-faint mb-3">
            Why this matters
          </div>
          <MetricsRow />
        </div>

        {/* Archetypes */}
        <div className="mt-16">
          <div className="text-[10px] uppercase tracking-[0.18em] text-faint mb-3">
            Built for your business
          </div>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
            {PARTNER_ARCHETYPES.map((a, i) => (
              <ArchetypeCard key={a.title} arch={a} i={i} />
            ))}
          </div>
        </div>

        {/* How-it-works */}
        <div className="mt-16">
          <div className="text-[10px] uppercase tracking-[0.18em] text-faint mb-3">
            How it works
          </div>
          <HowItWorks />
        </div>

        {/* Form */}
        <div className="mt-16 grid lg:grid-cols-[0.9fr_1.1fr] gap-6 lg:gap-10 items-start">
          {/* Left: pitch + trust signals */}
          <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-gold/8 via-surface/40 to-ink/40 p-6 sm:p-8">
            <div className="font-display text-2xl font-semibold tracking-tight leading-snug">
              Get featured in trip plans across <br />
              <span className="text-gradient-sunset">Coorg, Goa, Manali, Hampi, Pondy.</span>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "Direct group leads — no middleman markup",
                "Featured cards inside vote + plan UI",
                "Itinerary placements for Day 1, 2, 3 plans",
                "Customer reviews with photos from real trips",
                "Partner dashboard rolling out Q3",
              ].map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2.5 text-sm text-fg/85"
                >
                  <span className="mt-0.5 grid place-items-center w-4 h-4 rounded-full bg-gold/15 text-gold shrink-0">
                    <Sparkles className="w-2.5 h-2.5" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-7 pt-6 border-t border-white/[0.06] text-[11px] text-faint inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              All partner outreach handled by the founding team.
            </div>
          </div>

          {/* Right: form */}
          <PartnerForm />
        </div>
      </Container>
    </Section>
  );
}
