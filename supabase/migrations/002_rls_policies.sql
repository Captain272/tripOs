-- ────────────────────────────────────────────────────────────────────────
-- TripOS · 002 · Row Level Security
-- Membership-based access. Service role bypasses RLS (used by webhooks).
-- ────────────────────────────────────────────────────────────────────────

-- Enable RLS on every public table.
alter table public.profiles                enable row level security;
alter table public.trips                   enable row level security;
alter table public.trip_members            enable row level security;
alter table public.itinerary_items         enable row level security;
alter table public.polls                   enable row level security;
alter table public.poll_options            enable row level security;
alter table public.votes                   enable row level security;
alter table public.expenses                enable row level security;
alter table public.expense_splits          enable row level security;
alter table public.settlement_reports      enable row level security;
alter table public.settlement_transactions enable row level security;
alter table public.trip_media              enable row level security;
alter table public.trip_capsules           enable row level security;
alter table public.payments                enable row level security;
alter table public.waitlist_entries        enable row level security;
alter table public.partner_leads           enable row level security;

-- ─── profiles ─────────────────────────────────────────────────────────
drop policy if exists "profiles read self or co-member" on public.profiles;
create policy "profiles read self or co-member" on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1
        from public.trip_members me
        join public.trip_members co on co.trip_id = me.trip_id
       where me.user_id = auth.uid() and me.status = 'joined'
         and co.user_id = profiles.id and co.status = 'joined'
    )
  );

drop policy if exists "profiles upsert self" on public.profiles;
create policy "profiles upsert self" on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- ─── trips ────────────────────────────────────────────────────────────
drop policy if exists "trips read members or public" on public.trips;
create policy "trips read members or public" on public.trips for select
  using (
    visibility = 'public'
    or public.is_trip_member(id)
  );

drop policy if exists "trips insert by self" on public.trips;
create policy "trips insert by self" on public.trips for insert
  with check (created_by = auth.uid());

drop policy if exists "trips update by admins" on public.trips;
create policy "trips update by admins" on public.trips for update
  using (public.is_trip_admin(id)) with check (public.is_trip_admin(id));

drop policy if exists "trips delete by owner" on public.trips;
create policy "trips delete by owner" on public.trips for delete
  using (
    exists (
      select 1 from public.trip_members
       where trip_id = trips.id
         and user_id = auth.uid()
         and role = 'owner'
    )
  );

-- ─── trip_members ─────────────────────────────────────────────────────
drop policy if exists "members read by trip member" on public.trip_members;
create policy "members read by trip member" on public.trip_members for select
  using (
    user_id = auth.uid()
    or public.is_trip_member(trip_id)
  );

-- Allow self-insert (used to add the creator as owner) and admin-invite.
drop policy if exists "members insert self or admin" on public.trip_members;
create policy "members insert self or admin" on public.trip_members for insert
  with check (
    (user_id = auth.uid())  -- creating yourself as a member
    or public.is_trip_admin(trip_id)
  );

drop policy if exists "members update by admin or self" on public.trip_members;
create policy "members update by admin or self" on public.trip_members for update
  using (public.is_trip_admin(trip_id) or user_id = auth.uid())
  with check (public.is_trip_admin(trip_id) or user_id = auth.uid());

drop policy if exists "members delete by admin" on public.trip_members;
create policy "members delete by admin" on public.trip_members for delete
  using (public.is_trip_admin(trip_id));

-- ─── itinerary_items ──────────────────────────────────────────────────
drop policy if exists "itinerary read by member" on public.itinerary_items;
create policy "itinerary read by member" on public.itinerary_items for select
  using (public.is_trip_member(trip_id));
drop policy if exists "itinerary write by member" on public.itinerary_items;
create policy "itinerary write by member" on public.itinerary_items for insert
  with check (public.is_trip_member(trip_id));
drop policy if exists "itinerary update by member" on public.itinerary_items;
create policy "itinerary update by member" on public.itinerary_items for update
  using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
drop policy if exists "itinerary delete by member" on public.itinerary_items;
create policy "itinerary delete by member" on public.itinerary_items for delete
  using (public.is_trip_member(trip_id));

-- ─── polls / poll_options / votes ─────────────────────────────────────
drop policy if exists "polls read by member" on public.polls;
create policy "polls read by member" on public.polls for select
  using (public.is_trip_member(trip_id));
drop policy if exists "polls write by member" on public.polls;
create policy "polls write by member" on public.polls for insert
  with check (public.is_trip_member(trip_id));
drop policy if exists "polls update by creator or admin" on public.polls;
create policy "polls update by creator or admin" on public.polls for update
  using (created_by = auth.uid() or public.is_trip_admin(trip_id));
drop policy if exists "polls delete by creator or admin" on public.polls;
create policy "polls delete by creator or admin" on public.polls for delete
  using (created_by = auth.uid() or public.is_trip_admin(trip_id));

drop policy if exists "poll_options read by member" on public.poll_options;
create policy "poll_options read by member" on public.poll_options for select
  using (
    exists (
      select 1 from public.polls p
       where p.id = poll_options.poll_id
         and public.is_trip_member(p.trip_id)
    )
  );
drop policy if exists "poll_options write by member" on public.poll_options;
create policy "poll_options write by member" on public.poll_options for insert
  with check (
    exists (
      select 1 from public.polls p
       where p.id = poll_options.poll_id
         and public.is_trip_member(p.trip_id)
    )
  );

drop policy if exists "votes read by member" on public.votes;
create policy "votes read by member" on public.votes for select
  using (
    exists (
      select 1 from public.polls p
       where p.id = votes.poll_id
         and public.is_trip_member(p.trip_id)
    )
  );
drop policy if exists "votes insert self" on public.votes;
create policy "votes insert self" on public.votes for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.polls p
       where p.id = votes.poll_id
         and public.is_trip_member(p.trip_id)
    )
  );
drop policy if exists "votes delete self" on public.votes;
create policy "votes delete self" on public.votes for delete using (user_id = auth.uid());

-- ─── expenses + splits ────────────────────────────────────────────────
drop policy if exists "expenses read by member" on public.expenses;
create policy "expenses read by member" on public.expenses for select
  using (public.is_trip_member(trip_id));
drop policy if exists "expenses write by member" on public.expenses;
create policy "expenses write by member" on public.expenses for insert
  with check (public.is_trip_member(trip_id));
drop policy if exists "expenses update by member" on public.expenses;
create policy "expenses update by member" on public.expenses for update
  using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
drop policy if exists "expenses delete by member" on public.expenses;
create policy "expenses delete by member" on public.expenses for delete
  using (public.is_trip_member(trip_id));

drop policy if exists "splits read by member" on public.expense_splits;
create policy "splits read by member" on public.expense_splits for select
  using (
    exists (
      select 1 from public.expenses e
       where e.id = expense_splits.expense_id
         and public.is_trip_member(e.trip_id)
    )
  );
drop policy if exists "splits write by member" on public.expense_splits;
create policy "splits write by member" on public.expense_splits for insert
  with check (
    exists (
      select 1 from public.expenses e
       where e.id = expense_splits.expense_id
         and public.is_trip_member(e.trip_id)
    )
  );
drop policy if exists "splits update by member" on public.expense_splits;
create policy "splits update by member" on public.expense_splits for update
  using (
    exists (
      select 1 from public.expenses e
       where e.id = expense_splits.expense_id
         and public.is_trip_member(e.trip_id)
    )
  );

-- ─── settlements ──────────────────────────────────────────────────────
drop policy if exists "settlement reports read by member" on public.settlement_reports;
create policy "settlement reports read by member" on public.settlement_reports for select
  using (public.is_trip_member(trip_id));
drop policy if exists "settlement reports write by member" on public.settlement_reports;
create policy "settlement reports write by member" on public.settlement_reports for insert
  with check (public.is_trip_member(trip_id));

drop policy if exists "settlement tx read by member" on public.settlement_transactions;
create policy "settlement tx read by member" on public.settlement_transactions for select
  using (
    exists (
      select 1 from public.settlement_reports r
       where r.id = settlement_transactions.report_id
         and public.is_trip_member(r.trip_id)
    )
  );
drop policy if exists "settlement tx write by member" on public.settlement_transactions;
create policy "settlement tx write by member" on public.settlement_transactions for insert
  with check (
    exists (
      select 1 from public.settlement_reports r
       where r.id = settlement_transactions.report_id
         and public.is_trip_member(r.trip_id)
    )
  );
drop policy if exists "settlement tx update by member" on public.settlement_transactions;
create policy "settlement tx update by member" on public.settlement_transactions for update
  using (
    exists (
      select 1 from public.settlement_reports r
       where r.id = settlement_transactions.report_id
         and public.is_trip_member(r.trip_id)
    )
  );

-- ─── trip_media ───────────────────────────────────────────────────────
drop policy if exists "media read by member" on public.trip_media;
create policy "media read by member" on public.trip_media for select
  using (public.is_trip_member(trip_id));
drop policy if exists "media write by member" on public.trip_media;
create policy "media write by member" on public.trip_media for insert
  with check (public.is_trip_member(trip_id));
drop policy if exists "media delete by uploader or admin" on public.trip_media;
create policy "media delete by uploader or admin" on public.trip_media for delete
  using (uploaded_by = auth.uid() or public.is_trip_admin(trip_id));

-- ─── trip_capsules ────────────────────────────────────────────────────
drop policy if exists "capsules read by member or public" on public.trip_capsules;
create policy "capsules read by member or public" on public.trip_capsules for select
  using (is_public = true or public.is_trip_member(trip_id));
drop policy if exists "capsules write by member" on public.trip_capsules;
create policy "capsules write by member" on public.trip_capsules for insert
  with check (public.is_trip_member(trip_id));
drop policy if exists "capsules update by admin" on public.trip_capsules;
create policy "capsules update by admin" on public.trip_capsules for update
  using (public.is_trip_admin(trip_id)) with check (public.is_trip_admin(trip_id));

-- ─── payments ─────────────────────────────────────────────────────────
drop policy if exists "payments read self" on public.payments;
create policy "payments read self" on public.payments for select using (user_id = auth.uid());
drop policy if exists "payments insert self" on public.payments;
create policy "payments insert self" on public.payments for insert with check (user_id = auth.uid());
-- updates only via service role (webhook), so no update policy.

-- ─── waitlist + partner_leads ─────────────────────────────────────────
-- Public can submit; reads remain restricted (only service role).
drop policy if exists "waitlist insert anyone" on public.waitlist_entries;
create policy "waitlist insert anyone" on public.waitlist_entries for insert
  with check (true);

drop policy if exists "partner_leads insert anyone" on public.partner_leads;
create policy "partner_leads insert anyone" on public.partner_leads for insert
  with check (true);
