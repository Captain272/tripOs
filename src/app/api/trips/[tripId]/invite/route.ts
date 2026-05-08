import { NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { ok, fail, unauthorized, notFound } from "@/lib/api";
import { sendTripInviteEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

const inviteBody = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

interface Params { params: Promise<{ tripId: string }>; }

export async function POST(req: NextRequest, { params }: Params) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = inviteBody.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const supabase = await createSupabaseServerClient();
  const { data: trip } = await supabase.from("trips").select("id, title").eq("id", tripId).single();
  if (!trip) return notFound("trip");

  // If a profile exists for this email, link directly. Otherwise insert
  // an invited row keyed by email — they'll claim it on first login.
  const admin = getSupabaseAdmin();
  const { data: existingProfile } = await admin
    .from("profiles").select("id").eq("email", parsed.data.email).maybeSingle();

  const insertRow = {
    trip_id: tripId,
    user_id: existingProfile?.id ?? null,
    email: parsed.data.email,
    role: parsed.data.role,
    status: existingProfile ? "joined" : "invited",
    joined_at: existingProfile ? new Date().toISOString() : null,
  };
  const { error } = await admin.from("trip_members").insert(insertRow);
  if (error) return fail(error.message, 500);

  const { data: inviter } = await supabase
    .from("profiles").select("full_name, email").eq("id", user.id).single();

  void sendTripInviteEmail({
    to: parsed.data.email,
    trip_title: trip.title,
    inviter_name: inviter?.full_name || inviter?.email || "A friend",
    trip_id: tripId,
  });

  return ok({ invited: parsed.data.email });
}
