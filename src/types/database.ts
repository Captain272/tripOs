/**
 * Hand-rolled Database types (replace with `supabase gen types typescript` later).
 * Mirrors the SQL in supabase/migrations/001_initial_schema.sql.
 */

export type UUID = string;
export type ISODate = string;

// ─── enum-style string unions ─────────────────────────────────────────
export type TripVisibility = "private" | "group" | "public";
export type TripStatus = "planning" | "active" | "completed";
export type TripMemberRole = "owner" | "admin" | "member";
export type TripMemberStatus = "invited" | "joined" | "removed";
export type ItineraryCategory = "stay" | "food" | "activity" | "travel" | "note";
export type PollType = "hotel" | "activity" | "date" | "restaurant" | "custom";
export type ExpenseCategory =
  | "stay"
  | "food"
  | "fuel"
  | "activity"
  | "transfer"
  | "shopping"
  | "other";
export type SettlementTxStatus = "pending" | "paid" | "skipped";
export type MediaType = "image" | "video" | "receipt" | "ticket" | "document";
export type PaymentPurpose =
  | "trip_pro_unlock"
  | "capsule_unlock"
  | "organizer_subscription";
export type PaymentStatus = "created" | "paid" | "failed" | "refunded";
export type WaitlistUserType =
  | "friends_trip"
  | "college_trip"
  | "office_offsite"
  | "travel_organizer"
  | "hotel_partner"
  | "creator";
export type PartnerBusinessType =
  | "hotel"
  | "homestay"
  | "cafe"
  | "activity"
  | "travel_organizer"
  | "other";
export type PartnerLeadStatus = "new" | "contacted" | "approved" | "rejected";

// ─── Row interfaces ───────────────────────────────────────────────────

export interface ProfileRow {
  id: UUID;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface TripRow {
  id: UUID;
  title: string;
  destination: string | null;
  start_date: ISODate | null;
  end_date: ISODate | null;
  budget_per_person: number | null;
  currency: string;
  cover_image_url: string | null;
  created_by: UUID;
  visibility: TripVisibility;
  status: TripStatus;
  drive_folder_id: string | null;
  drive_folder_name: string | null;
  drive_last_synced_at: ISODate | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface TripMemberRow {
  id: UUID;
  trip_id: UUID;
  user_id: UUID | null;
  email: string | null;
  role: TripMemberRole;
  status: TripMemberStatus;
  joined_at: ISODate | null;
  created_at: ISODate;
}

export interface ItineraryItemRow {
  id: UUID;
  trip_id: UUID;
  day_number: number | null;
  title: string;
  description: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  start_time: string | null;
  end_time: string | null;
  category: ItineraryCategory | null;
  estimated_cost: number | null;
  image_url: string | null;
  image_query: string | null;
  sort_order: number | null;
  created_by: UUID | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export type ChatRole = "user" | "assistant" | "system";

export interface TripChatMessageRow {
  id: UUID;
  trip_id: UUID;
  user_id: UUID | null;
  role: ChatRole;
  content: string;
  quick_replies: string[] | null;
  tool_summary: { added?: number; updated?: number; deleted?: number } | null;
  created_at: ISODate;
}

export interface PollRow {
  id: UUID;
  trip_id: UUID;
  title: string;
  description: string | null;
  type: PollType | null;
  closes_at: ISODate | null;
  created_by: UUID | null;
  created_at: ISODate;
}

export interface PollOptionRow {
  id: UUID;
  poll_id: UUID;
  title: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  external_url: string | null;
  metadata: Record<string, unknown>;
  created_at: ISODate;
}

export interface VoteRow {
  id: UUID;
  poll_id: UUID;
  option_id: UUID;
  user_id: UUID;
  created_at: ISODate;
}

export interface ExpenseRow {
  id: UUID;
  trip_id: UUID;
  title: string;
  amount: number;
  currency: string;
  paid_by: UUID | null;
  category: ExpenseCategory | null;
  expense_date: ISODate | null;
  itinerary_item_id: UUID | null;
  receipt_url: string | null;
  notes: string | null;
  created_by: UUID | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface ExpenseSplitRow {
  id: UUID;
  expense_id: UUID;
  user_id: UUID;
  split_amount: number;
  is_settled: boolean;
  created_at: ISODate;
}

export interface SettlementReportRow {
  id: UUID;
  trip_id: UUID;
  total_spend: number | null;
  per_person_average: number | null;
  summary: Record<string, unknown>;
  generated_by: UUID | null;
  generated_at: ISODate;
}

export interface SettlementTransactionRow {
  id: UUID;
  report_id: UUID;
  from_user_id: UUID;
  to_user_id: UUID;
  amount: number;
  status: SettlementTxStatus;
  created_at: ISODate;
}

export interface TripMediaRow {
  id: UUID;
  trip_id: UUID;
  uploaded_by: UUID | null;
  file_url: string;
  thumbnail_url: string | null;
  file_type: MediaType | null;
  caption: string | null;
  taken_at: ISODate | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  day_number: number | null;
  itinerary_item_id: UUID | null;
  drive_file_id: string | null;
  created_at: ISODate;
}

export interface GoogleOauthTokenRow {
  user_id: UUID;
  access_token: string;
  refresh_token: string | null;
  expires_at: ISODate | null;
  scope: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface TripCapsuleRow {
  id: UUID;
  trip_id: UUID;
  title: string | null;
  cover_image_url: string | null;
  story_content: Record<string, unknown>;
  public_share_slug: string | null;
  is_public: boolean;
  show_expenses_publicly: boolean;
  is_unlocked: boolean;
  generated_at: ISODate;
}

export interface PaymentRow {
  id: UUID;
  user_id: UUID | null;
  trip_id: UUID | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  purpose: PaymentPurpose | null;
  status: PaymentStatus;
  metadata: Record<string, unknown>;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface WaitlistEntryRow {
  id: UUID;
  name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  user_type: WaitlistUserType | null;
  source: string | null;
  created_at: ISODate;
}

export interface PartnerLeadRow {
  id: UUID;
  business_name: string;
  business_type: PartnerBusinessType | null;
  location: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  instagram_or_website: string | null;
  message: string | null;
  status: PartnerLeadStatus;
  created_at: ISODate;
}
