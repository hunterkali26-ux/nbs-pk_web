-- ============================================================================
-- VEXIS pk — orders & order_items
-- Idempotent: safe to re-run (every statement uses IF NOT EXISTS / drop-if-exists).
-- Required by src/app/checkout/actions.ts (placeOrder) and the admin/customer
-- order views. Run in the Supabase SQL Editor (Dashboard → SQL Editor → Run).
--
-- Permanence (per business requirement):
--   * orders.user_id  -> auth.users(id)  ON DELETE RESTRICT  (removing a
--     customer never erases their orders, so admin records always remain).
--   * order_items.order_id -> orders(id) ON DELETE CASCADE   (deleting an order
--     removes its lines; order_items is NEVER deleted on its own).
--   * order_items.product_id -> products(id) ON DELETE SET NULL — a product can
--     be retired after it has been ordered, but the line + purchase price stay intact.
--   * No DELETE/TRUNCATE policy is granted to CUSTOMER roles; ADMINS may delete
--     an order (and its items) explicitly from the admin dashboard.
--     The customer order-history page is read-only — so records are permanent
--     against customer action by design.
-- ============================================================================

-- 1. Tables (only created when absent — existing columns are never altered) ----
create table if not exists public.orders (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null,
  customer_name    text        not null,
  customer_phone   text        not null,
  status           text        not null default 'Pending',
  total_amount     numeric     not null default 0 check (total_amount >= 0),
  -- Plain TEXT address summary (matches the live schema, not JSON).
  shipping_address text        not null,
  city             text        not null default 'Multan',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.order_items (
  id         uuid        primary key default gen_random_uuid(),
  order_id   uuid        not null,
  product_id uuid,
  quantity   integer     not null check (quantity > 0),
  price_at_purchase numeric not null default 0 check (price_at_purchase >= 0),
  created_at timestamptz not null default now()
);

-- 2. Foreign keys (added only if a same-named constraint is missing) -----------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_user_id_fkey' and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete restrict;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'order_items_order_id_fkey' and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_order_id_fkey
      foreign key (order_id) references public.orders (id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'order_items_product_id_fkey' and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_product_id_fkey
      foreign key (product_id) references public.products (id) on delete set null;
  end if;
end $$;

-- 3. Indexes -----------------------------------------------------------------
create index if not exists orders_user_id_idx          on public.orders       (user_id);
create index if not exists orders_created_at_idx        on public.orders       (created_at desc);
create index if not exists order_items_order_id_idx     on public.order_items  (order_id);
create index if not exists order_items_product_id_idx   on public.order_items  (product_id);

-- 4. updated_at auto-touch for orders ---------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- 5. Row Level Security ------------------------------------------------------
-- Admin = profile.role 'admin': can see & update every order + its items.
-- Customer (authenticated, non-admin): can see/insert only their own orders.
-- Re-runnable: each policy is dropped (if exists) before being (re)created.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders.select.own_or_admin" on public.orders;
create policy "orders.select.own_or_admin"
  on public.orders for select
  to authenticated
  using (
    orders.user_id = auth.uid()
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );
drop policy if exists "orders.insert.own" on public.orders;
create policy "orders.insert.own"
  on public.orders for insert
  to authenticated
  with check (orders.user_id = auth.uid());
drop policy if exists "orders.update.admin_only" on public.orders;
create policy "orders.update.admin_only"
  on public.orders for update
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
-- Admins may explicitly delete an order from the dashboard (customers cannot).
drop policy if exists "orders.delete.admin_only" on public.orders;
create policy "orders.delete.admin_only"
  on public.orders for delete
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

drop policy if exists "order_items.select" on public.order_items;
create policy "order_items.select"
  on public.order_items for select
  to authenticated
  using (
    auth.uid() = (select orders.user_id from public.orders where orders.id = order_items.order_id)
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );
drop policy if exists "order_items.insert.for_own_order" on public.order_items;
create policy "order_items.insert.for_own_order"
  on public.order_items for insert
  to authenticated
  with check (
    auth.uid() = (select orders.user_id from public.orders where orders.id = order_items.order_id)
  );
-- Admins may delete order lines (used when removing an entire order).
drop policy if exists "order_items.delete.admin_only" on public.order_items;
create policy "order_items.delete.admin_only"
  on public.order_items for delete
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');