-- ─── google_oauth_tokens ─────────────────────────────────────────────
-- Stores per-user OAuth tokens for accessing Google services (Drive, etc).
-- Service role only — never exposed to the client.
create table if not exists public.google_oauth_tokens (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.google_oauth_tokens enable row level security;
-- No policies — service role bypasses RLS; client never reads this directly.

drop trigger if exists google_tokens_set_updated_at on public.google_oauth_tokens;
create trigger google_tokens_set_updated_at before update on public.google_oauth_tokens
  for each row execute procedure tripos_set_updated_at();

-- ─── trips: per-trip Drive folder ────────────────────────────────────
alter table public.trips
  add column if not exists drive_folder_id text,
  add column if not exists drive_folder_name text,
  add column if not exists drive_last_synced_at timestamptz;

-- ─── trip_media: link to Drive + binding to itinerary stop ──────────
alter table public.trip_media
  add column if not exists drive_file_id text,
  add column if not exists itinerary_item_id uuid references public.itinerary_items(id) on delete set null,
  add column if not exists thumbnail_url text;

create unique index if not exists trip_media_drive_file_unique
  on public.trip_media(trip_id, drive_file_id)
  where drive_file_id is not null;

create index if not exists trip_media_item_idx
  on public.trip_media(itinerary_item_id)
  where itinerary_item_id is not null;
