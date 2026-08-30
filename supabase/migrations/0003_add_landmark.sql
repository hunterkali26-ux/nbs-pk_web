-- ============================================================================
-- VEXIS pk — orders: add "near_landmark" delivery reference column
-- Idempotent — safe to re-run in the Supabase SQL Editor (Dashboard → SQL Editor).
-- Adds an optional short text reference (landmark/area) captured at checkout so
-- delivery teams can find the parcel more easily. Surfaced in the customer order
-- detail view, the customer edit form, and the admin order detail + edit views.
-- ============================================================================

alter table public.orders
  add column if not exists near_landmark text;