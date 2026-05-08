"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { PRICING } from "@/constants/landing";
import { cn } from "@/lib/utils";
import { track, EVENTS } from "@/lib/analytics";

const accent: Record<string, { tag: string; glow: string; ring: string }> = {
  cyan: { tag: "text-cyan", glow: "from-cyan/20 to-cyan/0", ring: "ring-cyan/30" },
  sunset: { tag: "text-sunset", glow: "from-sunset/20 to-sunset/0", ring: "ring-sunset/30" },
  gold: { tag: "text-gold", glow: "from-gold/20 to-gold/0", ring: "ring-gold/30" },
  emerald: { tag: "text-emerald", glow: "from-emerald/20 to-emerald/0", ring: "ring-emerald/30" },
};

export function PricingSection() {
  return (
    <Section id="pricing">
      <Container>
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Start free.{" "}
              <span className="text-gradient-sunset">
                Upgrade when your group needs more.
              </span>
            </>
          }
          description="Built so a 3-friend Goa weekend costs nothing. Built so a 50-trip organizer can finally retire their spreadsheet."
        />

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {PRICING.map((tier, i) => {
            const a = accent[tier.accent ?? "cyan"];
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  "relative rounded-3xl p-6 sm:p-7 flex flex-col",
                  tier.highlighted
                    ? `border-2 border-sunset/40 bg-gradient-to-b from-sunset/8 via-surface/60 to-ink/60 shadow-[0_30px_80px_-30px_rgba(255,140,74,0.5)]`
                    : "border border-white/[0.08] bg-surface/40"
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] font-medium px-3 py-1 rounded-full bg-gradient-to-r from-sunset to-gold text-bg">
                      <Sparkles className="w-3 h-3" /> Most loved
                    </span>
                  </div>
                )}

                <div className={cn("text-[11px] uppercase tracking-[0.18em] font-medium", a.tag)}>
                  {tier.name}
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <div className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
                    {tier.price}
                  </div>
                  {tier.period && (
                    <div className="text-[12px] text-faint">{tier.period}</div>
                  )}
                </div>
                <p className="text-sm text-muted mt-2 leading-relaxed min-h-[2.5rem]">
                  {tier.tagline}
                </p>

                <ul className="mt-5 space-y-2 flex-1">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-[13px] text-fg/85"
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid place-items-center w-4 h-4 rounded-full bg-white/[0.06]",
                          a.tag
                        )}
                      >
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <ButtonLink
                  href="#waitlist"
                  variant={tier.highlighted ? "primary" : "ghost"}
                  className="mt-6 w-full"
                  onClick={() =>
                    track(EVENTS.PRICING_CTA_CLICK, {
                      tier: tier.name,
                      price: tier.price,
                      cta_label: tier.cta,
                      highlighted: Boolean(tier.highlighted),
                    })
                  }
                >
                  {tier.cta}
                </ButtonLink>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-faint max-w-2xl mx-auto">
          Pricing for early users may change. Join the waitlist for founding-member access — free Pro Trip on us.
        </p>
      </Container>
    </Section>
  );
}
