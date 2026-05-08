"use client";

/**
 * AppShell — sidebar nav + topbar for /app/* routes.
 * Mobile: collapsible drawer. Desktop: persistent left rail.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Plus,
  Map as MapIcon,
  Settings,
  Menu,
  X,
  LogOut,
  Plane,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: "/app/trips", label: "My Trips", icon: Plane },
  { href: "/app/trips/new", label: "New Trip", icon: Plus },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function NavItems({ pathname, onClick }: { pathname: string; onClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((n) => {
        const active = pathname === n.href || (n.href !== "/app/trips" && pathname.startsWith(n.href));
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors",
              active
                ? "bg-white/[0.06] text-fg border border-white/[0.08]"
                : "text-muted hover:text-fg hover:bg-white/[0.03] border border-transparent"
            )}
          >
            <n.icon className="w-4 h-4" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard({ user }: { user: User | null }) {
  const initials = (user?.user_metadata?.full_name || user?.email || "?")
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join("");
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <span className="grid place-items-center w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-sunset text-bg text-[11px] font-semibold">
        {initials || "U"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium truncate">
          {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
        </div>
        <div className="text-[10px] text-faint truncate">{user?.email}</div>
      </div>
      <form action="/auth/sign-out" method="post">
        <button
          type="submit"
          aria-label="Sign out"
          className="grid place-items-center w-7 h-7 rounded-lg text-faint hover:text-fg hover:bg-white/[0.05]"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-dvh flex bg-bg text-fg">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-ink/40 p-4 sticky top-0 h-dvh">
        <Link href="/" className="flex items-center gap-2 mb-7 px-1">
          <span className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-to-br from-cyan to-sunset shadow-[0_8px_30px_-8px_rgba(56,225,255,0.7)]">
            <Compass className="w-4 h-4 text-bg" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">TripOS</span>
        </Link>
        <NavItems pathname={pathname} />
        <div className="mt-auto">
          <UserCard user={user} />
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-40 bg-ink/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-gradient-to-br from-cyan to-sunset">
                <Compass className="w-3.5 h-3.5 text-bg" />
              </span>
              <span className="font-display text-sm font-semibold">TripOS</span>
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="grid place-items-center w-9 h-9 rounded-full border border-white/10 bg-white/[0.03]"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-bg/80 backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-ink border-r border-white/[0.08] p-4 flex flex-col"
              >
                <div className="flex items-center justify-between mb-7">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                    <span className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-to-br from-cyan to-sunset">
                      <Compass className="w-4 h-4 text-bg" />
                    </span>
                    <span className="font-display text-lg font-semibold">TripOS</span>
                  </Link>
                  <button
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                    className="grid place-items-center w-9 h-9 rounded-full border border-white/10 bg-white/[0.03]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <NavItems pathname={pathname} onClick={() => setMobileOpen(false)} />
                <div className="mt-auto"><UserCard user={user} /></div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10">{children}</div>
      </div>
    </div>
  );
}

/** Page-level wrapper: H1 + optional actions slot. Reuse across /app pages. */
export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.18em] text-cyan font-medium mb-2 inline-flex items-center gap-2">
            <MapIcon className="w-3 h-3" /> {eyebrow}
          </div>
        )}
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted mt-1.5 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
