"use client";

import * as React from "react";
import { Image as ImageIcon } from "lucide-react";
import type { ItineraryItemRow } from "@/types/database";

interface Props {
  item: ItineraryItemRow;
  destinationHint?: string | null;
  onUpdated?: (item: ItineraryItemRow) => void;
}

interface ApiOk<T> { ok: true; data: T }
interface ApiErr { ok: false; error: string }

interface PexelsPhotoLite {
  url: string;
  thumb: string;
  photographer: string;
  photographer_url: string;
  source_url: string;
}

export function ItineraryImage({ item, destinationHint, onUpdated }: Props) {
  const [url, setUrl] = React.useState<string | null>(item.image_url || null);

  // If a parent update brings a cached image_url, adopt it.
  React.useEffect(() => {
    if (item.image_url && item.image_url !== url) setUrl(item.image_url);
  }, [item.image_url, url]);

  React.useEffect(() => {
    if (url) return;
    const q = (item.image_query || item.location_name || `${item.title} ${destinationHint || ""}`).trim();
    if (!q) return;

    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch(`/api/pexels?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const json = (await res.json()) as ApiOk<{ photo: PexelsPhotoLite | null }> | ApiErr;
        if (controller.signal.aborted) return;
        if (!json.ok || !json.data.photo) return;
        const photo = json.data.photo;
        setUrl(photo.url);
        try {
          const r = await fetch("/api/itinerary", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: item.id, image_url: photo.url }),
            signal: controller.signal,
          });
          const j = await r.json();
          if (j.ok && j.data?.item) onUpdated?.(j.data.item);
        } catch {}
      } catch {}
    })();
    return () => controller.abort();
  }, [item.id, item.image_query, item.location_name, item.title, destinationHint, url, onUpdated]);

  if (!url) {
    return (
      <div className="w-full h-24 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] grid place-items-center text-faint">
        <ImageIcon className="w-4 h-4 opacity-50" />
        <span className="sr-only">No image</span>
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={url}
      alt={item.title}
      className="w-full h-24 object-cover rounded-xl border border-white/[0.05]"
      loading="lazy"
    />
  );
}
