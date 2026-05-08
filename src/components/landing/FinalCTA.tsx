"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container, Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";

export function FinalCTA() {
  return (
    <Section id="cta" spacing="lg">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan/10 via-violet/10 to-sunset/10 p-8 sm:p-14 text-center"
        >
          {/* glow */}
          <div className="pointer-events-none absolute inset-0 -z-10 noise-overlay" />
          <div
            className="pointer-events-none absolute inset-0 -z-20 opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(56,225,255,0.35), transparent 60%)",
            }}
          />
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cyan font-medium mb-4">
            <Sparkles className="w-3 h-3" /> Built for the chaos before, during, and after
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-semibold leading-[1.05] tracking-tight max-w-3xl mx-auto">
            Your next group trip deserves
            <br className="hidden sm:block" />
            <span className="text-gradient-sunset"> better than chaos.</span>
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-base text-muted">
            Plan, vote, split, settle, and relive — in one shared workspace your group will actually use.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <ButtonLink href="#waitlist" size="lg">
              Join the waitlist
              <ArrowRight className="w-4 h-4" />
            </ButtonLink>
            <ButtonLink href="#partners" variant="ghost" size="lg">
              Become a travel partner
            </ButtonLink>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
