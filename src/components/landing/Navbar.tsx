"use client";

/**
 * Navbar — sticky top, glass on scroll, mobile drawer.
 * Anchor links scroll smoothly to in-page sections.
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { NAV_LINKS, BRAND } from "@/constants/landing";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
  }, [open]);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/[0.06] bg-bg/70 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 group">
          <span className="relative grid place-items-center w-8 h-8 rounded-xl bg-gradient-to-br from-cyan to-sunset shadow-[0_8px_30px_-8px_rgba(56,225,255,0.7)]">
            <Compass className="w-4 h-4 text-bg" strokeWidth={2.5} />
            <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan to-sunset blur-md opacity-50 -z-10" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            {BRAND.name}
          </span>
          <span className="hidden md:inline-block ml-2 text-[10px] font-medium uppercase tracking-[0.2em] text-faint border border-white/10 rounded-full px-2 py-0.5">
            Beta
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm text-muted hover:text-fg transition-colors rounded-full"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href="#waitlist" size="sm">
            Join waitlist
          </ButtonLink>
        </div>

        <button
          className="md:hidden grid place-items-center w-10 h-10 rounded-full border border-white/10 bg-white/[0.04]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open menu"
          aria-expanded={open}
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden border-t border-white/[0.06] bg-ink/95 backdrop-blur-xl"
          >
            <div className="px-5 py-5 flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 text-base text-fg/90 hover:text-fg rounded-xl hover:bg-white/[0.04]"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-3 mt-3 border-t border-white/[0.06]">
                <ButtonLink href="/login" variant="ghost" onClick={() => setOpen(false)}>
                  Sign in
                </ButtonLink>
                <ButtonLink href="#waitlist" onClick={() => setOpen(false)}>
                  Join waitlist
                </ButtonLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
