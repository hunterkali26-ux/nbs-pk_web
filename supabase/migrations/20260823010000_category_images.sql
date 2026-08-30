-- ============================================================================
-- VEXIS pk — category images & storage buckets
-- Idempotent: safe to re-run (IF NOT EXISTS / ON CONFLICT everywhere).
--
-- 1) categories : adds image_url (shown on storefront category cards)
-- 2) storage    : ensures public `products` + `categories` buckets exist and
--                 grants authenticated admins upload/update/delete rights.
--
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → Run).
-- ============================================================================

-- 1. Category cover image ----------------------------------------------------
alter table public.categories add column if not exists image_url text;

-- 2. Storage buckets ---------------------------------------------------------
-- Public-read buckets so storefront <img> tags can load the URLs directly.
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('categories', 'categories', true)
on conflict (id) do nothing;

-- Access policies (named uniquely so re-runs stay clean). Anyone can view the
-- media; signed-in users (the admin dashboard guards role checks server-side)
-- may upload, replace or remove objects in these two buckets.
drop policy if exists "vexis_public_read_media" on storage.objects;
create policy "vexis_public_read_media"
  on storage.objects for select
  using (bucket_id in ('products', 'categories'));

drop policy if exists "vexis_authenticated_upload_media" on storage.objects;
create policy "vexis_authenticated_upload_media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('products', 'categories'));

drop policy if exists "vexis_authenticated_update_media" on storage.objects;
create policy "vexis_authenticated_update_media"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('products', 'categories'))
  with check (bucket_id in ('products', 'categories'));

drop policy if exists "vexis_authenticated_delete_media" on storage.objects;
create policy "vexis_authenticated_delete_media"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('products', 'categories'));