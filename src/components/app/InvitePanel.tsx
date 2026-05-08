"use client";

import * as React from "react";
import { Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export function InvitePanel({ tripId }: { tripId: string }) {
  const { push } = useToast();
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    const res = await fetch(`/api/trips/${tripId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!json.ok) {
      push({ title: "Invite failed", body: json.error });
      return;
    }
    setDone(true);
    push({ title: "Invite sent", body: `${email} got the invite email.` });
    setEmail("");
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/[0.07] bg-surface/40 p-5"
    >
      <div className="text-[10px] uppercase tracking-wider text-faint mb-3 inline-flex items-center gap-1.5">
        <Mail className="w-3 h-3" /> Invite member
      </div>
      <Label htmlFor="invite-email">Email</Label>
      <Input
        id="invite-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="friend@example.com"
      />
      <Button type="submit" className="mt-3 w-full" size="sm" disabled={submitting || done}>
        {done ? (<><Check className="w-3.5 h-3.5" /> Sent</>) : submitting ? "Sending…" : "Send invite"}
      </Button>
      <p className="mt-3 text-[11px] text-faint">
        They'll get a magic-link invite. They can join even before signing up.
      </p>
    </form>
  );
}
