-- ============================================================================
-- VEXIS pk — cart_items table (guest + signed-in cart persistence)
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: every statement is guarded by IF NOT EXISTS / DROP IF EXISTS.
--
-- Required by src/lib/cart-actions.ts (getUserCart / syncCart / clearUserCart):
--   * rows are keyed by the composite primary key (user_id, product_id)
--   * syncCart() uses `upsert ... on conflict (user_id, product_id)`
--   * RLS lets each authenticated user touch only their own rows
-- ============================================================================

-- 1. Table -------------------------------------------------------------------
create table if not exists public.cart_items (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  product_id uuid        not null references public.products (id) on delete cascade,
  quantity   integer     not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  -- One row per (user, product): enables clean upserts and prevents dupes.
  primary key (user_id, product_id)
);

-- If an older revision of this table exists without the composite PK, ensure a
-- matching unique constraint is present so `on conflict (user_id, product_id)`
-- succeeds (uniqueness also prevents duplicate rows regardless).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cart_items_user_id_product_id_key'
      and conrelid = 'public.cart_items'::regclass
  ) then
    alter table public.cart_items
      add constraint cart_items_user_id_product_id_key unique (user_id, product_id);
  end if;
end $$;

-- Fast lookups: all rows for a user, and rows for a given product.
create index if not exists cart_items_user_id_idx
  on public.cart_items (user_id);
create index if not exists cart_items_product_id_idx
  on public.cart_items (product_id);

-- ----------------------------------------------------------------------------
-- Row Level Security: each user may only read/write their own cart rows.
-- ----------------------------------------------------------------------------

alter table public.cart_items enable row level security;

drop policy if exists "Users can view their own cart items" on public.cart_items;
create policy "Users can view their own cart items"
  on public.cart_items for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own cart items" on public.cart_items;
create policy "Users can insert their own cart items"
  on public.cart_items for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own cart items" on public.cart_items;
create policy "Users can update their own cart items"
  on public.cart_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own cart items" on public.cart_items;
create policy "Users can delete their own cart items"
  on public.cart_items for delete
  to authenticated
  using (auth.uid() = user_id);

-- Optional helper: merge a guest/local list into the persisted cart.
--   select public.upsert_cart_items(
--     '<user-uuid>',
--     array['<product-1>', '<product-2>'],
--     array[2, 1]
--   );
create or replace function public.upsert_cart_items(
  p_user_id uuid,
  p_product_ids uuid[],
  p_quantities integer[]
) returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.cart_items (user_id, product_id, quantity)
  select p_user_id, product_ids.product_id, quantities.quantity
  from unnest(p_product_ids) with ordinality as product_ids(product_id, ord)
  join unnest(p_quantities) with ordinality as quantities(quantity, ord)
    on product_ids.ord = quantities.ord
  on conflict (user_id, product_id)
  do update set quantity = excluded.quantity;
$$;
