import type {
  ExpenseRow,
  ExpenseSplitRow,
  ItineraryItemRow,
  PollOptionRow,
  PollRow,
  ProfileRow,
  SettlementTransactionRow,
  TripCapsuleRow,
  TripMediaRow,
  TripMemberRow,
  TripRow,
  VoteRow,
} from "./database";

/** Joined views the UI uses. Keep these in one place so server-side
 *  query shaping and client typing stay in sync. */

export interface TripMemberWithProfile extends TripMemberRow {
  profile: Pick<ProfileRow, "id" | "full_name" | "email" | "avatar_url"> | null;
}

export interface TripWithSummary extends TripRow {
  members_count: number;
  is_owner: boolean;
}

export interface PollWithOptions extends PollRow {
  options: (PollOptionRow & { vote_count: number; voted_by_me: boolean })[];
  total_votes: number;
}

export interface ExpenseWithSplits extends ExpenseRow {
  splits: ExpenseSplitRow[];
  payer: Pick<ProfileRow, "id" | "full_name" | "avatar_url"> | null;
}

export interface SettlementSummary {
  total_spend: number;
  per_person_average: number;
  member_balances: { user_id: string; name: string; balance: number }[];
  transactions: { from: string; to: string; amount: number }[];
}

export type {
  ExpenseRow,
  ExpenseSplitRow,
  ItineraryItemRow,
  PollOptionRow,
  PollRow,
  ProfileRow,
  SettlementTransactionRow,
  TripCapsuleRow,
  TripMediaRow,
  TripMemberRow,
  TripRow,
  VoteRow,
};
