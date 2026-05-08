// All copy + mock data for the TripOS landing page.
// Centralized here so sections stay in sync and copy edits don't require
// touching component code.

import type {
  ComparisonRow,
  Expense,
  LifecyclePhase,
  PricingTier,
  ProblemCard,
  ProductTab,
  SettlementTx,
  TripMember,
  UseCaseCard,
} from "@/types/landing";

export const BRAND = {
  name: "TripOS",
  tagline: "Plan, split, settle, and relive group trips — all in one shared AI workspace.",
  domain: "tripos.app",
};

export const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#lifecycle" },
  { label: "Partners", href: "#partners" },
  { label: "Pricing", href: "#pricing" },
  { label: "Vision", href: "#vision" },
];

export const HERO = {
  badge: "Now in private beta · India",
  headline: "Stop planning group trips on WhatsApp.",
  subheadline:
    "TripOS turns messy chats, travel ideas, receipts, expenses, and photos into one shared AI workspace — so your group can plan, vote, split, settle, and relive every trip.",
  primaryCta: { label: "Create your first trip", href: "#waitlist" },
  secondaryCta: { label: "Join the waitlist", href: "#waitlist" },
  microcopy:
    "Built for friends, college trips, road trips, offsites, creators, and travel organizers.",
};

export const PROBLEMS: ProblemCard[] = [
  {
    title: "Plans buried in WhatsApp",
    body: "500-message group chats. Important decisions lost between memes and forwards.",
    icon: "messages",
    accent: "rose",
  },
  {
    title: "Everyone suggests. Nobody decides.",
    body: "Five hotel links. Three Maps pins. Zero consensus. The trip stalls before it starts.",
    icon: "vote",
    accent: "violet",
  },
  {
    title: "Budget keeps changing",
    body: "Estimates live in someone’s head. By Day 1, no one remembers the cap.",
    icon: "gauge",
    accent: "gold",
  },
  {
    title: "Receipts disappear",
    body: "UPI screenshots in 4 phones. Paper bills in 3 wallets. Reimbursements? Unclear.",
    icon: "receipt",
    accent: "sunset",
  },
  {
    title: "Settlement becomes awkward",
    body: "Someone always pays more. Asking for money breaks the vibe of the whole trip.",
    icon: "handshake",
    accent: "cyan",
  },
];

export const LIFECYCLE: LifecyclePhase[] = [
  {
    phase: "Before",
    title: "Plan together, decide faster",
    items: [
      "AI itinerary builder",
      "Group voting on hotels & dates",
      "Hotel & activity shortlist",
      "Per-person budget estimate",
    ],
    accent: "cyan",
  },
  {
    phase: "During",
    title: "Live, on the road",
    items: [
      "Day-wise route stops",
      "Live expense ledger",
      "Receipt uploads with AI scan",
      "Shared photo drive",
    ],
    accent: "sunset",
  },
  {
    phase: "After",
    title: "Settle, remember, share",
    items: [
      "Final settlement report",
      "Trip wrapped stats",
      "AI-generated storybook",
      "Shareable Trip Capsule",
    ],
    accent: "emerald",
  },
];

export const PRODUCT_TABS: ProductTab[] = [
  {
    key: "plan",
    label: "Plan",
    headline: "A day-wise itinerary the whole group can edit.",
    description:
      "Build routes, places, timings, and notes — with AI suggestions for stops your group will actually like.",
    icon: "calendar",
  },
  {
    key: "vote",
    label: "Vote",
    headline: "Let the group decide — without 200 messages.",
    description:
      "Vote on hotels, dates, activities, restaurants and budget caps. Closing time built in.",
    icon: "vote",
  },
  {
    key: "budget",
    label: "Budget",
    headline: "Know the real per-person cost — before anyone books.",
    description:
      "Stay, food, transport, and activities — estimated and tracked. AI flags when you’re over the cap.",
    icon: "gauge",
  },
  {
    key: "ledger",
    label: "Ledger",
    headline: "Every payment, receipt, and split — in one place.",
    description:
      "No spreadsheets. AI parses receipts into expenses linked to a place, day, and person.",
    icon: "wallet",
  },
  {
    key: "settle",
    label: "Settle",
    headline: "End the trip with a clean who-owes-whom.",
    description:
      "Minimum-transaction settlement, exportable as PDF or pushed straight to WhatsApp.",
    icon: "handshake",
  },
  {
    key: "memories",
    label: "Memories",
    headline: "Turn the journey into a story you can share.",
    description:
      "Photos, route, day-wise highlights, and Trip Wrapped stats become a private storybook.",
    icon: "book",
  },
];

// ---- Mock trip: Goa Weekend 2026 ----------------------------------------

export const TRIP = {
  name: "Goa Weekend 2026",
  cover: "Goa · 3 days · 5 travelers",
  days: 3,
  travelers: 5,
  km: 642,
  places: 18,
  photos: 412,
  perHead: 7840,
};

export const TRIP_MEMBERS: TripMember[] = [
  { name: "Abhi", initials: "AB", color: "#38e1ff" },
  { name: "Sneha", initials: "SN", color: "#ff8c4a" },
  { name: "Rahul", initials: "RA", color: "#34d399" },
  { name: "Priya", initials: "PR", color: "#a78bfa" },
  { name: "Rohit", initials: "RO", color: "#ffd27a" },
];

export const ITINERARY = [
  {
    day: 1,
    date: "Fri · Mar 6",
    route: "Bangalore → Coorg",
    stops: [
      { time: "06:30", title: "Departure", note: "Pick up Sneha + Rahul on the way" },
      { time: "09:45", title: "Breakfast — A2B Hassan", note: "30 min stop" },
      { time: "12:30", title: "Raja’s Seat viewpoint", note: "Group photo" },
      { time: "15:00", title: "Homestay check-in", note: "Misty Falls Estate" },
      { time: "20:00", title: "Dinner at homestay", note: "Coorg pork curry" },
    ],
  },
  {
    day: 2,
    date: "Sat · Mar 7",
    route: "Coorg loop",
    stops: [
      { time: "08:00", title: "Coffee plantation walk", note: "Includes tasting" },
      { time: "11:30", title: "Jeep Safari (group voted)", note: "₹4,000 group" },
      { time: "14:00", title: "Local lunch — Coorgi Cuisine", note: "" },
      { time: "17:00", title: "Abbey Falls", note: "Carry rain jackets" },
      { time: "21:00", title: "Bonfire night", note: "" },
    ],
  },
  {
    day: 3,
    date: "Sun · Mar 8",
    route: "Coorg → Bangalore",
    stops: [
      { time: "08:30", title: "Madikeri Fort", note: "" },
      { time: "12:00", title: "Lunch on the way", note: "Hassan stop again" },
      { time: "18:30", title: "Reach Bangalore", note: "Settle ledger 🎉" },
    ],
  },
];

export const EXPENSES: Expense[] = [
  {
    id: "e1",
    date: "Mar 6",
    place: "Indian Oil, Hassan",
    paidBy: "Abhi",
    category: "Fuel",
    amount: 3200,
    splitBetween: ["Abhi", "Sneha", "Rahul", "Priya", "Rohit"],
    receipt: true,
    status: "settled",
  },
  {
    id: "e2",
    date: "Mar 6",
    place: "Misty Falls Estate",
    paidBy: "Sneha",
    category: "Stay",
    amount: 6000,
    splitBetween: ["Abhi", "Sneha", "Rahul", "Priya", "Rohit"],
    receipt: true,
    status: "pending",
  },
  {
    id: "e3",
    date: "Mar 7",
    place: "A2B Hassan",
    paidBy: "Rahul",
    category: "Food",
    amount: 1450,
    splitBetween: ["Abhi", "Sneha", "Rahul", "Priya", "Rohit"],
    receipt: true,
    status: "pending",
  },
  {
    id: "e4",
    date: "Mar 7",
    place: "Jeep Safari Coorg",
    paidBy: "Priya",
    category: "Activity",
    amount: 4000,
    splitBetween: ["Abhi", "Sneha", "Rahul", "Priya", "Rohit"],
    receipt: true,
    status: "pending",
  },
  {
    id: "e5",
    date: "Mar 7",
    place: "Coorgi Cuisine",
    paidBy: "Rohit",
    category: "Food",
    amount: 2800,
    splitBetween: ["Abhi", "Sneha", "Rahul", "Priya", "Rohit"],
    receipt: false,
    status: "pending",
  },
];

export const SETTLEMENT: SettlementTx[] = [
  { from: "Rahul", to: "Sneha", amount: 1240 },
  { from: "Priya", to: "Abhi", amount: 860 },
  { from: "Rohit", to: "Sneha", amount: 420 },
];

export const AI_PARSER_INPUT = [
  "Rahul paid petrol 3200",
  "Sneha booked stay 6000",
  "Remove Rohit from breakfast split",
  "Let’s do Jeep Safari on Day 2",
  "Hotel B looks better",
  "Budget max 8k each",
];

export const AI_PARSER_OUTPUT = [
  { kind: "expense", text: "Fuel · ₹3,200 · paid by Rahul · split 5 ways", icon: "wallet" },
  { kind: "expense", text: "Homestay · ₹6,000 · paid by Sneha · split 5 ways", icon: "wallet" },
  { kind: "split", text: "Breakfast split → exclude Rohit (4 people)", icon: "users" },
  { kind: "itinerary", text: "Day 2 · Activity → Jeep Safari added", icon: "route" },
  { kind: "vote", text: "Hotel B leading vote · 4 of 5", icon: "vote" },
  { kind: "budget", text: "Group cap set · ₹8,000 / person", icon: "gauge" },
] as const;

// ---- Use cases ----------------------------------------------------------

export const USE_CASES: UseCaseCard[] = [
  {
    title: "Friend groups",
    body: "Plan Goa, Coorg, Manali, Hampi, Pondicherry without group-chat chaos.",
    icon: "heart",
    accent: "sunset",
  },
  {
    title: "College trips",
    body: "Tight budgets, transparent splits, drama-free settlement.",
    icon: "school",
    accent: "violet",
  },
  {
    title: "Corporate offsites",
    body: "Schedules, receipts, and reimbursements — all in one workspace.",
    icon: "briefcase",
    accent: "cyan",
  },
  {
    title: "Travel creators",
    body: "Publish trip templates that followers can clone in one tap.",
    icon: "creator",
    accent: "gold",
  },
  {
    title: "Hotels & homestays",
    body: "Get group leads, itinerary-based discovery, and direct visibility.",
    icon: "hotel",
    accent: "emerald",
  },
  {
    title: "Local travel organizers",
    body: "Manage members, payments, vendors, and margins on one dashboard.",
    icon: "compass",
    accent: "rose",
  },
];

// ---- Comparison ---------------------------------------------------------

export const COMPARISON: ComparisonRow[] = [
  { feature: "AI itinerary",       competitors: { planner: true,  splitter: false, storage: false }, tripos: true },
  { feature: "Group voting",       competitors: { planner: false, splitter: false, storage: false }, tripos: true },
  { feature: "Budget estimate",    competitors: { planner: true,  splitter: false, storage: false }, tripos: true },
  { feature: "Expense ledger",     competitors: { planner: false, splitter: true,  storage: false }, tripos: true },
  { feature: "Receipt parsing",    competitors: { planner: false, splitter: false, storage: false }, tripos: true },
  { feature: "Final settlement",   competitors: { planner: false, splitter: true,  storage: false }, tripos: true },
  { feature: "Trip storybook",     competitors: { planner: false, splitter: false, storage: false }, tripos: true },
  { feature: "Partner marketplace",competitors: { planner: false, splitter: false, storage: false }, tripos: true },
  { feature: "Creator templates",  competitors: { planner: false, splitter: false, storage: false }, tripos: true },
  { feature: "Full trip lifecycle",competitors: { planner: false, splitter: false, storage: false }, tripos: true },
];

// ---- Pricing ------------------------------------------------------------

export const PRICING: PricingTier[] = [
  {
    name: "Free",
    price: "₹0",
    tagline: "Perfect for one-off weekend trips.",
    features: [
      "1 active trip",
      "Up to 5 members",
      "Basic itinerary",
      "Basic expenses",
      "Basic settlement",
    ],
    cta: "Start free",
    accent: "cyan",
  },
  {
    name: "Pro Trip",
    price: "₹99",
    period: "per trip",
    tagline: "Everything to make a trip unforgettable.",
    features: [
      "Unlimited members",
      "AI parser & receipt OCR",
      "Final settlement PDF",
      "Trip Capsule storybook",
      "WhatsApp summary",
      "Priority support",
    ],
    cta: "Try Pro Trip",
    highlighted: true,
    accent: "sunset",
  },
  {
    name: "Organizer",
    price: "₹999",
    period: "per month",
    tagline: "For local organizers running multiple trips.",
    features: [
      "Multiple concurrent trips",
      "Customer management",
      "Partner & vendor tracking",
      "Payment tracking",
      "Organizer dashboard",
    ],
    cta: "Talk to us",
    accent: "emerald",
  },
  {
    name: "Partner",
    price: "Early access",
    tagline: "For hotels, homestays, cafes, activity providers.",
    features: [
      "Group lead generation",
      "Featured listings",
      "Package promotion",
      "Itinerary placements",
    ],
    cta: "Become a partner",
    accent: "gold",
  },
];

// ---- Vision pyramid ----------------------------------------------------

export const VISION_LAYERS = [
  { label: "Group Travel Network",   note: "Network of trips, partners, creators" },
  { label: "Partner Marketplace",     note: "Hotels, activities, organizers" },
  { label: "Creator Templates",       note: "Cloneable trip blueprints" },
  { label: "Memories + Storybook",    note: "Capsules, drives, trip wrapped" },
  { label: "Ledger + Settlement",     note: "Receipts, OCR, payments" },
  { label: "Trip Workspace",          note: "Plan, vote, decide together" },
];

// ---- Viral loop --------------------------------------------------------

export const VIRAL_STEPS = [
  { label: "Create trip",      icon: "compass" },
  { label: "Invite group",     icon: "users" },
  { label: "Plan & vote",      icon: "vote" },
  { label: "Travel",           icon: "route" },
  { label: "Settle ledger",    icon: "handshake" },
  { label: "Share Capsule",    icon: "share" },
  { label: "Friends clone it", icon: "sparkles" },
];

// ---- Waitlist options --------------------------------------------------

export const WAITLIST_OPTIONS = [
  "Friends trip",
  "College trip",
  "Office offsite",
  "Travel organizer",
  "Hotel partner",
  "Creator",
] as const;

export const PARTNER_TYPES = [
  "Hotel",
  "Homestay",
  "Cafe",
  "Activity",
  "Travel organizer",
] as const;

export const SOCIAL_PROOF = [
  "Launching first for India weekend trips",
  "Built for Bangalore, Hyderabad, Mumbai, Pune, Delhi & Chennai travelers first",
  "Early users get free Pro Trip access",
];

// ---- Live activity ticker ---------------------------------------------
// Static, hand-curated. Looks like real-time activity but is deterministic
// so SSR + hydrate match. (Replace with live websocket data when available.)

export const LIVE_ACTIVITY = [
  { who: "Sneha", verb: "settled", obj: "₹4,820", where: "Coorg trip", icon: "handshake" },
  { who: "Rahul + 3", verb: "voted on", obj: "Hotel B", where: "Goa weekend", icon: "vote" },
  { who: "Priya", verb: "scanned", obj: "12 receipts", where: "Manali offsite", icon: "scan" },
  { who: "Office squad", verb: "wrapped", obj: "Bali trip", where: "5 days · ₹1.2L", icon: "book" },
  { who: "Abhi", verb: "invited", obj: "4 friends", where: "Hampi weekend", icon: "users" },
  { who: "College gang", verb: "shipped", obj: "Trip Capsule", where: "Pondy 2026", icon: "share" },
  { who: "Misty Falls", verb: "got", obj: "3 group leads", where: "this week", icon: "hotel" },
  { who: "TripOS AI", verb: "parsed", obj: "289 messages", where: "today", icon: "sparkles" },
] as const;

// ---- Trust / partner metrics -----------------------------------------

export const PARTNER_METRICS = [
  {
    value: 87,
    suffix: "%",
    label: "of Indian leisure travelers go in groups",
    accent: "cyan",
  },
  {
    value: 6,
    suffix: "×",
    label: "average ticket size for group bookings",
    accent: "sunset",
  },
  {
    value: 5,
    suffix: ".4",
    label: "people in an average TripOS trip",
    accent: "emerald",
  },
  {
    value: 14,
    suffix: " days",
    label: "median planning window — high-intent moment",
    accent: "gold",
  },
] as const;

export const PARTNER_ARCHETYPES = [
  {
    title: "Hotels & homestays",
    body: "Get listed inside route plans the moment a group narrows down dates and stay options.",
    icon: "hotel",
    accent: "emerald",
    bullets: ["Group leads (4–8 ppl)", "Itinerary placements", "Featured cards in vote"],
  },
  {
    title: "Activity providers",
    body: "Cafes, jeep safaris, plantation walks — appear when groups vote on Day plans.",
    icon: "compass",
    accent: "sunset",
    bullets: ["Day-2 activity slots", "Group-deal pricing", "Reviews + photos"],
  },
  {
    title: "Travel organizers",
    body: "One dashboard for trips, vendors, customers, payments, and final settlement reports.",
    icon: "briefcase",
    accent: "cyan",
    bullets: ["Multi-trip dashboard", "Vendor & margin tracking", "WhatsApp customer flow"],
  },
] as const;

export const PARTNER_HOW_IT_WORKS = [
  { step: "01", title: "List your business", body: "Tell us location, capacity, packages." },
  { step: "02", title: "Show up in plans", body: "Groups discover you while planning Day 1, 2, 3." },
  { step: "03", title: "Get group bookings", body: "Direct chat, group deals, settled via TripOS." },
] as const;

// ---- Waitlist conversion --------------------------------------------

export const WAITLIST_BENEFITS = [
  { title: "Free Pro Trip", body: "Founding members get one free Pro trip on us." },
  { title: "Skip the line", body: "Early access before public launch." },
  { title: "Help shape it", body: "Your group's feedback steers the next features." },
  { title: "Founders' Telegram", body: "Direct line to the team for ideas, bugs, requests." },
] as const;

// Static seed for the live waitlist counter. Real number can be loaded
// from API later — this is a believable starting point.
export const WAITLIST_COUNT_BASE = 1247;

// ---- Tiny "spotted in" rotating row near hero --------------------
export const PRESS_ROW = [
  "TechSparks",
  "YourStory",
  "Inc42",
  "Backed by angel travelers",
  "ProductHunt soon",
  "Built in Bengaluru",
] as const;
