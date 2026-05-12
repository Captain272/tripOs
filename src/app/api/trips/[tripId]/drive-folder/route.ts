import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  drive_folder_id: z.string().min(1).nullable(),
  drive_folder_name: z.string().max(200).nullable().optional(),
});

interface Params { params: Promise<{ tripId: string }>; }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const admin = getSupabaseAdmin();
  const { data: membership } = await admin
    .from("trip_members")
    .select("id")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .eq("status", "joined")
    .maybeSingle();
  if (!membership) return fail("not a member of this trip", 403);

  const update: Record<string, unknown> = {
    drive_folder_id: parsed.data.drive_folder_id,
  };
  if (parsed.data.drive_folder_name !== undefined) {
    update.drive_folder_name = parsed.data.drive_folder_name;
  }
  // Clearing the folder also resets sync timestamp.
  if (parsed.data.drive_folder_id === null) update.drive_last_synced_at = null;

  const { data, error } = await admin
    .from("trips")
    .update(update)
    .eq("id", tripId)
    .select("*")
    .single();
  if (error || !data) return fail(error?.message || "update failed", 500);
  return ok({ trip: data });
}
