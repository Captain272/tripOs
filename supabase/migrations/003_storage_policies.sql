-- ────────────────────────────────────────────────────────────────────────
-- TripOS · 003 · storage buckets + policies
-- Run AFTER creating buckets in Supabase Studio (or via insert below).
-- File path convention: <bucket>/<trip_id>/<filename>
-- ────────────────────────────────────────────────────────────────────────

-- Create buckets if they don't exist. (Idempotent.)
insert into storage.buckets (id, name, public)
values
  ('trip-receipts',  'trip-receipts',  false),
  ('trip-photos',    'trip-photos',    false),
  ('trip-documents', 'trip-documents', false),
  ('trip-capsules',  'trip-capsules',  true),    -- public covers / shared assets
  ('profile-avatars','profile-avatars',true)
on conflict (id) do nothing;

-- Helper inline (storage.objects uses owner uuid + name).
-- Path layout: '<trip_id>/<rest>'.  We extract first path segment.

-- ─── trip-receipts (private) ──────────────────────────────────────────
drop policy if exists "trip-receipts read by member" on storage.objects;
create policy "trip-receipts read by member" on storage.objects for select
  using (
    bucket_id = 'trip-receipts'
    and public.is_trip_member((split_part(name, '/', 1))::uuid)
  );

drop policy if exists "trip-receipts write by member" on storage.objects;
create policy "trip-receipts write by member" on storage.objects for insert
  with check (
    bucket_id = 'trip-receipts'
    and public.is_trip_member((split_part(name, '/', 1))::uuid)
  );

-- ─── trip-photos (private) ────────────────────────────────────────────
drop policy if exists "trip-photos read by member" on storage.objects;
create policy "trip-photos read by member" on storage.objects for select
  using (
    bucket_id = 'trip-photos'
    and public.is_trip_member((split_part(name, '/', 1))::uuid)
  );

drop policy if exists "trip-photos write by member" on storage.objects;
create policy "trip-photos write by member" on storage.objects for insert
  with check (
    bucket_id = 'trip-photos'
    and public.is_trip_member((split_part(name, '/', 1))::uuid)
  );

drop policy if exists "trip-photos delete by uploader" on storage.objects;
create policy "trip-photos delete by uploader" on storage.objects for delete
  using (
    bucket_id = 'trip-photos'
    and owner = auth.uid()
  );

-- ─── trip-documents (private) ─────────────────────────────────────────
drop policy if exists "trip-documents read by member" on storage.objects;
create policy "trip-documents read by member" on storage.objects for select
  using (
    bucket_id = 'trip-documents'
    and public.is_trip_member((split_part(name, '/', 1))::uuid)
  );
drop policy if exists "trip-documents write by member" on storage.objects;
create policy "trip-documents write by member" on storage.objects for insert
  with check (
    bucket_id = 'trip-documents'
    and public.is_trip_member((split_part(name, '/', 1))::uuid)
  );

-- ─── trip-capsules (public assets like cover images for shared capsules) ─
-- Public read is granted because the bucket itself is public.
drop policy if exists "trip-capsules write by member" on storage.objects;
create policy "trip-capsules write by member" on storage.objects for insert
  with check (
    bucket_id = 'trip-capsules'
    and public.is_trip_member((split_part(name, '/', 1))::uuid)
  );

-- ─── profile-avatars (public bucket, owner-write) ─────────────────────
drop policy if exists "profile-avatars write self" on storage.objects;
create policy "profile-avatars write self" on storage.objects for insert
  with check (
    bucket_id = 'profile-avatars'
    and owner = auth.uid()
  );

drop policy if exists "profile-avatars update self" on storage.objects;
create policy "profile-avatars update self" on storage.objects for update
  using (bucket_id = 'profile-avatars' and owner = auth.uid())
  with check (bucket_id = 'profile-avatars' and owner = auth.uid());
