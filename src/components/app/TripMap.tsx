"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import type { ItineraryItemRow } from "@/types/database";

interface Props {
  items: ItineraryItemRow[];
  destinationHint?: string | null;
  onItemUpdated?: (item: ItineraryItemRow) => void;
}

const MAP_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Minimal local declarations so we don't need @types/google.maps.
type LatLng = { lat: number; lng: number };
interface GMapInstance {
  setCenter(p: LatLng): void;
  setZoom(z: number): void;
  fitBounds(b: GLatLngBounds, padding?: number | object): void;
}
interface GLatLngBounds {
  extend(p: LatLng): void;
  isEmpty(): boolean;
}
interface GMarker {
  setMap(map: GMapInstance | null): void;
  addListener(ev: string, cb: () => void): void;
}
interface GInfoWindow {
  open(opts: { anchor?: GMarker; map?: GMapInstance }): void;
  close(): void;
  setContent(c: string | Node): void;
}
interface GGeocoder {
  geocode(
    req: { address: string },
    cb: (results: { geometry: { location: { lat(): number; lng(): number } } }[] | null, status: string) => void
  ): void;
}

interface GoogleNS {
  maps: {
    Map: new (el: HTMLElement, opts: object) => GMapInstance;
    Marker: new (opts: object) => GMarker;
    LatLngBounds: new () => GLatLngBounds;
    InfoWindow: new (opts?: object) => GInfoWindow;
    Geocoder: new () => GGeocoder;
    SymbolPath: { CIRCLE: number };
  };
}

function getGoogle(): GoogleNS | null {
  const g = (typeof window !== "undefined" ? window.google : undefined) as { maps?: GoogleNS["maps"] } | undefined;
  return g?.maps ? ({ maps: g.maps } as GoogleNS) : null;
}

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (getGoogle()) return Promise.resolve();
  if (window.__tripos_gmaps_loading) return window.__tripos_gmaps_loading;
  if (!MAP_KEY) return Promise.reject(new Error("missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
  window.__tripos_gmaps_loading = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAP_KEY)}&libraries=marker`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google Maps script failed to load"));
    document.head.appendChild(s);
  });
  return window.__tripos_gmaps_loading;
}

const DAY_PALETTE = ["#38e1ff", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#fb7185", "#60a5fa"];
const colourForDay = (d: number | null) => DAY_PALETTE[((d ?? 1) - 1) % DAY_PALETTE.length];

export function TripMap({ items, destinationHint, onItemUpdated }: Props) {
  const elRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<GMapInstance | null>(null);
  const markersRef = React.useRef<GMarker[]>([]);
  const infoRef = React.useRef<GInfoWindow | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  // 1. Load Google Maps + create map once.
  React.useEffect(() => {
    if (!MAP_KEY) {
      setError("Google Maps key not set (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)");
      return;
    }
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        const g = getGoogle();
        if (cancelled || !elRef.current || !g) return;
        mapRef.current = new g.maps.Map(elRef.current, {
          center: { lat: 20.5937, lng: 78.9629 },
          zoom: 5,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: DARK_MAP_STYLE,
        });
        infoRef.current = new g.maps.InfoWindow();
        setReady(true);
      })
      .catch((e: Error) => setError(e.message));
    return () => { cancelled = true; };
  }, []);

  // 2. Geocode any item missing lat/lng, persisting back to DB.
  React.useEffect(() => {
    const g = getGoogle();
    if (!ready || !g) return;
    const geocoder = new g.maps.Geocoder();
    const missing = items.filter(
      (it) => (!it.latitude || !it.longitude) && (it.location_name || it.title)
    );
    let cancelled = false;
    void (async () => {
      for (const it of missing) {
        if (cancelled) return;
        const q = [it.location_name || it.title, destinationHint].filter(Boolean).join(", ");
        const coords = await geocodeOnce(geocoder, q);
        if (!coords || cancelled) continue;
        // Persist & notify parent.
        try {
          const res = await fetch("/api/itinerary", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: it.id, latitude: coords.lat, longitude: coords.lng }),
          });
          const json = await res.json();
          if (json.ok && json.data?.item) onItemUpdated?.(json.data.item);
        } catch {}
        // Yield to avoid hammering the geocoder.
        await new Promise((r) => setTimeout(r, 120));
      }
    })();
    return () => { cancelled = true; };
  }, [ready, items, destinationHint, onItemUpdated]);

  // 3. Draw markers whenever items change.
  React.useEffect(() => {
    const g = getGoogle();
    if (!ready || !mapRef.current || !g) return;
    for (const m of markersRef.current) m.setMap(null);
    markersRef.current = [];

    const bounds = new g.maps.LatLngBounds();
    const SymbolPath = g.maps.SymbolPath;

    for (const it of items) {
      if (!it.latitude || !it.longitude) continue;
      const pos: LatLng = { lat: Number(it.latitude), lng: Number(it.longitude) };
      const colour = colourForDay(it.day_number);
      const marker = new g.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: it.title,
        label: { text: String(it.day_number ?? ""), color: "#0b0c0e", fontSize: "11px", fontWeight: "700" },
        icon: {
          path: SymbolPath.CIRCLE,
          scale: 11,
          fillColor: colour,
          fillOpacity: 1,
          strokeColor: "#0b0c0e",
          strokeWeight: 2,
        },
      } as object);

      marker.addListener("click", () => {
        if (!infoRef.current) return;
        infoRef.current.setContent(infoHtml(it));
        infoRef.current.open({ anchor: marker, map: mapRef.current! });
      });

      markersRef.current.push(marker);
      bounds.extend(pos);
    }

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 64);
    }
  }, [ready, items]);

  if (error) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-surface/40 p-5 text-[12.5px] text-faint">
        <MapPin className="inline w-3.5 h-3.5 mr-1.5" />
        Map unavailable: {error}
      </div>
    );
  }

  const placed = items.filter((it) => it.latitude && it.longitude).length;
  const pending = items.length - placed;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-surface/40 overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <MapPin className="w-4 h-4 text-cyan" />
        <div className="text-[13px] font-medium">Map</div>
        <div className="ml-auto text-[11px] text-faint">
          {placed} placed{pending ? ` · locating ${pending}…` : ""}
        </div>
      </div>
      <div ref={elRef} className="w-full" style={{ height: 360 }} />
    </div>
  );
}

function infoHtml(it: ItineraryItemRow): string {
  const time = it.start_time ? `<div style="color:#9aa3b2;font-size:11px;margin-top:2px">${it.start_time.slice(0,5)}${it.end_time ? `–${it.end_time.slice(0,5)}` : ""}</div>` : "";
  const loc = it.location_name ? `<div style="color:#9aa3b2;font-size:11px">${escapeHtml(it.location_name)}</div>` : "";
  const img = it.image_url ? `<img src="${it.image_url}" style="width:200px;height:110px;object-fit:cover;border-radius:8px;margin-top:6px"/>` : "";
  return `<div style="color:#0b0c0e;max-width:220px;font-family:system-ui">
    <div style="font-weight:600;font-size:13px">Day ${it.day_number ?? 1} · ${escapeHtml(it.title)}</div>
    ${time}${loc}${img}
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function geocodeOnce(geocoder: GGeocoder, query: string): Promise<LatLng | null> {
  return new Promise((resolve) => {
    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== "OK" || !results || !results[0]) return resolve(null);
      const loc = results[0].geometry.location;
      resolve({ lat: loc.lat(), lng: loc.lng() });
    });
  });
}

// Dark map style tuned to TripOS palette.
const DARK_MAP_STYLE: object[] = [
  { elementType: "geometry", stylers: [{ color: "#101218" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a93a3" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#101218" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2a2f3a" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1c2029" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1320" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3b6ea8" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#13171f" }] },
];
