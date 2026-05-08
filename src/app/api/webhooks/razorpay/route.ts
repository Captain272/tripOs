import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { sendPaymentConfirmationEmail } from "@/lib/resend";
import type { RazorpayWebhookEvent } from "@/types/payment";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook: verify signature, mark payment paid, unlock capsule
 * (when applicable), and send a confirmation email.
 *
 * Important: read the raw body BEFORE parsing JSON so the HMAC matches.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyRazorpayWebhookSignature({ body: raw, signature })) {
    return new Response("invalid signature", { status: 401 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const orderId =
    event.payload?.order?.entity?.id ?? event.payload?.payment?.entity?.order_id;
  const paymentId = event.payload?.payment?.entity?.id ?? null;

  if (!orderId) return new Response("no order_id", { status: 200 });

  const success = ["payment.captured", "order.paid"].includes(event.event);
  const failed = ["payment.failed"].includes(event.event);

  const admin = getSupabaseAdmin();
  // 1. find the matching payment row
  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();
  if (!payment) return new Response("payment not found", { status: 200 });

  // 2. update status (idempotent — already-paid is a no-op)
  if (success && payment.status !== "paid") {
    await admin
      .from("payments")
      .update({
        status: "paid",
        razorpay_payment_id: paymentId,
        metadata: { ...(payment.metadata || {}), event: event.event },
      })
      .eq("id", payment.id);

    // 3. apply purpose-specific side effects
    if (payment.purpose === "capsule_unlock" && payment.trip_id) {
      await admin
        .from("trip_capsules")
        .update({ is_unlocked: true })
        .eq("trip_id", payment.trip_id);
    }

    // 4. confirmation email (best-effort)
    if (payment.user_id) {
      const { data: profile } = await admin
        .from("profiles").select("email").eq("id", payment.user_id).maybeSingle();
      if (profile?.email) {
        void sendPaymentConfirmationEmail({
          to: profile.email,
          amount: Number(payment.amount),
          purpose: payment.purpose ?? "trip_pro_unlock",
          trip_id: payment.trip_id,
        });
      }
    }
  } else if (failed && payment.status !== "paid") {
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
  }

  return new Response("ok", { status: 200 });
}
