"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/app/AppShell";
import { track, EVENTS } from "@/lib/analytics";

export default function NewTripPage() {
  const router = useRouter();
  const { push } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSubmitting(true);
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        destination: data.get("destination"),
        start_date: data.get("start_date") || null,
        end_date: data.get("end_date") || null,
        budget_per_person: data.get("budget_per_person") || null,
        visibility: data.get("visibility") || "private",
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!json.ok) {
      push({ title: "Could not create trip", body: json.error || "Try again." });
      return;
    }
    track(EVENTS.TRIP_CREATED, { trip_id: json.data.trip.id });
    router.push(`/app/trips/${json.data.trip.id}`);
  }

  return (
    <>
      <PageHeader
        eyebrow="New trip"
        title="Create a new trip"
        subtitle="A trip workspace becomes the home for your group's plan, expenses, and memories."
      />

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="max-w-2xl rounded-3xl border border-white/[0.08] bg-ink/40 p-6 sm:p-8 space-y-5"
      >
        <div>
          <Label htmlFor="title">Trip title</Label>
          <Input id="title" name="title" required maxLength={120} placeholder="Goa Weekend 2026" />
        </div>
        <div>
          <Label htmlFor="destination">Destination</Label>
          <Input id="destination" name="destination" maxLength={120} placeholder="Goa, India" />
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="start_date">Start date</Label>
            <Input id="start_date" name="start_date" type="date" />
          </div>
          <div>
            <Label htmlFor="end_date">End date</Label>
            <Input id="end_date" name="end_date" type="date" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="budget_per_person">Budget / person (₹)</Label>
            <Input id="budget_per_person" name="budget_per_person" type="number" min={0} placeholder="8000" />
          </div>
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select id="visibility" name="visibility" defaultValue="private">
              <option value="private">Private — just me</option>
              <option value="group">Group — invited members</option>
              <option value="public">Public — anyone with link</option>
            </Select>
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting}>
          {submitting ? "Creating…" : (<>
            <Sparkles className="w-4 h-4" /> Create trip
            <ArrowRight className="w-4 h-4" />
          </>)}
        </Button>
      </motion.form>
    </>
  );
}
