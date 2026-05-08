import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TripTabs } from "@/components/app/TripTabs";
import { format } from "date-fns";
import { MapPin, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: trip } = await supabase
    .from("trips").select("*").eq("id", tripId).single();
  if (!trip) notFound();

  const { count: memberCount } = await supabase
    .from("trip_members").select("id", { count: "exact", head: true })
    .eq("trip_id", tripId).eq("status", "joined");

  const dates =
    trip.start_date && trip.end_date
      ? `${format(new Date(trip.start_date), "MMM d")} – ${format(new Date(trip.end_date), "MMM d, yyyy")}`
      : "Dates not set";

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-cyan font-medium mb-2">
            Trip workspace
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight truncate">
            {trip.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
            {trip.destination && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {trip.destination}
              </span>
            )}
            <span>{dates}</span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> {memberCount ?? 1} members
            </span>
          </div>
        </div>
        <ButtonLink href={`/app/trips/${tripId}/capsule`} variant="ghost" size="sm">
          View Trip Capsule
        </ButtonLink>
      </div>

      <TripTabs tripId={tripId} />

      <div className="pb-12">{children}</div>
    </>
  );
}
