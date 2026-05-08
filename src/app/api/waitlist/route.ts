import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { waitlistSchema } from "@/lib/validations";
import { sendWaitlistConfirmationEmail } from "@/lib/resend";
import { ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid json", 400);
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("waitlist_entries")
    .insert(parsed.data)
    .select("id, email")
    .single();
  if (error) return fail(error.message, 500);

  // Fire-and-forget email so we never block the response.
  void sendWaitlistConfirmationEmail({ to: parsed.data.email, name: parsed.data.name });

  return ok({ id: data.id });
}
