-- ============================================================================
-- VEXIS pk — advanced product fields, category attributes & reviews
-- Idempotent: safe to re-run (IF NOT EXISTS / drop-if-exists everywhere).
--
-- 1) products   : adds brand, original_price, color_family, images, specs
-- 2) categories : adds `fields` (enabled custom-attribute keys per category)
-- 3) product_reviews : interactive star ratings & reviews (RLS-protected)
--
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → Run).
-- ============================================================================

-- 1. Advanced product columns -----------------------------------------------
alter table public.products add column if not exists brand        text;
alter table public.products add column if not exists original_price numeric;
alter table public.products add column if not exists color_family text;
alter table public.products add column if not exists images       jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists specs        jsonb not null default '[]'::jsonb;

-- 2. Per-category enabled custom fields (array of attribute keys) -----------
alter table public.categories add column if not exists fields jsonb not null default '[]'::jsonb;

-- 3. Product reviews --------------------------------------------------------
create table if not exists public.product_reviews (
  id          uuid        primary key default gen_random_uuid(),
  product_id  uuid        not null,
  user_id     uuid        not null,
  author_name text,
  rating      integer     not null check (rating between 1 and 5),
  title       text,
  comment     text,
  created_at  timestamptz not null default now()
);

-- Foreign keys (added only if a same-named constraint is missing)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_reviews_product_id_fkey' and conrelid = 'public.product_reviews'::regclass
  ) then
    alter table public.product_reviews
      add constraint product_reviews_product_id_fkey
      foreign key (product_id) references public.products (id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_reviews_user_id_fkey' and conrelid = 'public.product_reviews'::regclass
  ) then
    alter table public.product_reviews
      add constraint product_reviews_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
end $$;

create index if not exists product_reviews_product_id_idx on public.product_reviews (product_id);

-- Row Level Security — reviews are public to read; only the author (or an
-- admin) may insert/update/delete. Deleting a product cascades to its reviews.
alter table public.product_reviews enable row level security;

drop policy if exists "product_reviews.select.all" on public.product_reviews;
create policy "product_reviews.select.all"
  on public.product_reviews for select
  using (true);

drop policy if exists "product_reviews.insert.own" on public.product_reviews;
create policy "product_reviews.insert.own"
  on public.product_reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "product_reviews.update.own_or_admin" on public.product_reviews;
create policy "product_reviews.update.own_or_admin"
  on public.product_reviews for update
  to authenticated
  using (
    auth.uid() = user_id
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  )
  with check (
    auth.uid() = user_id
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

drop policy if exists "product_reviews.delete.own_or_admin" on public.product_reviews;
create policy "product_reviews.delete.own_or_admin"
  on public.product_reviews for delete
  to authenticated
  using (
    auth.uid() = user_id
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );