-- ────────────────────────────────────────────────────────────────────────
-- TripOS · 001 · initial schema
-- ────────────────────────────────────────────────────────────────────────
-- Run with `supabase db push` or paste into the SQL editor.
-- Order: extensions → tables → indexes → triggers.

create extension if not exists "pgcrypto";

-- ─── helper: updated_at trigger ────────────────────────────────────────
create or replace function tripos_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── profiles ──────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  phone text,
  city text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index if not exists profiles_email_idx on public.profiles(email);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure tripos_set_updated_at();

-- Auto-create a profile when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── trips ─────────────────────────────────────────────────────────────
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  destination text,
  start_date date,
  end_date date,
  budget_per_person numeric,
  currency text default 'INR' not null,
  cover_image_url text,
  created_by uuid references public.profiles(id) on delete set null,
  visibility text default 'private' not null check (visibility in ('private','group','public')),
  status text default 'planning' not null check (status in ('planning','active','completed')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index if not exists trips_created_by_idx on public.trips(created_by);
create index if not exists trips_status_idx on public.trips(status);

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at before update on public.trips
  for each row execute procedure tripos_set_updated_at();

-- ─── trip_members ──────────────────────────────────────────────────────
create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  role text default 'member' not null check (role in ('owner','admin','member')),
  status text default 'joined' not null check (status in ('invited','joined','removed')),
  joined_at timestamptz,
  created_at timestamptz default now() not null,
  unique (trip_id, user_id)
);
create index if not exists trip_members_trip_idx on public.trip_members(trip_id);
create index if not exists trip_members_user_idx on public.trip_members(user_id);
create index if not exists trip_members_email_idx on public.trip_members(email);

-- ─── itinerary_items ───────────────────────────────────────────────────
create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_number int,
  title text not null,
  description text,
  location_name text,
  latitude numeric,
  longitude numeric,
  start_time time,
  end_time time,
  category text check (category in ('stay','food','activity','travel','note')),
  estimated_cost numeric,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index if not exists itinerary_trip_idx on public.itinerary_items(trip_id);

drop trigger if exists itinerary_set_updated_at on public.itinerary_items;
create trigger itinerary_set_updated_at before update on public.itinerary_items
  for each row execute procedure tripos_set_updated_at();

-- ─── polls + options + votes ───────────────────────────────────────────
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  description text,
  type text check (type in ('hotel','activity','date','restaurant','custom')),
  closes_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);
create index if not exists polls_trip_idx on public.polls(trip_id);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  title text not null,
  description text,
  price numeric,
  image_url text,
  external_url text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);
create index if not exists poll_options_poll_idx on public.poll_options(poll_id);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now() not null,
  unique (poll_id, user_id)
);
create index if not exists votes_poll_idx on public.votes(poll_id);

-- ─── expenses + splits ────────────────────────────────────────────────
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  amount numeric not null check (amount >= 0),
  currency text default 'INR' not null,
  paid_by uuid references public.profiles(id) on delete set null,
  category text check (category in ('stay','food','fuel','activity','transfer','shopping','other')),
  expense_date date,
  itinerary_item_id uuid references public.itinerary_items(id) on delete set null,
  receipt_url text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index if not exists expenses_trip_idx on public.expenses(trip_id);
create index if not exists expenses_paid_by_idx on public.expenses(paid_by);

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at before update on public.expenses
  for each row execute procedure tripos_set_updated_at();

create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  split_amount numeric not null check (split_amount >= 0),
  is_settled boolean default false not null,
  created_at timestamptz default now() not null,
  unique (expense_id, user_id)
);
create index if not exists expense_splits_expense_idx on public.expense_splits(expense_id);
create index if not exists expense_splits_user_idx on public.expense_splits(user_id);

-- ─── settlements ──────────────────────────────────────────────────────
create table if not exists public.settlement_reports (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  total_spend numeric,
  per_person_average numeric,
  summary jsonb default '{}'::jsonb not null,
  generated_by uuid references public.profiles(id) on delete set null,
  generated_at timestamptz default now() not null
);
create index if not exists settlement_reports_trip_idx on public.settlement_reports(trip_id);

create table if not exists public.settlement_transactions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.settlement_reports(id) on delete cascade,
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  status text default 'pending' not null check (status in ('pending','paid','skipped')),
  created_at timestamptz default now() not null
);
create index if not exists settlement_tx_report_idx on public.settlement_transactions(report_id);

-- ─── trip media ────────────────────────────────────────────────────────
create table if not exists public.trip_media (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  file_url text not null,
  file_type text check (file_type in ('image','video','receipt','ticket','document')),
  caption text,
  taken_at timestamptz,
  location_name text,
  latitude numeric,
  longitude numeric,
  day_number int,
  created_at timestamptz default now() not null
);
create index if not exists trip_media_trip_idx on public.trip_media(trip_id);

-- ─── trip capsules ─────────────────────────────────────────────────────
create table if not exists public.trip_capsules (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text,
  cover_image_url text,
  story_content jsonb default '{}'::jsonb not null,
  public_share_slug text unique,
  is_public boolean default false not null,
  show_expenses_publicly boolean default false not null,
  is_unlocked boolean default false not null,
  generated_at timestamptz default now() not null,
  unique (trip_id)
);
create index if not exists trip_capsules_slug_idx on public.trip_capsules(public_share_slug);

-- ─── payments ──────────────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  trip_id uuid references public.trips(id) on delete set null,
  razorpay_order_id text,
  razorpay_payment_id text,
  amount numeric not null check (amount >= 0),
  currency text default 'INR' not null,
  purpose text check (purpose in ('trip_pro_unlock','capsule_unlock','organizer_subscription')),
  status text default 'created' not null check (status in ('created','paid','failed','refunded')),
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index if not exists payments_user_idx on public.payments(user_id);
create index if not exists payments_trip_idx on public.payments(trip_id);
create index if not exists payments_order_idx on public.payments(razorpay_order_id);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at before update on public.payments
  for each row execute procedure tripos_set_updated_at();

-- ─── waitlist + partner leads ──────────────────────────────────────────
create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  phone text,
  city text,
  user_type text check (user_type in ('friends_trip','college_trip','office_offsite','travel_organizer','hotel_partner','creator')),
  source text,
  created_at timestamptz default now() not null
);
create index if not exists waitlist_email_idx on public.waitlist_entries(email);

create table if not exists public.partner_leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  business_type text check (business_type in ('hotel','homestay','cafe','activity','travel_organizer','other')),
  location text,
  contact_name text,
  phone text,
  email text,
  instagram_or_website text,
  message text,
  status text default 'new' not null check (status in ('new','contacted','approved','rejected')),
  created_at timestamptz default now() not null
);
create index if not exists partner_leads_status_idx on public.partner_leads(status);

-- ─── helpers used by RLS ──────────────────────────────────────────────
-- Returns true if the auth user is a member (joined) of the given trip.
create or replace function public.is_trip_member(_trip_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.trip_members
     where trip_id = _trip_id
       and user_id = auth.uid()
       and status = 'joined'
  );
$$;

-- Returns true if the auth user is owner/admin of the trip.
create or replace function public.is_trip_admin(_trip_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.trip_members
     where trip_id = _trip_id
       and user_id = auth.uid()
       and role in ('owner','admin')
       and status = 'joined'
  );
$$;
