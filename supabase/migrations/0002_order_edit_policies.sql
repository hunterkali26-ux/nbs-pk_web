-- Order Edit & Status-based Control — defense-in-depth for the new edit flows.
-- Apply AFTER 0001_wishlist.sql once you've reviewed it against your live DB.
--
-- ⚠️ This enables Row Level Security on `orders`. Owner INSERT/SELECT policies
-- are included below so checkout keeps working for signed-in customers, but
-- verify against any legacy integration that writes orders anonymously.
--
-- Policy summary:
--   • Customers: read their own rows; UPDATE own rows ONLY while status is
--     'pending' (server actions re-validate the same rule).
--   • Admins (profiles.role = 'admin'): full SELECT / INSERT / UPDATE / DELETE.

alter table public.orders enable row level security;

-- SELECT --------------------------------------------------------------------
drop policy if exists "Orders select owner or admin" on public.orders;
create policy "Orders select owner or admin"
  on public.orders for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- INSERT --------------------------------------------------------------------
drop policy if exists "Orders insert by customer" on public.orders;
create policy "Orders insert by customer"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- UPDATE --------------------------------------------------------------------
drop policy if exists "Owners can update pending orders" on public.orders;
create policy "Owners can update pending orders"
  on public.orders for update
  using (auth.uid() = user_id and lower(status) = 'pending')
  with check (auth.uid() = user_id);

drop policy if exists "Admins can update any order" on public.orders;
create policy "Admins can update any order"
  on public.orders for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (true);

-- DELETE --------------------------------------------------------------------
drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
  on public.orders for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
