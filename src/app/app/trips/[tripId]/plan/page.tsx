"use client";

import * as React from "react";
import { use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Calendar, Clock, MapPin, Sparkles, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { TripChat } from "@/components/app/TripChat";
import { TripMap } from "@/components/app/TripMap";
import { ItineraryImage } from "@/components/app/ItineraryImage";
import { StopDetailDialog } from "@/components/app/StopDetailDialog";
import type { ItineraryItemRow, TripRow } from "@/types/database";
import { cn } from "@/lib/utils";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "stay", label: "Stay" },
  { value: "food", label: "Food" },
  { value: "activity", label: "Activity" },
  { value: "travel", label: "Travel" },
  { value: "note", label: "Note" },
];

export default function PlanPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const { push } = useToast();
  const [items, setItems] = React.useState<ItineraryItemRow[]>([]);
  const [trip, setTrip] = React.useState<TripRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [showAI, setShowAI] = React.useState<"none" | "generate" | "parse">("none");
  const [aiBusy, setAiBusy] = React.useState(false);
  const [openItem, setOpenItem] = React.useState<ItineraryItemRow | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      fetch(`/api/itinerary?trip_id=${tripId}`),
      fetch(`/api/trips/${tripId}`),
    ]);
    const j1 = await r1.json();
    const j2 = await r2.json();
    if (j1.ok) setItems(j1.data.items);
    if (j2.ok) setTrip(j2.data.trip);
    setLoading(false);
  }, [tripId]);

  React.useEffect(() => { void load(); }, [load]);

  const mergeItem = React.useCallback((updated: ItineraryItemRow) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = {
      trip_id: tripId,
      day_number: Number(data.get("day_number")) || 1,
      title: data.get("title"),
      description: data.get("description") || null,
      location_name: data.get("location_name") || null,
      start_time: data.get("start_time") || null,
      end_time: data.get("end_time") || null,
      category: data.get("category") || null,
      estimated_cost: data.get("estimated_cost") ? Number(data.get("estimated_cost")) : null,
    };
    const res = await fetch("/api/itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) { push({ title: "Could not add", body: json.error }); return; }
    setShowForm(false);
    (e.target as HTMLFormElement).reset();
    void load();
  }

  async function onGenerateAI(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setAiBusy(true);
    const res = await fetch("/api/ai/generate-itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trip_id: tripId,
        preferences: data.get("preferences") || null,
        replace_existing: data.get("replace_existing") === "on",
      }),
    });
    const json = await res.json();
    setAiBusy(false);
    if (!json.ok) {
      push({ title: "AI generation failed", body: json.error || "Try again." });
      return;
    }
    push({ title: "Itinerary generated", body: `Added ${json.data.count} stops.` });
    setShowAI("none");
    void load();
  }

  async function onParseChat(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setAiBusy(true);
    const res = await fetch("/api/ai/parse-trip-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: data.get("text"),
        trip_id: tripId,
        insert: true,
      }),
    });
    const json = await res.json();
    setAiBusy(false);
    if (!json.ok) {
      push({ title: "Parse failed", body: json.error || "Try again." });
      return;
    }
    push({
      title: `Parsed via ${json.data.source}`,
      body: `${json.data.itinerary.length} stops added.`,
    });
    setShowAI("none");
    void load();
  }

  async function onDelete(id: string) {
    const res = await fetch("/api/itinerary", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (json.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  // group by day
  const byDay = new Map<number, ItineraryItemRow[]>();
  for (const it of items) {
    const k = it.day_number || 1;
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(it);
  }
  const days = Array.from(byDay.entries()).sort(([a], [b]) => a - b);
  const destinationHint = trip?.destination || trip?.title || null;

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Itinerary</h2>
          <p className="text-sm text-muted">Day-wise plan with stops, timings, and notes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => { setShowAI((v) => (v === "generate" ? "none" : "generate")); setShowForm(false); }}
            size="sm"
            variant="ghost"
          >
            <Sparkles className="w-4 h-4" />
            {showAI === "generate" ? "Cancel" : "Generate with AI"}
          </Button>
          <Button
            onClick={() => { setShowAI((v) => (v === "parse" ? "none" : "parse")); setShowForm(false); }}
            size="sm"
            variant="ghost"
          >
            <MessageSquare className="w-4 h-4" />
            {showAI === "parse" ? "Cancel" : "Parse chat"}
          </Button>
          <Button onClick={() => { setShowForm((v) => !v); setShowAI("none"); }} size="sm">
            <Plus className="w-4 h-4" />
            {showForm ? "Cancel" : "Add stop"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showAI === "generate" && (
          <motion.form
            key="ai-generate"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            onSubmit={onGenerateAI}
            className="overflow-hidden mb-6"
          >
            <div className="rounded-2xl border border-cyan/20 bg-cyan/[0.04] p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan mt-0.5" />
                <div>
                  <div className="font-display text-base font-semibold">Generate a full itinerary</div>
                  <p className="text-[12.5px] text-muted mt-0.5">Claude will plan day-by-day using your trip destination, dates, and budget. Optionally add preferences below.</p>
                </div>
              </div>
              <div>
                <Label htmlFor="preferences">Preferences (optional)</Label>
                <Textarea
                  id="preferences"
                  name="preferences"
                  rows={3}
                  placeholder="Veg only, like beaches more than temples, prefer chill evenings, group of 5 with one kid."
                />
              </div>
              <label className="flex items-center gap-2 text-[12.5px] text-muted">
                <input type="checkbox" name="replace_existing" className="accent-cyan" />
                Replace existing stops
              </label>
              <div className="flex justify-end">
                <Button type="submit" disabled={aiBusy}>
                  {aiBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate</>}
                </Button>
              </div>
            </div>
          </motion.form>
        )}

        {showAI === "parse" && (
          <motion.form
            key="ai-parse"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            onSubmit={onParseChat}
            className="overflow-hidden mb-6"
          >
            <div className="rounded-2xl border border-violet/20 bg-violet/[0.04] p-5 space-y-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-violet mt-0.5" />
                <div>
                  <div className="font-display text-base font-semibold">Parse from a chat dump</div>
                  <p className="text-[12.5px] text-muted mt-0.5">Paste WhatsApp / Telegram messages — extracted itinerary items are added straight to your plan.</p>
                </div>
              </div>
              <div>
                <Label htmlFor="text">Chat dump</Label>
                <Textarea
                  id="text"
                  name="text"
                  rows={8}
                  required
                  placeholder={`Abhi: thinking Goa weekend, 3 days\nMe: budget around 8k each?\nDay 1: arrive evening, dinner at Thalassa\nDay 2: Anjuna beach morning, jeep safari afternoon\nDay 3: brunch + drive back`}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={aiBusy}>
                  {aiBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Parsing…</> : <><MessageSquare className="w-4 h-4" /> Parse + add</>}
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            onSubmit={onSubmit}
            className="overflow-hidden mb-6"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-ink/40 p-5 grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="Breakfast — A2B Hassan" />
              </div>
              <div>
                <Label htmlFor="day_number">Day</Label>
                <Input id="day_number" name="day_number" type="number" min={1} defaultValue={1} />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select id="category" name="category" defaultValue="">
                  <option value="">—</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="start_time">Start</Label>
                <Input id="start_time" name="start_time" type="time" />
              </div>
              <div>
                <Label htmlFor="end_time">End</Label>
                <Input id="end_time" name="end_time" type="time" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="location_name">Location</Label>
                <Input id="location_name" name="location_name" placeholder="Hassan, Karnataka" />
              </div>
              <div>
                <Label htmlFor="estimated_cost">Est. cost (₹)</Label>
                <Input id="estimated_cost" name="estimated_cost" type="number" min={0} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Notes</Label>
                <Textarea id="description" name="description" placeholder="Anything the group should know" />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit">Add to itinerary</Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {items.length > 0 && (
        <div className="mb-6">
          <TripMap items={items} destinationHint={destinationHint} onItemUpdated={mergeItem} />
        </div>
      )}

      {loading ? (
        <div className="text-sm text-faint">Loading itinerary…</div>
      ) : days.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.12] bg-surface/30 p-10 text-center">
          <Calendar className="mx-auto w-6 h-6 text-faint mb-3" />
          <div className="font-display text-lg">No stops yet.</div>
          <p className="text-sm text-muted mt-1">Add the first stop and your group will see it instantly.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map(([day, stops]) => (
            <div key={day} className="rounded-2xl border border-white/[0.07] bg-surface/40 p-5">
              <div className="flex items-baseline justify-between mb-4">
                <div className="font-display text-lg font-semibold">Day {day}</div>
                <div className="text-[11px] text-faint">{stops.length} stops</div>
              </div>
              <div className="relative space-y-4">
                <span className="absolute left-2 top-2 bottom-2 w-px bg-white/10" />
                {stops.map((s) => (
                  <div key={s.id} className="relative pl-7 group">
                    <span className={cn(
                      "absolute left-0 top-2 w-4 h-4 rounded-full ring-4 ring-bg",
                      "bg-cyan/80"
                    )} />
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenItem(s)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenItem(s); } }}
                      className="w-full text-left rounded-xl -mx-1 px-1 py-1 hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan/40 transition-colors cursor-pointer"
                    >
                      <div className="grid sm:grid-cols-[1fr_180px] gap-3 items-start">
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[14px] font-medium">{s.title}</div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-faint mt-0.5">
                                {s.start_time && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{s.start_time.slice(0,5)}{s.end_time ? `–${s.end_time.slice(0,5)}` : ""}</span>}
                                {s.location_name && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{s.location_name}</span>}
                                {s.category && <span className="px-1.5 py-px rounded bg-white/[0.05] text-fg/70">{s.category}</span>}
                                {s.estimated_cost && <span>₹{Number(s.estimated_cost).toLocaleString("en-IN")}</span>}
                              </div>
                              {s.description && <div className="text-[12px] text-muted mt-1.5">{s.description}</div>}
                            </div>
                            <span
                              role="button"
                              aria-label="Delete stop"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); void onDelete(s.id); }}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); void onDelete(s.id); } }}
                              className="opacity-0 group-hover:opacity-100 grid place-items-center w-7 h-7 rounded-lg text-faint hover:text-rose hover:bg-rose/10 transition-opacity cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                        <div className="sm:w-[180px]">
                          <ItineraryImage item={s} destinationHint={destinationHint} onUpdated={mergeItem} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <TripChat tripId={tripId} onChanged={load} />
      </div>

      <StopDetailDialog
        item={openItem}
        destinationHint={destinationHint}
        onClose={() => setOpenItem(null)}
      />
    </>
  );
}
