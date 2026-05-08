import Link from "next/link";
import { Plus, Plane, Sparkles } from "lucide-react";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app/AppShell";
import { TripCard } from "@/components/app/TripCard";
import { ButtonLink } from "@/components/ui/Button";
import type { TripRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  // Fetch trips this user is a member of, plus member counts.
  const { data: rows } = await supabase
    .from("trip_members")
    .select("trip:trip_id(*), trip_id")
    .eq("user_id", user!.id)
    .eq("status", "joined");

  type RowShape = { trip: TripRow | null; trip_id: string };
  const trips = ((rows || []) as unknown as RowShape[])
    .map((r) => r.trip)
    .filter((t): t is TripRow => t !== null);

  // members count map (one query)
  let countsMap: Record<string, number> = {};
  if (trips.length) {
    const { data: counts } = await supabase
      .from("trip_members")
      .select("trip_id")
      .in("trip_id", trips.map((t) => t.id))
      .eq("status", "joined");
    countsMap = (counts || []).reduce<Record<string, number>>((acc, m) => {
      acc[m.trip_id] = (acc[m.trip_id] || 0) + 1;
      return acc;
    }, {});
  }

  return (
    <>
      <PageHeader
        eyebrow="Your trips"
        title={
          <>Hey {user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0]} 👋</>
        }
        subtitle="Pick up where your group left off — or start something new."
        actions={
          <ButtonLink href="/app/trips/new">
            <Plus className="w-4 h-4" />
            New trip
          </ButtonLink>
        }
      />

      {trips.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.12] bg-surface/30 px-6 py-16 text-center">
          <div className="mx-auto grid place-items-center w-12 h-12 rounded-full bg-cyan/10 text-cyan mb-5">
            <Plane className="w-5 h-5" />
          </div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Your first group trip starts here.
          </h2>
          <p className="text-sm text-muted mt-2 max-w-md mx-auto">
            Create a trip workspace, invite your group, and let TripOS turn the chaos into a plan.
          </p>
          <Link
            href="/app/trips/new"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-cyan to-cyan-soft text-bg font-semibold px-5 h-11 text-[15px]"
          >
            <Sparkles className="w-4 h-4" />
            Create your first trip
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((t) => (
            <TripCard key={t.id} trip={t} members_count={countsMap[t.id] ?? 1} />
          ))}
        </div>
      )}
    </>
  );
}
