"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, Share2, TrendingUp, ArrowRight, ShieldCheck, Clapperboard } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { track, EVENTS } from "@/lib/analytics";

const PERKS = [
  { icon: Share2, title: "Cloneable trip templates", body: "Publish your favourite trip — fans clone it in one tap." },
  { icon: TrendingUp, title: "Sponsorship-ready trips", body: "Ledger + receipts already structured for brand partners." },
  { icon: Sparkles, title: "Trip Capsules to share", body: "Your trip storybook becomes shareable content." },
];

function CreatorForm() {
  const { push } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = {
      name: data.get("name"),
      email: data.get("email"),
      phone: data.get("phone") || null,
      city: data.get("city") || null,
      user_type: "creator",
      source: "creators_page",
    };
    setSubmitting(true);
    track(EVENTS.CREATOR_INTEREST_SUBMIT, { source: "creators_page" });
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!json.ok) {
      push({ title: "Submit failed", body: json.error });
      return;
    }
    push({ title: "You're in 🎬", body: "We'll reach out about creator templates." });
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-white/[0.08] bg-ink/40 p-6 sm:p-8"
    >
      <div className="font-display text-xl font-semibold tracking-tight mb-1">
        Apply for creator early-access
      </div>
      <p className="text-sm text-muted mb-6">
        We'll onboard the first 30 creators with hands-on support.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" type="tel" />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" placeholder="Bangalore" />
        </div>
        <div>
          <Label htmlFor="ig">Instagram</Label>
          <Input id="ig" name="ig" placeholder="@..." />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="msg">Tell us about your audience (optional)</Label>
          <Textarea id="msg" name="msg" placeholder="Audience size, niche, recent trips" />
        </div>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[11px] text-faint inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3" /> No spam. Founding-creator perks included.
        </p>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Submitting…" : (<>Apply now <ArrowRight className="w-4 h-4" /></>)}
        </Button>
      </div>
    </form>
  );
}

export default function CreatorsPage() {
  return (
    <ToastProvider>
      <Navbar />
      <main className="pt-20">
        <Section>
          <Container>
            <SectionHeading
              eyebrow="For creators"
              eyebrowAccent="gold"
              title={<>Turn every trip into <span className="text-gradient-sunset">cloneable content.</span></>}
              description="Publish your trips as templates. Followers clone them, plan together, and split costs — with your name on the cover."
            />

            <div className="mt-12 grid lg:grid-cols-[0.9fr_1.1fr] gap-6 lg:gap-10 items-start">
              <div className="space-y-4">
                {PERKS.map((p, i) => (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-2xl border border-white/[0.07] bg-surface/40 p-5 flex items-start gap-3"
                  >
                    <span className="grid place-items-center w-10 h-10 rounded-xl bg-gold/10 text-gold shrink-0">
                      <p.icon className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="font-display text-base font-semibold">{p.title}</div>
                      <div className="text-[12.5px] text-muted mt-1 leading-relaxed">{p.body}</div>
                    </div>
                  </motion.div>
                ))}
                <div className="rounded-2xl border border-cyan/30 bg-cyan/5 p-5">
                  <Clapperboard className="w-5 h-5 text-cyan mb-2" />
                  <div className="font-display text-base font-semibold">Founding-creator perks</div>
                  <ul className="text-[12.5px] text-muted mt-2 space-y-1">
                    <li>• Free Pro Trip on every published template</li>
                    <li>• Featured in the upcoming creator marketplace</li>
                    <li>• Hands-on Telegram channel with the founders</li>
                  </ul>
                </div>
              </div>
              <CreatorForm />
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </ToastProvider>
  );
}
