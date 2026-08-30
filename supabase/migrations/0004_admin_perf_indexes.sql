-- ============================================================================
-- VEXIS pk — admin performance indexes
-- Idempotent — safe to re-run in the Supabase SQL Editor (Dashboard → SQL Editor).
--
-- Adds the indexes backing the admin dashboard's sorting, filtering and joins
-- (orders.created_at sorting, orders/customers joins, order line lookups).
-- Enabling these turns sequential scans into index scans on every admin page.
-- ============================================================================

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists orders_user_id_idx
  on public.orders (user_id);

create index if not exists orders_status_idx
  on public.orders (status);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

create index if not exists order_items_product_id_idx
  on public.order_items (product_id);

create index if not exists products_created_at_idx
  on public.products (created_at desc);

create index if not exists profiles_created_at_idx
  on public.profiles (created_at desc);