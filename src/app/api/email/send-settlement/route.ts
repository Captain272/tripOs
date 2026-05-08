import { NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { sendSettlementReportEmail } from "@/lib/resend";
import { ok, fail, unauthorized, notFound } from "@/lib/api";
import { z } from "zod";

const schema = z.object({ trip_id: z.string().uuid() });
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400);

  const supabase = await createSupabaseServerClient();
  const { data: trip } = await supabase
    .from("trips").select("id, title").eq("id", parsed.data.trip_id).single();
  if (!trip) return notFound("trip");

  const { data: report } = await supabase
    .from("settlement_reports")
    .select("id, total_spend, per_person_average, summary")
    .eq("trip_id", parsed.data.trip_id)
    .order("generated_at", { ascending: false })
    .limit(1).maybeSingle();
  if (!report) return notFound("settlement report");

  const { data: txs } = await supabase
    .from("settlement_transactions")
    .select("amount, from_user:profiles!from_user_id(full_name), to_user:profiles!to_user_id(full_name)")
    .eq("report_id", report.id);

  const { data: members } = await supabase
    .from("trip_members")
    .select("email, profile:profiles(email, full_name)")
    .eq("trip_id", parsed.data.trip_id)
    .eq("status", "joined");

  type TxJoined = {
    amount: number;
    from_user: { full_name: string | null } | null;
    to_user: { full_name: string | null } | null;
  };
  const lines = ((txs || []) as unknown as TxJoined[]).map(
    (t) => `${t.from_user?.full_name ?? "Member"} pays ${t.to_user?.full_name ?? "Member"} ₹${Number(t.amount).toLocaleString("en-IN")}`
  );
  const summary_text =
    `${trip.title} settlement:\n` +
    (lines.length ? lines.join("\n") : "All settled — no transactions needed.");

  type MemberJoined = { email: string | null; profile: { email: string | null } | null };
  const memberList = (members || []) as unknown as MemberJoined[];
  const recipients = memberList
    .map((m) => m.profile?.email || m.email)
    .filter((e): e is string => Boolean(e));
  if (recipients.length === 0) return fail("no recipients", 400);

  await sendSettlementReportEmail({
    to: recipients,
    trip_title: trip.title,
    summary_text,
    trip_id: trip.id,
  });
  return ok({ recipients: recipients.length });
}
