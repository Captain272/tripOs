import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { sendTripInviteEmail } from "@/lib/resend";
import { ok, fail, unauthorized } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  to: z.string().email(),
  trip_title: z.string(),
  inviter_name: z.string(),
  trip_id: z.string().uuid(),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400);
  const result = await sendTripInviteEmail(parsed.data);
  return ok(result);
}
