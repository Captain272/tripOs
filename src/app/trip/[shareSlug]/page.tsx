/**
 * Public Trip Capsule view. Anyone with the link can view if
 * trip_capsules.is_public = true. Expenses are hidden unless
 * show_expenses_publicly is also true.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles, Compass, MapPin, Calendar, ArrowRight } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ButtonLink } from "@/components/ui/Button";
import { num, inr } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface StoryDay { day: number; title: string; story: string; items?: { title: string }[] }
interface StoryContent {
  cover: { title: string; destination: string | null; dates: { start: string | null; end: string | null } };
  members: { name: string | null; avatar_url: string | null }[];
  days: StoryDay[];
  wrapped: {
    total_spend: number; per_person_average: number; traveler_count: number;
    days: number | null; photo_count: number; place_count: number;
  };
}

export default async function PublicCapsulePage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  // Service role read because the capsule may not be authed.
  const admin = getSupabaseAdmin();
  const { data: capsule } = await admin
    .from("trip_capsules")
    .select("*, trip:trips(*)")
    .eq("public_share_slug", shareSlug)
    .maybeSingle();
  if (!capsule || !capsule.is_public) notFound();

  const story: StoryContent = capsule.story_content as StoryContent;
  const showExpenses = capsule.show_expenses_publicly === true;

  return (
    <main className="min-h-dvh">
      {/* Top bar */}
      <header className="px-5 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-to-br from-cyan to-sunset">
            <Compass className="w-4 h-4 text-bg" strokeWidth={2.5} />
          </span>
          <span className="font-display font-semibold tracking-tight">TripOS</span>
        </Link>
        <ButtonLink href="/login?next=/app/trips/new" size="sm">
          <Sparkles className="w-4 h-4" />
          Create your own
        </ButtonLink>
      </header>

      <div className="mx-auto max-w-[1100px] px-5 sm:px-8 pb-20">
        {/* Cover */}
        <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-sunset/10 via-violet/10 to-cyan/10 p-6 sm:p-12 overflow-hidden">
          <div className="text-[11px] uppercase tracking-[0.2em] text-gold mb-3">Trip Capsule</div>
          <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight">
            {story?.cover?.title || capsule.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
            {story?.cover?.destination && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {story.cover.destination}
              </span>
            )}
            {story?.cover?.dates?.start && story?.cover?.dates?.end && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(story.cover.dates.start).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                {" – "}
                {new Date(story.cover.dates.end).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
            <span>{(story?.members || []).length} travelers</span>
          </div>
          {!showExpenses && (
            <div className="mt-6 inline-flex items-center gap-1.5 text-[11px] text-faint">
              <span className="w-1.5 h-1.5 rounded-full bg-faint" /> Expenses hidden
            </div>
          )}
        </div>

        {/* Stats */}
        {story?.wrapped && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { l: "Travelers", v: num(story.wrapped.traveler_count) },
              { l: "Days", v: num(story.wrapped.days || 0) },
              { l: "Photos", v: num(story.wrapped.photo_count) },
              { l: "Places", v: num(story.wrapped.place_count) },
              showExpenses ? { l: "Total spend", v: inr(story.wrapped.total_spend) } : null,
              showExpenses ? { l: "Per person", v: inr(story.wrapped.per_person_average) } : null,
            ].filter(Boolean).map((s) => (
              <div key={s!.l} className="rounded-2xl border border-white/[0.07] bg-surface/40 p-4">
                <div className="text-[10px] uppercase tracking-wider text-faint">{s!.l}</div>
                <div className="font-display text-xl font-semibold mt-1">{s!.v}</div>
              </div>
            ))}
          </div>
        )}

        {/* Days */}
        {story?.days?.length > 0 && (
          <div className="mt-10 space-y-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-cyan font-medium">The story</div>
            {story.days.map((d) => (
              <div key={d.day} className="rounded-2xl border border-white/[0.07] bg-ink/40 p-5">
                <div className="text-[10px] uppercase tracking-wider text-cyan mb-1">Day {d.day}</div>
                <div className="font-display text-lg font-semibold">{d.title}</div>
                <div className="text-[13px] text-muted mt-2">{d.story}</div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-3xl border border-cyan/30 bg-gradient-to-br from-cyan/10 to-sunset/10 p-6 sm:p-10 text-center">
          <div className="text-[11px] uppercase tracking-[0.2em] text-cyan font-medium mb-3">
            Want a Capsule like this?
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            Create your own TripOS
          </h2>
          <p className="text-sm text-muted mt-2 max-w-md mx-auto">
            Plan, vote, split, settle, and relive group trips — in one shared workspace.
          </p>
          <ButtonLink href="/login?next=/app/trips/new" className="mt-6">
            Start a trip <ArrowRight className="w-4 h-4" />
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
