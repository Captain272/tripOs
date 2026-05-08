"use client";

import * as React from "react";
import { use } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, BookOpen, Lock, Unlock, Share2, ExternalLink, Loader2, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { track, EVENTS } from "@/lib/analytics";
import { inr, num } from "@/lib/utils";

interface StoryDay { day: number; title: string; story: string; items: { title: string }[] }
interface StoryContent {
  cover: { title: string; destination: string | null; dates: { start: string | null; end: string | null } };
  members: { name: string | null; avatar_url: string | null }[];
  days: StoryDay[];
  wrapped: {
    total_spend: number; per_person_average: number; traveler_count: number;
    days: number | null; photo_count: number; place_count: number;
  };
}
interface CapsuleRow {
  id: string;
  trip_id: string;
  title: string | null;
  story_content: StoryContent | null;
  public_share_slug: string | null;
  is_public: boolean;
  show_expenses_publicly: boolean;
  is_unlocked: boolean;
}

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

const CAPSULE_PRICE_PAISE = 9900; // ₹99

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CapsulePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const { push } = useToast();
  const [capsule, setCapsule] = React.useState<CapsuleRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);

  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("trip_capsules").select("*").eq("trip_id", tripId).maybeSingle();
    setCapsule(data as CapsuleRow | null);
    setLoading(false);
  }, [tripId, supabase]);
  React.useEffect(() => { void load(); }, [load]);

  async function generateStory() {
    setGenerating(true);
    const res = await fetch("/api/ai/generate-storybook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trip_id: tripId }),
    });
    const json = await res.json();
    setGenerating(false);
    if (!json.ok) { push({ title: "Failed", body: json.error }); return; }
    void load();
  }

  async function togglePublic() {
    if (!capsule) return;
    const newSlug = capsule.public_share_slug || randomSlug();
    const { error } = await supabase
      .from("trip_capsules")
      .update({
        is_public: !capsule.is_public,
        public_share_slug: capsule.is_public ? capsule.public_share_slug : newSlug,
      })
      .eq("trip_id", tripId);
    if (error) { push({ title: "Update failed", body: error.message }); return; }
    void load();
  }

  async function unlockWithRazorpay() {
    const orderRes = await fetch("/api/payments/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trip_id: tripId,
        purpose: "capsule_unlock",
        amount_in_paise: CAPSULE_PRICE_PAISE,
      }),
    });
    const json = await orderRes.json();
    if (!json.ok) { push({ title: "Order failed", body: json.error }); return; }
    const ok = await loadRazorpay();
    if (!ok || !window.Razorpay) {
      push({ title: "Could not load checkout" });
      return;
    }
    const rp = new window.Razorpay({
      key: json.data.razorpay_key_id,
      amount: json.data.razorpay_order.amount,
      currency: json.data.razorpay_order.currency,
      name: "TripOS",
      description: "Trip Capsule unlock",
      order_id: json.data.razorpay_order.id,
      theme: { color: "#38e1ff" },
      handler: () => {
        // Webhook is the source of truth, but show optimistic UI immediately.
        track(EVENTS.CAPSULE_UNLOCKED, { trip_id: tripId, amount: CAPSULE_PRICE_PAISE / 100 });
        push({ title: "Payment received", body: "Unlocking your Capsule…" });
        setTimeout(() => void load(), 1500);
      },
      modal: { ondismiss: () => push({ title: "Checkout closed" }) },
    });
    rp.open();
  }

  if (loading) return <div className="text-sm text-faint">Loading capsule…</div>;

  const story = capsule?.story_content;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Trip Capsule</h2>
          <p className="text-sm text-muted">A private storybook of your trip — share when ready.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={generateStory} variant="ghost" size="sm" disabled={generating}>
            {generating ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>) : (<><Sparkles className="w-3.5 h-3.5" /> Generate / regenerate</>)}
          </Button>
          {capsule && (
            <Button onClick={togglePublic} variant="ghost" size="sm">
              <Globe className="w-3.5 h-3.5" />
              {capsule.is_public ? "Make private" : "Make public"}
            </Button>
          )}
        </div>
      </div>

      {!story ? (
        <div className="rounded-3xl border border-dashed border-white/[0.12] bg-surface/30 p-10 text-center">
          <BookOpen className="mx-auto w-6 h-6 text-faint mb-3" />
          <div className="font-display text-lg">No capsule yet.</div>
          <p className="text-sm text-muted mt-1">Click Generate — we'll build a storybook from your trip data.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
          {/* Storybook */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-sunset/8 via-surface/40 to-violet/8 p-6 sm:p-8"
          >
            <div className="text-[10px] uppercase tracking-[0.18em] text-gold mb-2">Trip Capsule № 0001</div>
            <h3 className="font-display text-3xl font-semibold tracking-tight">{story.cover.title}</h3>
            {story.cover.destination && (
              <p className="text-[13px] text-muted mt-1">{story.cover.destination}</p>
            )}

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { l: "Travelers", v: num(story.wrapped.traveler_count) },
                { l: "Days", v: num(story.wrapped.days || 0) },
                { l: "Photos", v: num(story.wrapped.photo_count) },
                { l: "Places", v: num(story.wrapped.place_count) },
                { l: "Total spend", v: inr(story.wrapped.total_spend) },
                { l: "Per person", v: inr(story.wrapped.per_person_average) },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-bg/40 border border-white/[0.05] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-faint">{s.l}</div>
                  <div className="font-display text-base font-semibold mt-0.5">{s.v}</div>
                </div>
              ))}
            </div>

            <div className="mt-7 space-y-3">
              {story.days.map((d) => (
                <div key={d.day} className="rounded-xl border border-white/[0.06] bg-ink/40 p-4">
                  <div className="text-[10px] uppercase tracking-wider text-cyan mb-1">Day {d.day}</div>
                  <div className="font-medium">{d.title}</div>
                  <div className="text-[12.5px] text-muted mt-1">{d.story}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Side panel */}
          <aside className="space-y-4">
            {capsule?.is_unlocked ? (
              <div className="rounded-2xl border border-emerald/30 bg-emerald/5 p-5">
                <Unlock className="w-5 h-5 text-emerald mb-2" />
                <div className="font-medium">Pro Capsule unlocked</div>
                <p className="text-[12.5px] text-muted mt-1">Premium exports, full settlement summary, downloadable PDF.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 to-sunset/5 p-5">
                <Lock className="w-5 h-5 text-gold mb-2" />
                <div className="font-display text-lg font-semibold">Unlock the full Capsule</div>
                <ul className="text-[12.5px] text-muted mt-2 space-y-1">
                  <li>• Premium Trip Wrapped stats</li>
                  <li>• Full settlement summary in PDF</li>
                  <li>• Downloadable / shareable storybook</li>
                  <li>• Custom cover photo</li>
                </ul>
                <Button onClick={unlockWithRazorpay} className="mt-4 w-full">
                  <Sparkles className="w-4 h-4" /> Unlock for {inr(CAPSULE_PRICE_PAISE / 100)}
                </Button>
                <p className="mt-2 text-[10px] text-faint text-center">
                  Razorpay · UPI / Card / NetBanking
                </p>
              </div>
            )}

            {capsule?.is_public && capsule.public_share_slug && (
              <div className="rounded-2xl border border-white/[0.07] bg-surface/40 p-5">
                <div className="text-[10px] uppercase tracking-wider text-cyan mb-2 inline-flex items-center gap-1.5">
                  <Share2 className="w-3 h-3" /> Public link
                </div>
                <a
                  href={`/trip/${capsule.public_share_slug}`}
                  target="_blank"
                  rel="noopener"
                  className="text-[13px] text-fg hover:text-cyan inline-flex items-center gap-1.5 break-all"
                >
                  /trip/{capsule.public_share_slug}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <p className="mt-2 text-[11px] text-faint">Anyone with this link can view (no expenses by default).</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function randomSlug() {
  return Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6);
}
