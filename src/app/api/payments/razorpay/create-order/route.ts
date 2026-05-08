import { NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { createOrderSchema } from "@/lib/validations";
import { getRazorpay } from "@/lib/razorpay";
import { ok, fail, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid json", 400); }
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) return fail("validation failed", 400, parsed.error.format());

  const supabase = await createSupabaseServerClient();
  const razorpay = getRazorpay();

  // 1. create Razorpay order
  let order: { id: string; amount: number | string; currency: string; receipt?: string };
  try {
    order = await razorpay.orders.create({
      amount: parsed.data.amount_in_paise,
      currency: "INR",
      receipt: `tos_${Date.now()}_${user.id.slice(0, 6)}`,
      notes: {
        purpose: parsed.data.purpose,
        trip_id: parsed.data.trip_id ?? "",
        user_id: user.id,
      },
    });
  } catch (e) {
    return fail("razorpay order failed: " + (e instanceof Error ? e.message : String(e)), 500);
  }

  // 2. record payment row in DB (status = created)
  const { data: payment, error: dbError } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      trip_id: parsed.data.trip_id ?? null,
      razorpay_order_id: order.id,
      amount: parsed.data.amount_in_paise / 100,
      currency: "INR",
      purpose: parsed.data.purpose,
      status: "created",
    })
    .select("*").single();
  if (dbError || !payment) return fail(dbError?.message || "db insert failed", 500);

  return ok({
    payment,
    razorpay_order: order,
    razorpay_key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
