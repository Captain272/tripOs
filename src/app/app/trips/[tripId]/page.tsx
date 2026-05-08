import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Calendar, Vote, Wallet, Receipt, Handshake, Camera, BookOpen, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { inr, num } from "@/lib/utils";
import { InvitePanel } from "@/components/app/InvitePanel";

export const dynamic = "force-dynamic";

const TILES = [
  { href: "plan", label: "Plan", desc: "Day-wise itinerary, routes, notes.", icon: Calendar, color: "text-cyan" },
  { href: "vote", label: "Vote", desc: "Decide hotels, dates, activities.", icon: Vote, color: "text-violet" },
  { href: "budget", label: "Budget", desc: "Estimate vs. actual per person.", icon: Wallet, color: "text-gold" },
  { href: "ledger", label: "Ledger", desc: "Expenses, splits, receipts.", icon: Receipt, color: "text-sunset" },
  { href: "settle", label: "Settle", desc: "Who-owes-whom, minimized.", icon: Handshake, color: "text-emerald" },
  { href: "memories", label: "Memories", desc: "Photos, documents, captions.", icon: Camera, color: "text-rose" },
  { href: "capsule", label: "Capsule", desc: "AI storybook for the group.", icon: BookOpen, color: "text-gold" },
];

const MEMBER_COLORS = ["#38e1ff", "#ff8c4a", "#34d399", "#a78bfa", "#ffd27a", "#fb7185"];

export default async function TripOverview({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createSupabaseServerClient();

  const [
    { data: trip },
    { data: members },
    { count: itineraryCount },
    { data: expenses },
    { count: photoCount },
    { count: receiptCount },
  ] = await Promise.all([
    supabase.from("trips").select("*").eq("id", tripId).single(),
    supabase
      .from("trip_members")
      .select("user_id, role, status, profile:profiles(id, full_name, avatar_url, email)")
      .eq("trip_id", tripId).eq("status", "joined"),
    supabase.from("itinerary_items").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
    supabase.from("expenses").select("amount").eq("trip_id", tripId),
    supabase.from("trip_media").select("id", { count: "exact", head: true })
      .eq("trip_id", tripId).eq("file_type", "image"),
    supabase.from("trip_media").select("id", { count: "exact", head: true })
      .eq("trip_id", tripId).eq("file_type", "receipt"),
  ]);

  const totalSpend = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
  const memberCount = (members || []).length;
  const perPerson = memberCount ? Math.round(totalSpend / memberCount) : 0;
  const estBudget = trip?.budget_per_person && memberCount ? Number(trip.budget_per_person) * memberCount : null;

  return (
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 lg:gap-8">
      <div className="space-y-6">
        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Members", v: num(memberCount) },
            { l: "Plan items", v: num(itineraryCount || 0) },
            { l: "Total spend", v: inr(totalSpend) },
            { l: "Per person", v: inr(perPerson) },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-white/[0.07] bg-surface/40 p-4">
              <div className="text-[10px] uppercase tracking-wider text-faint">{s.l}</div>
              <div className="font-display text-xl sm:text-2xl font-semibold mt-1">{s.v}</div>
            </div>
          ))}
        </div>

        {/* Tab CTAs */}
        <div className="grid sm:grid-cols-2 gap-3">
          {TILES.map((t) => (
            <Link
              key={t.href}
              href={`/app/trips/${tripId}/${t.href}`}
              className="group rounded-2xl border border-white/[0.07] bg-surface/40 p-5 hover:border-white/[0.18] hover:bg-surface/60 transition-colors flex items-start gap-4"
            >
              <span className={`grid place-items-center w-10 h-10 rounded-xl bg-white/[0.04] ${t.color}`}>
                <t.icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold flex items-center justify-between gap-3">
                  {t.label}
                  <ArrowRight className="w-4 h-4 text-faint group-hover:text-fg group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-[12.5px] text-muted mt-0.5">{t.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Activity / counts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/[0.07] bg-surface/40 p-4">
            <div className="text-[10px] uppercase tracking-wider text-faint">Receipts</div>
            <div className="font-display text-lg font-semibold mt-1">{num(receiptCount || 0)}</div>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-surface/40 p-4">
            <div className="text-[10px] uppercase tracking-wider text-faint">Photos</div>
            <div className="font-display text-lg font-semibold mt-1">{num(photoCount || 0)}</div>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-surface/40 p-4">
            <div className="text-[10px] uppercase tracking-wider text-faint">Est. budget</div>
            <div className="font-display text-lg font-semibold mt-1">
              {estBudget ? inr(estBudget) : "—"}
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-white/[0.07] bg-surface/40 p-5">
          <div className="text-[10px] uppercase tracking-wider text-faint mb-3">Members</div>
          <ul className="space-y-2.5">
            {(members || []).map((m, i: number) => {
              type MemberRow = { user_id: string | null; role: string; profile: { full_name: string | null; email: string | null } | null };
              const mm = m as unknown as MemberRow;
              const name = mm.profile?.full_name || mm.profile?.email || "Member";
              const initials = name.split(/\s+|@/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
              return (
                <li key={mm.user_id || i} className="flex items-center gap-3">
                  <Avatar
                    member={{
                      name,
                      initials: initials || "M",
                      color: MEMBER_COLORS[i % MEMBER_COLORS.length],
                    }}
                    size={28}
                  />
                  <div className="flex-1 min-w-0 text-[13px] truncate">{name}</div>
                  <span className="text-[10px] text-faint uppercase tracking-wider">{mm.role}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <InvitePanel tripId={tripId} />
      </aside>
    </div>
  );
}
