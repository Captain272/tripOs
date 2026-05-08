/**
 * Analytics — single entry point for product event tracking.
 *
 * Adapters fan out to any provider you wire up:
 *   - GA4         → window.gtag('event', name, props)
 *   - Meta Pixel  → window.fbq('trackCustom', name, props)
 *   - Custom API  → POST /api/events  (your backend)
 *
 * In dev, events are logged to the console. In production, providers that
 * are present on window are called; missing providers are silently skipped.
 *
 * To enable a provider, install its snippet in app/layout.tsx (script tag
 * with `next/script` strategy="afterInteractive") so window.gtag /
 * window.fbq exist by the time `track()` runs.
 */

// ──────────────────────────────────────────────────────── event registry

/**
 * The full set of tracked events. Keep this list authoritative —
 * add new events here first, then call `track()` with the literal name
 * so TypeScript catches typos.
 */
export const EVENTS = {
  WAITLIST_SUBMIT: "waitlist_submit",
  PARTNER_LEAD_SUBMIT: "partner_lead_submit",
  CREATOR_INTEREST_SUBMIT: "creator_interest_submit",
  HERO_CTA_CLICK: "hero_cta_click",
  PRICING_CTA_CLICK: "pricing_cta_click",
  TRIP_PARSER_DEMO_CLICK: "trip_parser_demo_click",
  // App-side product events
  TRIP_CREATED: "trip_created",
  EXPENSE_CREATED: "expense_created",
  SETTLEMENT_GENERATED: "settlement_generated",
  CAPSULE_UNLOCKED: "capsule_unlocked",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/** Properties allowed on any event. Strings/numbers/bools only — keeps payloads JSON-safe. */
export type EventProps = Record<
  string,
  string | number | boolean | null | undefined
>;

// ───────────────────────────────────────────────────────── window typings

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "set",
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
    fbq?: (
      command: "track" | "trackCustom" | "init",
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
    /** Optional custom collector e.g. set up via your own snippet. */
    triposAnalytics?: (event: string, props: EventProps) => void;
  }
}

// ───────────────────────────────────────────────────────────── adapters

function gaAdapter(event: string, props: EventProps) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", event, props);
}

function metaPixelAdapter(event: string, props: EventProps) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  // Meta uses trackCustom for non-standard events.
  window.fbq("trackCustom", event, props);
}

function customAdapter(event: string, props: EventProps) {
  if (typeof window === "undefined") return;
  // 1) any user-defined collector
  if (typeof window.triposAnalytics === "function") {
    try {
      window.triposAnalytics(event, props);
    } catch {
      /* ignore */
    }
  }
  // 2) backend POST — fire-and-forget, no await, sendBeacon if available
  const payload = JSON.stringify({ event, props, ts: Date.now() });
  try {
    if (navigator?.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        /* ignore network errors — analytics must never break UX */
      });
    }
  } catch {
    /* ignore */
  }
}

const ADAPTERS = [gaAdapter, metaPixelAdapter, customAdapter];

// ───────────────────────────────────────────────────────────────── api

/**
 * Track an event. Safe to call from any component — never throws,
 * never blocks render, never blocks navigation.
 */
export function track(event: EventName, props: EventProps = {}): void {
  if (typeof window === "undefined") return;

  const enriched: EventProps = {
    ...props,
    page_path: window.location.pathname,
    page_referrer: document.referrer || null,
  };

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, enriched);
  }

  for (const adapter of ADAPTERS) {
    try {
      adapter(event, enriched);
    } catch {
      /* one bad adapter must not break the others */
    }
  }
}

/** Convenience: identify (set user properties). Wire to your providers later. */
export function identify(userId: string, traits: EventProps = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("set", "user_properties", { user_id: userId, ...traits });
  } catch {
    /* ignore */
  }
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[analytics] identify`, userId, traits);
  }
}

/** Convenience: page-view. Call in route handlers / app shell if needed. */
export function pageView(path: string): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("config", path, {});
  } catch {
    /* ignore */
  }
}
