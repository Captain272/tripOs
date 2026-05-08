"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Vote, Wallet, Receipt, Handshake, Camera, BookOpen, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function TripTabs({ tripId }: { tripId: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/app/trips/${tripId}`,           label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `/app/trips/${tripId}/plan`,      label: "Plan",     icon: Calendar },
    { href: `/app/trips/${tripId}/vote`,      label: "Vote",     icon: Vote },
    { href: `/app/trips/${tripId}/budget`,    label: "Budget",   icon: Wallet },
    { href: `/app/trips/${tripId}/ledger`,    label: "Ledger",   icon: Receipt },
    { href: `/app/trips/${tripId}/settle`,    label: "Settle",   icon: Handshake },
    { href: `/app/trips/${tripId}/memories`,  label: "Memories", icon: Camera },
    { href: `/app/trips/${tripId}/capsule`,   label: "Capsule",  icon: BookOpen },
  ];
  return (
    <div className="no-scrollbar overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-7">
      <div className="inline-flex gap-1 p-1 rounded-full border border-white/[0.07] bg-surface/40 backdrop-blur-md">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors",
                active ? "bg-white/[0.06] text-fg" : "text-muted hover:text-fg"
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
