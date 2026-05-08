"use client";

import { motion } from "framer-motion";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { USE_CASES } from "@/constants/landing";
import { cn } from "@/lib/utils";

// Static lookups so Tailwind picks up every class — no dynamic class strings.
const accentBgGlow: Record<string, string> = {
  cyan: "from-cyan/20 to-cyan/0",
  sunset: "from-sunset/20 to-sunset/0",
  gold: "from-gold/20 to-gold/0",
  emerald: "from-emerald/20 to-emerald/0",
  violet: "from-violet/20 to-violet/0",
  rose: "from-rose/20 to-rose/0",
};

const accentIcon: Record<string, string> = {
  cyan: "bg-cyan/10 text-cyan",
  sunset: "bg-sunset/10 text-sunset",
  gold: "bg-gold/10 text-gold",
  emerald: "bg-emerald/10 text-emerald",
  violet: "bg-violet/10 text-violet",
  rose: "bg-rose/10 text-rose",
};

export function UseCases() {
  return (
    <Section id="use-cases">
      <Container>
        <SectionHeading
          eyebrow="Who it's for"
          title={
            <>
              Built for every kind of{" "}
              <span className="text-gradient-aurora">group trip.</span>
            </>
          }
          description="Friend groups, college squads, offsites, creators, hotels, organizers. One shared workspace flexes for all."
        />

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {USE_CASES.map((u, i) => (
            <motion.div
              key={u.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className="group relative rounded-2xl border border-white/[0.08] bg-surface/40 p-6 overflow-hidden"
            >
              <div
                className={cn(
                  "absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl opacity-50 bg-gradient-to-br",
                  accentBgGlow[u.accent]
                )}
              />
              <div
                className={cn(
                  "relative grid place-items-center w-11 h-11 rounded-xl mb-5",
                  accentIcon[u.accent]
                )}
              >
                <Icon name={u.icon} className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-semibold tracking-tight mb-1.5">
                {u.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">{u.body}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
