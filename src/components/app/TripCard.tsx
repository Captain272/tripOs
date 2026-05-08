"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Users, MapPin, ArrowRight } from "lucide-react";
import type { TripRow } from "@/types/database";
import { format } from "date-fns";
import { cn, inr } from "@/lib/utils";

const statusColor: Record<string, string> = {
  planning: "bg-cyan/10 text-cyan border-cyan/30",
  active: "bg-sunset/10 text-sunset border-sunset/30",
  completed: "bg-emerald/10 text-emerald border-emerald/30",
};

export function TripCard({ trip, members_count }: { trip: TripRow; members_count?: number }) {
  const dateRange =
    trip.start_date && trip.end_date
      ? `${format(new Date(trip.start_date), "MMM d")} – ${format(new Date(trip.end_date), "MMM d, yyyy")}`
      : "Dates not set";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        href={`/app/trips/${trip.id}`}
        className="group block rounded-2xl border border-white/[0.08] bg-surface/40 p-5 hover:border-white/[0.18] hover:bg-surface/60 transition-colors"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <span
            className={cn(
              "inline-flex text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border",
              statusColor[trip.status] || "bg-white/5 text-faint border-white/10"
            )}
          >
            {trip.status}
          </span>
          <ArrowRight className="w-4 h-4 text-faint group-hover:text-fg group-hover:translate-x-0.5 transition-all" />
        </div>
        <h3 className="font-display text-lg font-semibold tracking-tight">{trip.title}</h3>
        {trip.destination && (
          <div className="flex items-center gap-1.5 text-[12.5px] text-muted mt-1">
            <MapPin className="w-3 h-3" /> {trip.destination}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/[0.05]">
          <div className="flex items-center gap-1.5 text-[11px] text-faint">
            <Calendar className="w-3 h-3" />
            <span className="truncate">{dateRange}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-faint">
            <Users className="w-3 h-3" />
            <span>{members_count ?? "—"} members</span>
          </div>
          <div className="text-[11px] text-faint truncate text-right">
            {trip.budget_per_person ? `${inr(Number(trip.budget_per_person))}/person` : "Open budget"}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
