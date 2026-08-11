-- AnyAi Store: production security migration
-- Run once in Supabase Dashboard -> SQL Editor AFTER the server-side admin API
-- has been deployed. This script does not delete existing data.
--
-- The original schema grants every anonymous visitor full access to orders,
-- Telegram user records, payment data, and admin credentials. This removes
-- those unsafe policies. The service-role key used only by Next.js server
-- routes continues to bypass RLS and can administer all tables.

begin;

-- Remove the original universal public-access policies.
drop policy if exists "Allow all public telegram_users" on public.telegram_users;
drop policy if exists "Allow all public categories" on public.categories;
drop policy if exists "Allow all public products" on public.products;
drop policy if exists "Allow all public payment_methods" on public.payment_methods;
drop policy if exists "Allow all public orders" on public.orders;
drop policy if exists "Allow all public order_items" on public.order_items;
drop policy if exists "Allow all public admin_settings" on public.admin_settings;

-- Remove any broad Data API privileges before granting the minimum needed.
revoke all on table public.telegram_users from anon, authenticated;
revoke all on table public.categories from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.payment_methods from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
revoke all on table public.admin_settings from anon, authenticated;

-- Only public catalogue data is readable by site visitors. No browser client
-- may insert, update, or delete any data.
grant select on table public.categories to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant select on table public.payment_methods to anon, authenticated;

create policy "public_can_read_categories"
  on public.categories for select to anon, authenticated using (true);

create policy "public_can_read_available_products"
  on public.products for select to anon, authenticated using (available = true);

create policy "public_can_read_active_payment_methods"
  on public.payment_methods for select to anon, authenticated using (is_active = true);

-- No policy is intentionally created for orders, order items, Telegram users,
-- or admin settings. They are accessible only through server-side code that
-- uses SUPABASE_SERVICE_ROLE_KEY; never expose that key with NEXT_PUBLIC_.

commit;
