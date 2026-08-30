-- Wishlist / Favorites feature =====================================================
-- Apply with:  supabase db execute --file supabase/migrations/0001_wishlist.sql
-- (or paste into the Supabase Dashboard → SQL Editor and run)

create extension if not exists "pgcrypto";

create table if not exists public.wishlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- A user can only save a given product once.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'wishlist_user_product_unique'
  ) then
    alter table public.wishlist
      add constraint wishlist_user_product_unique unique (user_id, product_id);
  end if;
end $$;

create index if not exists wishlist_user_id_idx on public.wishlist (user_id);
create index if not exists wishlist_product_id_idx on public.wishlist (product_id);

alter table public.wishlist enable row level security;

drop policy if exists "Users can view their own wishlist"     on public.wishlist;
drop policy if exists "Users can insert their own wishlist"   on public.wishlist;
drop policy if exists "Users can delete their own wishlist"   on public.wishlist;

create policy "Users can view their own wishlist"
  on public.wishlist for select
  using (auth.uid() = user_id);

create policy "Users can insert their own wishlist"
  on public.wishlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own wishlist"
  on public.wishlist for delete
  using (auth.uid() = user_id);
