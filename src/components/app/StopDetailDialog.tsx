"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, MapPin, Tag, IndianRupee, X, ExternalLink, Loader2 } from "lucide-react";
import type { ItineraryItemRow } from "@/types/database";
import { cn } from "@/lib/utils";

interface Props {
  item: ItineraryItemRow | null;
  destinationHint?: string | null;
  onClose: () => void;
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

const GALLERY_COUNT = 5;

export function StopDetailDialog({ item, destinationHint, onClose }: Props) {
  const [photos, setPhotos] = React.useState<PexelsPhotoLite[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!item) {
      setPhotos([]);
      return;
    }
    const q = (item.image_query || item.location_name || `${item.title} ${destinationHint || ""}`).trim();
    if (!q) return;

    setLoading(true);
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch(`/api/pexels?q=${encodeURIComponent(q)}&count=${GALLERY_COUNT}`, {
          signal: controller.signal,
        });
        const json = (await res.json()) as ApiOk<{ photos: PexelsPhotoLite[] }> | ApiErr;
        if (controller.signal.aborted) return;
        if (json.ok) {
          // Put cached image_url first if present.
          const head: PexelsPhotoLite[] = [];
          if (item.image_url) {
            head.push({
              url: item.image_url,
              thumb: item.image_url,
              photographer: "",
              photographer_url: "",
              source_url: "",
            });
          }
          const rest = json.data.photos.filter((p) => p.url !== item.image_url);
          setPhotos([...head, ...rest].slice(0, GALLERY_COUNT));
        }
      } catch {} finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [item, destinationHint]);

  const open = Boolean(item);
  const mapHref = item?.location_name
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [item.location_name, destinationHint].filter(Boolean).join(", ")
      )}`
    : null;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AnimatePresence>
        {open && item && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(720px,calc(100vw-32px))] max-h-[calc(100vh-48px)] overflow-y-auto rounded-3xl border border-white/[0.08] bg-bg/95 backdrop-blur-xl shadow-2xl"
              >
                <header className="sticky top-0 z-10 flex items-start gap-3 p-5 pb-3 border-b border-white/[0.06] bg-bg/85 backdrop-blur-xl">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-wider text-cyan/90 mb-1">
                      Day {item.day_number ?? 1}
                      {item.category && <span className="text-faint normal-case tracking-normal"> · {item.category}</span>}
                    </div>
                    <Dialog.Title className="font-display text-lg font-semibold truncate">
                      {item.title}
                    </Dialog.Title>
                  </div>
                  <Dialog.Close asChild>
                    <button
                      aria-label="Close"
                      className="shrink-0 grid place-items-center w-8 h-8 rounded-lg text-faint hover:text-fg hover:bg-white/[0.06] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </Dialog.Close>
                </header>

                <div className="p-5 space-y-5">
                  <Gallery photos={photos} loading={loading} alt={item.title} />

                  <MetaRow item={item} />

                  {item.description && (
                    <div className="text-[13.5px] leading-relaxed text-fg/90 whitespace-pre-wrap">
                      {item.description}
                    </div>
                  )}

                  {mapHref && (
                    <a
                      href={mapHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[12.5px] text-cyan hover:text-cyan/80 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Open in Google Maps
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}

                  {photos.some((p) => p.photographer) && (
                    <div className="text-[10.5px] text-faint pt-2 border-t border-white/[0.04]">
                      Photos via{" "}
                      <a
                        href="https://www.pexels.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-fg/70"
                      >
                        Pexels
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function Gallery({ photos, loading, alt }: { photos: PexelsPhotoLite[]; loading: boolean; alt: string }) {
  if (loading && photos.length === 0) {
    return (
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-4 sm:col-span-2 row-span-2 aspect-[4/3] rounded-2xl bg-white/[0.04] animate-pulse grid place-items-center">
          <Loader2 className="w-5 h-5 text-faint animate-spin" />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-square rounded-xl bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    );
  }
  if (photos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-6 text-center text-[12px] text-faint">
        No photos found for this stop.
      </div>
    );
  }

  const [hero, ...rest] = photos;
  return (
    <div className="grid grid-cols-4 gap-2">
      <a
        href={hero.source_url || hero.url}
        target="_blank"
        rel="noopener noreferrer"
        className="col-span-4 sm:col-span-2 row-span-2 aspect-[4/3] rounded-2xl overflow-hidden bg-white/[0.04] group relative"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.url}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          loading="lazy"
        />
      </a>
      {rest.slice(0, 4).map((p, i) => (
        <a
          key={p.url + i}
          href={p.source_url || p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="aspect-square rounded-xl overflow-hidden bg-white/[0.04] group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.thumb || p.url}
            alt={`${alt} ${i + 2}`}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            loading="lazy"
          />
        </a>
      ))}
    </div>
  );
}

function MetaRow({ item }: { item: ItineraryItemRow }) {
  const bits: { icon: React.ReactNode; label: string }[] = [];
  if (item.start_time) {
    bits.push({
      icon: <Clock className="w-3.5 h-3.5" />,
      label: `${item.start_time.slice(0, 5)}${item.end_time ? `–${item.end_time.slice(0, 5)}` : ""}`,
    });
  }
  if (item.location_name) {
    bits.push({ icon: <MapPin className="w-3.5 h-3.5" />, label: item.location_name });
  }
  if (item.category) {
    bits.push({ icon: <Tag className="w-3.5 h-3.5" />, label: item.category });
  }
  if (item.estimated_cost != null) {
    bits.push({
      icon: <IndianRupee className="w-3.5 h-3.5" />,
      label: `${Number(item.estimated_cost).toLocaleString("en-IN")} / person`,
    });
  }
  if (!bits.length) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-fg/75">
      {bits.map((b, i) => (
        <span key={i} className={cn("inline-flex items-center gap-1.5")}>
          <span className="text-faint">{b.icon}</span>
          {b.label}
        </span>
      ))}
    </div>
  );
}
