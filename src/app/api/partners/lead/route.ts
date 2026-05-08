import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { partnerLeadSchema } from "@/lib/validations";
import { sendPartnerLeadConfirmationEmail } from "@/lib/resend";
import { ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid json", 400);
  }
  const parsed = partnerLeadSchema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("partner_leads")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error) return fail(error.message, 500);

  if (parsed.data.email) {
    void sendPartnerLeadConfirmationEmail({
      to: parsed.data.email,
      business_name: parsed.data.business_name,
    });
  }

  return ok({ id: data.id });
}
