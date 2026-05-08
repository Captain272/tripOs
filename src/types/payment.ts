import type { PaymentPurpose, PaymentRow } from "./database";

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface CreateOrderInput {
  trip_id?: string;
  purpose: PaymentPurpose;
  amount_in_paise: number;
}

export interface CreateOrderResponse {
  payment: PaymentRow;
  razorpay_order: RazorpayOrder;
  razorpay_key_id: string;
}

/** Razorpay webhook event shape — only fields we actually consume. */
export interface RazorpayWebhookEvent {
  event: string; // e.g. "payment.captured", "order.paid"
  payload: {
    payment?: { entity: { id: string; order_id: string; status: string } };
    order?: { entity: { id: string; status: string } };
  };
}
