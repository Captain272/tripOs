# TripOS

Group travel operating system — plan, vote, split, settle, and relive every trip in one shared workspace.

Built with Next.js 16 (App Router), TypeScript, Tailwind v4, Supabase (Auth + Postgres + Storage + RLS), Razorpay, and Resend.

## What's in here

```
src/
  app/
    page.tsx                       — landing
    pricing/   partners/  waitlist/  creators/   — standalone marketing pages
    login/                         — Supabase auth (Google + magic link)
    auth/{callback,sign-out}/      — auth route handlers
    trip/[shareSlug]/              — public Trip Capsule
    app/                           — authenticated dashboard
      trips/{page,new}/
      trips/[tripId]/{page, layout, plan, vote, budget, ledger, settle, memories, capsule}/
      settings/
    api/                           — 17 route handlers
      trips/, itinerary/, polls/, votes/, expenses/
      settlement/generate/         — minimum-transaction algorithm
      payments/razorpay/create-order/
      webhooks/razorpay/           — signature-verified
      email/{send-trip-invite,send-settlement}/
      media/upload/, ai/{parse-trip-chat,generate-storybook}/
      partners/lead/, waitlist/
  components/
    landing/                       — premium marketing sections
    app/                           — TripCard, AppShell, TripTabs, InvitePanel
    ui/                            — Button, Card, Badge, Input, CountUp, Tilt, Marquee, …
  lib/
    supabase/{client,server,admin,middleware}.ts
    razorpay.ts  resend.ts  settlement.ts  validations.ts  analytics.ts
  types/                           — database / trip / payment types
supabase/migrations/
  001_initial_schema.sql           — 16 tables, triggers, helpers
  002_rls_policies.sql             — membership-based RLS
  003_storage_policies.sql         — bucket policies
middleware.ts                      — Supabase session refresh + /app gating
```

## Setup

### 1 · Install

```bash
yarn install
cp .env.example .env.local
```

### 2 · Supabase project

Create a project at [supabase.com](https://supabase.com) → grab the URL + anon key + service-role key. Paste into `.env.local`.

```
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…   # never exposed to the client
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3 · Run migrations

In the Supabase SQL editor, run in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_storage_policies.sql
```

This creates all tables, an updated_at trigger, the `is_trip_member`/`is_trip_admin` helpers used by RLS, all RLS policies, and the 5 storage buckets (`trip-receipts`, `trip-photos`, `trip-documents`, `trip-capsules`, `profile-avatars`) with their per-bucket policies.

### 4 · Auth

In Supabase → **Authentication → Providers**:

- **Email** (Magic Link) — already on by default. No further setup needed.
- **Google** — enable, paste your Google OAuth client ID + secret. Authorized redirect URI:
  `https://<your-project-ref>.supabase.co/auth/v1/callback`

In **URL Configuration**, set the **Site URL** to `http://localhost:3000` for dev and your production URL when shipping. Add `http://localhost:3000/auth/callback` to the redirect allow-list.

The magic-link / OAuth flow lands on `/auth/callback?code=…&next=…` which exchanges the code for a session and redirects.

### 5 · Razorpay (test mode is fine to start)

Create a Razorpay account → **Test mode** → Settings → API Keys → generate a test key.

```
RAZORPAY_KEY_ID=rzp_test_…
RAZORPAY_KEY_SECRET=…
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_…  # same as RAZORPAY_KEY_ID, but exposed
```

Webhook: Settings → Webhooks → Add → URL = `https://<your-domain>/api/webhooks/razorpay`. Subscribe to `payment.captured` and `order.paid`. Copy the **webhook secret** into:

```
RAZORPAY_WEBHOOK_SECRET=…
```

Local testing: use [ngrok](https://ngrok.com) (`ngrok http 3000`) to expose `localhost` and point the webhook URL at the ngrok forwarding URL. Razorpay's webhook ships the raw body + `X-Razorpay-Signature` header; we verify with HMAC-SHA256 timing-safe.

### 6 · Resend

Create a [Resend](https://resend.com) account → API Keys. Verify a sender domain (or use the `onboarding@resend.dev` test sender for now).

```
RESEND_API_KEY=re_…
FROM_EMAIL="TripOS <hello@your-domain.com>"
```

If `RESEND_API_KEY` is missing, all `send*` functions become no-ops in dev (logged to console) — so the app still works without Resend configured.

### 7 · Run

```bash
yarn dev   # http://localhost:3000
```

### 8 · Deploy to Vercel

```bash
vercel
```

Add the same env vars in **Project → Settings → Environment Variables**. Update `NEXT_PUBLIC_APP_URL` and the Supabase Site URL + redirect allow-list to match the production domain.

## Functional flows (what works end-to-end)

| Flow | Where | API touched |
|---|---|---|
| Sign in (Google + magic link) | `/login` → `/auth/callback` | Supabase Auth |
| Create trip | `/app/trips/new` | `POST /api/trips` (also adds owner row) |
| Invite member by email | trip dashboard right rail | `POST /api/trips/[id]/invite` (sends Resend email) |
| Add itinerary stop | `/app/trips/[id]/plan` | `POST /api/itinerary` |
| Create poll + vote | `/app/trips/[id]/vote` | `POST /api/polls` + `POST /api/votes` (one vote / user, replace on revote) |
| Add expense + receipt upload | `/app/trips/[id]/ledger` | `supabase.storage.from('trip-receipts').upload(...)` → `POST /api/expenses` (computes equal splits + rounding drift) |
| Generate settlement | `/app/trips/[id]/settle` | `POST /api/settlement/generate` (greedy minimum-transaction algorithm in `src/lib/settlement.ts`) |
| Send settlement email | settle page | `POST /api/email/send-settlement` |
| Copy WhatsApp summary | settle page | `navigator.clipboard.writeText` |
| Upload trip photos | `/app/trips/[id]/memories` | `supabase.storage.upload` → `POST /api/media/upload` |
| Generate Trip Capsule | `/app/trips/[id]/capsule` | `POST /api/ai/generate-storybook` |
| Toggle public share | capsule page | direct supabase update |
| Razorpay capsule unlock | capsule page | `POST /api/payments/razorpay/create-order` → Razorpay Standard Checkout → webhook flips `is_unlocked` + sends payment confirmation email |
| Public capsule view | `/trip/[shareSlug]` | RLS allows reads when `is_public = true`; expenses hidden unless `show_expenses_publicly = true` |
| Submit waitlist (3 surfaces) | hero inline + `/waitlist` + creators | `POST /api/waitlist` (sends Resend confirmation) |
| Submit partner lead | `/partners` | `POST /api/partners/lead` (sends Resend confirmation) |
| Sign out | sidebar | `POST /auth/sign-out` |

## Settlement algorithm

Implemented in [src/lib/settlement.ts](src/lib/settlement.ts).

1. `computeBalances(expenses, splits)` — for each user, `Σ(paid) − Σ(owed)`
2. `minimizeTransactions(balances)` — greedy: pair the largest creditor with the largest debtor each step, transfer the min, repeat until balances within 50-paise epsilon.
3. `summarize(...)` — total spend + per-person average

Greedy is not provably optimal in pathological cases but produces clean results for groups of 5–10. For pathological cases (rare in real trips) we can swap in an LP solver later.

## Security model

- **RLS** on every public table. Trip data gates by `public.is_trip_member(_trip_id)` security-definer function.
- **Service role** is used only in `webhook/razorpay`, `partners/lead`, `waitlist` (anonymous-allowed inserts), and `trips/invite` (where we may need to insert a member row before the invitee has signed up).
- **Razorpay webhook signature** verified via HMAC-SHA256 timing-safe (`src/lib/razorpay.ts`).
- **Razorpay key secret** never exposed to client. Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is sent to the browser, which is by design.
- **Storage buckets** are private by default; objects live under `<trip_id>/<filename>` paths and read/write policies check `is_trip_member` via the path's first segment.
- **Public Capsule view** uses the service-role client to read because the viewer may not be authed; we only return capsules where `is_public = true`. Expenses-related fields are stripped unless `show_expenses_publicly = true`.
- All API route bodies validated with `zod` schemas in [src/lib/validations.ts](src/lib/validations.ts).

## Analytics

`src/lib/analytics.ts` ships a `track()` function that fans out to GA4 (`window.gtag`), Meta Pixel (`window.fbq`), and an optional `POST /api/events` backend. Wire your providers via `<Script>` in `src/app/layout.tsx` — `track()` auto-detects them.

Events tracked:

| Event | Fired from |
|---|---|
| `hero_cta_click` | landing hero (primary + secondary) |
| `waitlist_submit` | hero inline + `/waitlist` + `/creators` |
| `partner_lead_submit` | `/partners` form |
| `creator_interest_submit` | `/creators` form |
| `pricing_cta_click` | every pricing card |
| `trip_parser_demo_click` | landing AI parser |
| `trip_created` | `/app/trips/new` |
| `expense_created` | ledger form |
| `settlement_generated` | settle page |
| `capsule_unlocked` | capsule unlock (optimistic, before webhook) |

## What's deliberately mock

- **AI trip-chat parser** (`/api/ai/parse-trip-chat`): regex heuristics for now. Plug `OPTIONAL_AI_API_KEY` into the commented-out section to call Anthropic / OpenAI. Output shape stays the same.
- **Storybook generator** (`/api/ai/generate-storybook`): builds structured `story_content` from real trip data; no LLM narrative yet.
- **PDF export** (capsule unlock perk): UI present, not implemented.
- **Maps integration** (lat/lng columns exist, no UI yet).
- **Hotel affiliate APIs**: lead-generation only at this stage. Partner submits → manual approval → manual deal handoff.

These are gated behind clean integration points so adding the real provider is a one-file change.

## Production launch checklist

- [ ] Replace `tripos.app` placeholders in `src/app/layout.tsx` and emails with the real domain
- [ ] Verify Resend domain (SPF + DKIM) — bypasses spam folders
- [ ] Switch Razorpay to live keys after KYC
- [ ] Set Supabase `Site URL` and `Redirect URLs` to production domain
- [ ] Add a `robots.txt` and update OG image
- [ ] Wire GA4 + Meta Pixel `<Script>` tags in `app/layout.tsx`
- [ ] Run `supabase gen types typescript` and replace `src/types/database.ts` for full type safety
- [ ] Add a `<Script>` snippet for [Vercel Analytics](https://vercel.com/docs/analytics) for first-day traffic insight

## License

Private. © TripOS.
