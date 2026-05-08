// Shared types for TripOS landing page data

export type IconName =
  | "messages"
  | "vote"
  | "wallet"
  | "receipt"
  | "handshake"
  | "map"
  | "calendar"
  | "sparkles"
  | "users"
  | "camera"
  | "route"
  | "compass"
  | "gauge"
  | "scan"
  | "book"
  | "shield"
  | "share"
  | "trending"
  | "heart"
  | "briefcase"
  | "school"
  | "creator"
  | "hotel"
  | "globe";

export interface ProblemCard {
  title: string;
  body: string;
  icon: IconName;
  accent: "cyan" | "sunset" | "gold" | "emerald" | "violet" | "rose";
}

export interface LifecyclePhase {
  phase: "Before" | "During" | "After";
  title: string;
  items: string[];
  accent: "cyan" | "sunset" | "emerald";
}

export type ProductTabKey =
  | "plan"
  | "vote"
  | "budget"
  | "ledger"
  | "settle"
  | "memories";

export interface ProductTab {
  key: ProductTabKey;
  label: string;
  headline: string;
  description: string;
  icon: IconName;
}

export interface UseCaseCard {
  title: string;
  body: string;
  icon: IconName;
  accent: "cyan" | "sunset" | "gold" | "emerald" | "violet" | "rose";
}

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  tagline: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  accent?: "cyan" | "sunset" | "gold" | "emerald";
}

export interface ComparisonRow {
  feature: string;
  competitors: { planner: boolean; splitter: boolean; storage: boolean };
  tripos: boolean;
}

export interface TripMember {
  name: string;
  initials: string;
  color: string; // hex/rgb for avatar bg
}

export interface Expense {
  id: string;
  date: string;
  place: string;
  paidBy: string;
  category: "Fuel" | "Stay" | "Food" | "Activity" | "Transport" | "Misc";
  amount: number;
  splitBetween: string[];
  receipt?: boolean;
  status: "settled" | "pending";
}

export interface SettlementTx {
  from: string;
  to: string;
  amount: number;
}
