-- ============================================================================
-- VEXIS pk — product videos support
-- Idempotent — safe to re-run in the Supabase SQL Editor (Dashboard → SQL Editor).
-- Adds a `videos` jsonb column (array of public video URLs) so a product can
-- carry both pictures and videos. The gallery alternates them in sequence.
-- ============================================================================

alter table public.products
  add column if not exists videos jsonb not null default '[]'::jsonb;