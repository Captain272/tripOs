"use client";

import * as React from "react";
import { use } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GoogleDrivePanel } from "@/components/app/GoogleDrivePanel";
import type { TripRow, TripMediaRow, ItineraryItemRow } from "@/types/database";

export default function MemoriesPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const { push } = useToast();
  const [items, setItems] = React.useState<TripMediaRow[]>([]);
  const [stops, setStops] = React.useState<ItineraryItemRow[]>([]);
  const [trip, setTrip] = React.useState<TripRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const [mediaRes, stopsRes, tripRes] = await Promise.all([
      supabase
        .from("trip_media").select("*").eq("trip_id", tripId)
        .order("taken_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("itinerary_items").select("*").eq("trip_id", tripId)
        .order("day_number", { ascending: true })
        .order("start_time", { ascending: true }),
      fetch(`/api/trips/${tripId}`).then((r) => r.json()),
    ]);
    if (mediaRes.data) setItems(mediaRes.data as TripMediaRow[]);
    if (stopsRes.data) setStops(stopsRes.data as ItineraryItemRow[]);
    if (tripRes?.ok) setTrip(tripRes.data.trip);
    setLoading(false);
  }, [tripId]);

  React.useEffect(() => { void load(); }, [load]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${tripId}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("trip-photos").upload(path, file, {
        cacheControl: "3600", upsert: false,
      });
      if (error) { push({ title: `Upload failed: ${file.name}`, body: error.message }); continue; }
      const { data: signed } = await supabase.storage.from("trip-photos").createSignedUrl(path, 60 * 60 * 24);
      const url = signed?.signedUrl ?? path;
      const isImage = file.type.startsWith("image");
      await fetch("/api/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip_id: tripId, file_url: url, file_type: isImage ? "image" : "document" }),
      });
    }
    setUploading(false);
    push({ title: "Uploaded" });
    void load();
  }

  const photos = items.filter((i) => i.file_type === "image");
  const docs = items.filter((i) => i.file_type !== "image");
  const unbound = photos.filter((p) => !p.itinerary_item_id);

  const byStop = new Map<string, TripMediaRow[]>();
  for (const p of photos) {
    if (!p.itinerary_item_id) continue;
    const arr = byStop.get(p.itinerary_item_id) || [];
    arr.push(p);
    byStop.set(p.itinerary_item_id, arr);
  }

  const stopsByDay = new Map<number, ItineraryItemRow[]>();
  for (const s of stops) {
    const d = s.day_number || 1;
    if (!stopsByDay.has(d)) stopsByDay.set(d, []);
    stopsByDay.get(d)!.push(s);
  }
  const days = Array.from(stopsByDay.entries()).sort(([a], [b]) => a - b);

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Memories</h2>
          <p className="text-sm text-muted">Your trip should not disappear into everyone&apos;s camera roll.</p>
        </div>
        <Button onClick={() => inputRef.current?.click()} size="sm" disabled={uploading} variant="ghost">
          {uploading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>) : (<><Upload className="w-4 h-4" /> Upload</>)}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {trip && (
        <div className="mb-6">
          <GoogleDrivePanel
            trip={trip}
            onTripUpdated={(t) => setTrip(t)}
            onSynced={load}
          />
        </div>
      )}

      {loading ? (
        <div className="text-sm text-faint">Loading…</div>
      ) : photos.length === 0 && docs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.12] bg-surface/30 p-10 text-center">
          <Camera className="mx-auto w-6 h-6 text-faint mb-3" />
          <div className="font-display text-lg">Your trip memories will live here.</div>
          <p className="text-sm text-muted mt-1">
            Upload photos, or connect Google Drive above to auto-import.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {days.length > 0 && photos.some((p) => p.itinerary_item_id) && (
            <div className="space-y-6">
              {days.map(([day, stopsOfDay]) => {
                const dayPhotos = stopsOfDay.flatMap((s) => byStop.get(s.id) || []);
                if (dayPhotos.length === 0) return null;
                return (
                  <div key={day} className="rounded-2xl border border-white/[0.07] bg-surface/40 p-5">
                    <div className="flex items-baseline justify-between mb-4">
                      <div className="font-display text-lg font-semibold">Day {day}</div>
                      <div className="text-[11px] text-faint">{dayPhotos.length} photos</div>
                    </div>
                    <div className="space-y-5">
                      {stopsOfDay.map((s) => {
                        const sPhotos = byStop.get(s.id) || [];
                        if (sPhotos.length === 0) return null;
                        return (
                          <div key={s.id}>
                            <div className="text-[12.5px] font-medium mb-2 flex items-center gap-2">
                              {s.title}
                              {s.start_time && (
                                <span className="text-[11px] text-faint">
                                  {s.start_time.slice(0, 5)}
                                </span>
                              )}
                            </div>
                            <PhotoGrid photos={sPhotos} tripId={tripId} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {unbound.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-faint mb-3">
                Unbound photos · {unbound.length}
              </div>
              <PhotoGrid photos={unbound} tripId={tripId} />
            </div>
          )}

          {docs.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-faint mb-3">Documents · {docs.length}</div>
              <ul className="space-y-2">
                {docs.map((d) => (
                  <li key={d.id} className="rounded-xl border border-white/[0.07] bg-surface/40 px-4 py-3 text-[13px] flex items-center justify-between">
                    <span className="truncate">{d.caption || d.file_url.split("/").pop()}</span>
                    <a href={d.file_url} target="_blank" rel="noopener" className="text-cyan text-[11px]">Open</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function PhotoGrid({ photos, tripId }: { photos: TripMediaRow[]; tripId: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {photos.map((p) => {
        const src = thumbSrc(p, tripId);
        const href = p.drive_file_id ? `/api/google/drive/image?id=${p.drive_file_id}&trip_id=${tripId}` : p.file_url;
        return (
          <a key={p.id} href={href} target="_blank" rel="noopener" className="block group">
            <div className="relative aspect-square rounded-xl overflow-hidden border border-white/[0.07] bg-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={p.caption || "Trip photo"}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"
              />
            </div>
          </a>
        );
      })}
    </div>
  );
}

function thumbSrc(p: TripMediaRow, tripId: string): string {
  if (p.drive_file_id) return `/api/google/drive/image?id=${p.drive_file_id}&trip_id=${tripId}`;
  return p.thumbnail_url || p.file_url;
}
