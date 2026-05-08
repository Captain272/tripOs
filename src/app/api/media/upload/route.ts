import { NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { ok, fail, unauthorized } from "@/lib/api";
import { z } from "zod";

/**
 * /api/media/upload — records the metadata row for a freshly uploaded file.
 *
 * The actual upload happens client-side via supabase-js.upload (RLS gates
 * by trip-membership). Once that resolves, the client posts here so the
 * row in trip_media gets created.
 */

export const dynamic = "force-dynamic";

const schema = z.object({
  trip_id: z.string().uuid(),
  file_url: z.string().url(),
  file_type: z.enum(["image", "video", "receipt", "ticket", "document"]).optional(),
  caption: z.string().max(500).optional(),
  taken_at: z.string().optional(),
  location_name: z.string().max(160).optional(),
  day_number: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trip_media")
    .insert({ ...parsed.data, uploaded_by: user.id })
    .select("*").single();
  if (error || !data) return fail(error?.message || "insert failed", 500);
  return ok({ media: data });
}
