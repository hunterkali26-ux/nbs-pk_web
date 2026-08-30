-- ============================================================================
-- VEXIS pk — orders: add "tracking_number" courier field
-- Idempotent — safe to re-run in the Supabase SQL Editor (Dashboard → SQL Editor).
-- Adds an optional text column where the admin records the courier tracking
-- number, surfaced to the customer once the order ships.
-- ============================================================================

alter table public.orders
  add column if not exists tracking_number text;