-- ─── itinerary_items: image + display order ───────────────────────────
alter table public.itinerary_items
  add column if not exists image_url text,
  add column if not exists image_query text,
  add column if not exists sort_order int;

create index if not exists itinerary_trip_day_idx
  on public.itinerary_items(trip_id, day_number, sort_order, start_time);

-- ─── trip_chat_messages ───────────────────────────────────────────────
-- Conversational planning history. role='assistant' rows have user_id=null.
create table if not exists public.trip_chat_messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  role text not null check (role in ('user','assistant','system')),
  content text not null default '',
  quick_replies jsonb,
  tool_summary jsonb,
  created_at timestamptz default now() not null
);

create index if not exists trip_chat_trip_idx
  on public.trip_chat_messages(trip_id, created_at);

alter table public.trip_chat_messages enable row level security;

drop policy if exists "chat read by member" on public.trip_chat_messages;
create policy "chat read by member" on public.trip_chat_messages for select
  using (public.is_trip_member(trip_id));

drop policy if exists "chat insert by member" on public.trip_chat_messages;
create policy "chat insert by member" on public.trip_chat_messages for insert
  with check (public.is_trip_member(trip_id));

drop policy if exists "chat delete by member" on public.trip_chat_messages;
create policy "chat delete by member" on public.trip_chat_messages for delete
  using (public.is_trip_member(trip_id));
