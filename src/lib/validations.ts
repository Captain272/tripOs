/**
 * Zod schemas for request bodies. Reused on both client and server
 * (forms call .parse, API routes call .safeParse).
 */

import { z } from "zod";

// ─── enums ────────────────────────────────────────────────────────────
export const itineraryCategoryEnum = z.enum([
  "stay",
  "food",
  "activity",
  "travel",
  "note",
]);

export const expenseCategoryEnum = z.enum([
  "stay",
  "food",
  "fuel",
  "activity",
  "transfer",
  "shopping",
  "other",
]);

export const pollTypeEnum = z.enum([
  "hotel",
  "activity",
  "date",
  "restaurant",
  "custom",
]);

export const partnerBusinessTypeEnum = z.enum([
  "hotel",
  "homestay",
  "cafe",
  "activity",
  "travel_organizer",
  "other",
]);

export const waitlistUserTypeEnum = z.enum([
  "friends_trip",
  "college_trip",
  "office_offsite",
  "travel_organizer",
  "hotel_partner",
  "creator",
]);

// ─── trips ────────────────────────────────────────────────────────────
export const createTripSchema = z.object({
  title: z.string().trim().min(2).max(120),
  destination: z.string().trim().max(120).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  budget_per_person: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((v) => (v === null || v === undefined || v === "" ? null : Number(v))),
  visibility: z.enum(["private", "group", "public"]).default("private"),
});
export type CreateTripInput = z.infer<typeof createTripSchema>;

export const updateTripSchema = createTripSchema.partial();
export type UpdateTripInput = z.infer<typeof updateTripSchema>;

export const inviteMemberSchema = z.object({
  trip_id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

// ─── itinerary ────────────────────────────────────────────────────────
export const itineraryItemSchema = z.object({
  trip_id: z.string().uuid(),
  day_number: z.number().int().min(1).max(60).optional().nullable(),
  title: z.string().trim().min(1).max(160),
  description: z.string().max(2000).optional().nullable(),
  location_name: z.string().max(160).optional().nullable(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
  category: itineraryCategoryEnum.optional().nullable(),
  estimated_cost: z.number().nonnegative().optional().nullable(),
});

// ─── polls ────────────────────────────────────────────────────────────
export const createPollSchema = z.object({
  trip_id: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().max(1000).optional().nullable(),
  type: pollTypeEnum.optional().nullable(),
  closes_at: z.string().optional().nullable(),
  options: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(160),
        description: z.string().optional().nullable(),
        price: z.number().optional().nullable(),
        external_url: z.string().url().optional().nullable(),
      })
    )
    .min(2)
    .max(10),
});

export const castVoteSchema = z.object({
  poll_id: z.string().uuid(),
  option_id: z.string().uuid(),
});

// ─── expenses ─────────────────────────────────────────────────────────
export const expenseSchema = z.object({
  trip_id: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  amount: z.number().positive(),
  currency: z.string().length(3).default("INR"),
  paid_by: z.string().uuid(),
  category: expenseCategoryEnum.optional().nullable(),
  expense_date: z.string().optional().nullable(),
  itinerary_item_id: z.string().uuid().optional().nullable(),
  receipt_url: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  /** equal split if undefined → splits across all members */
  split_user_ids: z.array(z.string().uuid()).min(1),
  /** optional custom-amount per user. Sum must equal amount. */
  custom_splits: z
    .array(z.object({ user_id: z.string().uuid(), split_amount: z.number().nonnegative() }))
    .optional(),
});
export type ExpenseInput = z.infer<typeof expenseSchema>;

// ─── settlement ───────────────────────────────────────────────────────
export const generateSettlementSchema = z.object({
  trip_id: z.string().uuid(),
});

// ─── payments ─────────────────────────────────────────────────────────
export const createOrderSchema = z.object({
  trip_id: z.string().uuid().optional(),
  purpose: z.enum(["trip_pro_unlock", "capsule_unlock", "organizer_subscription"]),
  amount_in_paise: z.number().int().positive(),
});

// ─── partner / waitlist ───────────────────────────────────────────────
export const partnerLeadSchema = z.object({
  business_name: z.string().trim().min(1).max(160),
  business_type: partnerBusinessTypeEnum.optional().nullable(),
  location: z.string().max(160).optional().nullable(),
  contact_name: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().nullable(),
  instagram_or_website: z.string().max(200).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
});
export type PartnerLeadInput = z.infer<typeof partnerLeadSchema>;

export const waitlistSchema = z.object({
  name: z.string().max(120).optional().nullable(),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  user_type: waitlistUserTypeEnum.optional().nullable(),
  source: z.string().max(120).optional().nullable(),
});
export type WaitlistInput = z.infer<typeof waitlistSchema>;

// ─── trip capsule ─────────────────────────────────────────────────────
export const updateCapsuleSchema = z.object({
  trip_id: z.string().uuid(),
  is_public: z.boolean().optional(),
  show_expenses_publicly: z.boolean().optional(),
  title: z.string().max(160).optional(),
  cover_image_url: z.string().optional().nullable(),
});
