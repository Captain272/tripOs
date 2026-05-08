"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, Mail, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function GoogleGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.74h3.58c2.1-1.94 3.21-4.79 3.21-8.08z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.99 7.29-2.65l-3.58-2.74c-.99.66-2.26 1.05-3.71 1.05-2.85 0-5.27-1.92-6.13-4.51H2.18v2.83C4 20.7 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.87 14.15A6.96 6.96 0 0 1 5.5 12c0-.75.13-1.47.37-2.15V7.02H2.18A11 11 0 0 0 1 12c0 1.78.42 3.46 1.18 4.98l3.69-2.83z"/>
      <path fill="#EA4335" d="M12 5.34c1.61 0 3.06.55 4.21 1.64l3.16-3.16C17.46 1.93 14.97 1 12 1 7.7 1 4 3.3 2.18 7.02l3.69 2.83C6.73 7.26 9.15 5.34 12 5.34z"/>
    </svg>
  );
}

function LoginInner() {
  const search = useSearchParams();
  const next = search.get("next") || "/app/trips";
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function signInWithGoogle() {
    setErr(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setErr(error.message);
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setErr(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setSubmitting(false);
    if (error) {
      setErr(error.message);
    } else {
      setDone(true);
    }
  }

  return (
    <main className="relative min-h-dvh flex items-center justify-center px-5 py-16 overflow-hidden">
      {/* ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(56,225,255,0.55), transparent 60%)" }}
        />
        <div
          className="absolute -bottom-40 -right-32 w-[42rem] h-[42rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,140,74,0.55), transparent 60%)" }}
        />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="w-full max-w-md glass-strong rounded-3xl p-7 sm:p-9 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.7)]"
      >
        <a href="/" className="inline-flex items-center gap-2 mb-7">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan to-sunset shadow-[0_8px_30px_-8px_rgba(56,225,255,0.7)]">
            <Compass className="w-4 h-4 text-bg" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">TripOS</span>
        </a>

        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          Welcome back.
        </h1>
        <p className="text-sm text-muted mt-1.5 leading-relaxed">
          Plan, vote, split, settle, and relive trips — together.
        </p>

        <Button
          onClick={signInWithGoogle}
          variant="secondary"
          size="lg"
          className="w-full mt-7"
        >
          <GoogleGlyph className="w-4 h-4" />
          Continue with Google
        </Button>

        <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-faint">
          <span className="flex-1 h-px bg-white/10" />
          or email
          <span className="flex-1 h-px bg-white/10" />
        </div>

        {done ? (
          <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-4 text-sm text-emerald flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              Magic link sent to <strong>{email}</strong>. Open it on this device to sign in.
            </div>
          </div>
        ) : (
          <form onSubmit={signInWithEmail}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" className="w-full mt-3" size="lg" disabled={submitting}>
              {submitting ? "Sending magic link…" : (
                <>
                  <Mail className="w-4 h-4" />
                  Send magic link
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {err && (
          <div className="mt-4 text-[12px] text-rose">{err}</div>
        )}

        <div className="mt-7 pt-5 border-t border-white/[0.06] text-[11px] text-faint flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Founding members get free Pro Trip access.
        </div>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<main className="min-h-dvh grid place-items-center text-faint text-sm">Loading…</main>}>
      <LoginInner />
    </React.Suspense>
  );
}
