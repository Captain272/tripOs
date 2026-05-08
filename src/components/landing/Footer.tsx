import { Compass, Mail } from "lucide-react";
import { Container } from "@/components/ui/Section";
import { BRAND } from "@/constants/landing";

// Brand glyphs (inline SVG so they don't depend on lucide brand icons)
function InstagramGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}
function XGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.53 3H20.6l-6.71 7.66L22 21h-6.32l-4.95-6.47L4.97 21H1.9l7.18-8.2L1.6 3h6.49l4.48 5.93L17.53 3Zm-1.11 16.13h1.7L7.66 4.78h-1.83l10.59 14.35Z" />
    </svg>
  );
}

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Plan", href: "#product" },
      { label: "Vote", href: "#product" },
      { label: "Ledger", href: "#ledger" },
      { label: "Memories", href: "#memories" },
    ],
  },
  {
    title: "Partners",
    links: [
      { label: "Hotels & homestays", href: "#partners" },
      { label: "Activity providers", href: "#partners" },
      { label: "Travel organizers", href: "#partners" },
    ],
  },
  {
    title: "Creators",
    links: [
      { label: "Trip templates", href: "#use-cases" },
      { label: "Earn with TripOS", href: "#use-cases" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Pricing", href: "#pricing" },
      { label: "Vision", href: "#vision" },
      { label: "Contact", href: "mailto:hello@tripos.app" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-12 border-t border-white/[0.06] bg-ink/40">
      <Container>
        <div className="py-14 grid lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))] gap-10 lg:gap-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-to-br from-cyan to-sunset shadow-[0_8px_30px_-8px_rgba(56,225,255,0.7)]">
                <Compass className="w-4 h-4 text-bg" strokeWidth={2.5} />
              </span>
              <span className="font-display text-lg font-semibold">
                {BRAND.name}
              </span>
            </div>
            <p className="mt-4 text-sm text-muted max-w-sm leading-relaxed">
              {BRAND.tagline}
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { Icon: InstagramGlyph, href: "#", label: "Instagram" },
                { Icon: XGlyph, href: "#", label: "X / Twitter" },
                { Icon: Mail, href: "mailto:hello@tripos.app", label: "Email" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid place-items-center w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] text-muted hover:text-fg hover:bg-white/[0.06] transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {COLS.map((c) => (
            <div key={c.title}>
              <div className="text-[11px] uppercase tracking-wider text-faint font-medium mb-3">
                {c.title}
              </div>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-fg/80 hover:text-fg transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="py-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-faint">
          <div>© {new Date().getFullYear()} {BRAND.name}. Crafted for group trips that don&apos;t want to live in a WhatsApp group anymore.</div>
          <div className="font-mono">
            <span className="text-emerald">●</span> All systems planning
          </div>
        </div>
      </Container>
    </footer>
  );
}
