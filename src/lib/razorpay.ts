import Razorpay from "razorpay";
import crypto from "node:crypto";

/** Cached Razorpay SDK instance. Server-only. */
let _client: Razorpay | null = null;
export function getRazorpay(): Razorpay {
  if (typeof window !== "undefined") {
    throw new Error("Razorpay client must not be used in the browser");
  }
  if (_client) return _client;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured");
  }
  _client = new Razorpay({ key_id, key_secret });
  return _client;
}

/** Verify the X-Razorpay-Signature header on incoming webhooks.
 *  Prefer constant-time comparison. */
export function verifyRazorpayWebhookSignature(opts: {
  body: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(opts.body)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(opts.signature, "hex")
    );
  } catch {
    return false;
  }
}

/** Verify a successful payment from the client (Razorpay Standard Checkout
 *  returns razorpay_order_id / razorpay_payment_id / razorpay_signature). */
export function verifyCheckoutSignature(opts: {
  order_id: string;
  payment_id: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${opts.order_id}|${opts.payment_id}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(opts.signature, "hex")
    );
  } catch {
    return false;
  }
}
