-- =====================================================
-- BASANTA DRY CLEANLINESS - COMPLETE DATABASE FIX
-- Run in Supabase SQL Editor
-- =====================================================

-- -----------------------------------------------------
-- 1. HOMEPAGE CONTENT
-- -----------------------------------------------------
create table if not exists public.homepage_content (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  description text,
  button_text text,
  button_link text,
  image_url text,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------
-- 2. CONTACT INFORMATION
-- -----------------------------------------------------
create table if not exists public.contact_information (
  id uuid primary key default gen_random_uuid(),
  phone text default '',
  whatsapp text default '',
  email text default '',
  address text default '',
  instagram text default '',
  facebook text default '',
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------
-- 3. SERVICES
-- Existing services table may be missing sort_order.
-- This safely adds the missing columns.
-- -----------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) default 0,
  icon text default '🧺',
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.services
  add column if not exists sort_order integer not null default 0;

alter table public.services
  add column if not exists updated_at timestamptz not null default now();

-- -----------------------------------------------------
-- 4. FOOTER LINKS
-- -----------------------------------------------------
create table if not exists public.footer_links (
  id uuid primary key default gen_random_uuid(),
  section text not null default 'Company',
  title text not null,
  url text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------
-- 5. RLS
-- -----------------------------------------------------
alter table public.homepage_content enable row level security;
alter table public.contact_information enable row level security;
alter table public.services enable row level security;
alter table public.footer_links enable row level security;

-- -----------------------------------------------------
-- 6. HOMEPAGE POLICIES
-- -----------------------------------------------------
drop policy if exists "homepage_public_select" on public.homepage_content;
drop policy if exists "homepage_public_insert" on public.homepage_content;
drop policy if exists "homepage_public_update" on public.homepage_content;

drop policy if exists "homepage_select" on public.homepage_content;
drop policy if exists "homepage_insert" on public.homepage_content;
drop policy if exists "homepage_update" on public.homepage_content;

create policy "homepage_public_select"
on public.homepage_content
for select to anon, authenticated
using (true);

create policy "homepage_public_insert"
on public.homepage_content
for insert to anon, authenticated
with check (true);

create policy "homepage_public_update"
on public.homepage_content
for update to anon, authenticated
using (true)
with check (true);

-- -----------------------------------------------------
-- 7. CONTACT POLICIES
-- -----------------------------------------------------
drop policy if exists "contact_public_select" on public.contact_information;
drop policy if exists "contact_public_insert" on public.contact_information;
drop policy if exists "contact_public_update" on public.contact_information;

drop policy if exists "contact_select" on public.contact_information;
drop policy if exists "contact_insert" on public.contact_information;
drop policy if exists "contact_update" on public.contact_information;

create policy "contact_public_select"
on public.contact_information
for select to anon, authenticated
using (true);

create policy "contact_public_insert"
on public.contact_information
for insert to anon, authenticated
with check (true);

create policy "contact_public_update"
on public.contact_information
for update to anon, authenticated
using (true)
with check (true);

-- -----------------------------------------------------
-- 8. SERVICES POLICIES
-- -----------------------------------------------------
drop policy if exists "services_public_read" on public.services;
drop policy if exists "services_public_insert" on public.services;
drop policy if exists "services_public_update" on public.services;
drop policy if exists "services_public_delete" on public.services;

create policy "services_public_read"
on public.services
for select to anon, authenticated
using (true);

create policy "services_public_insert"
on public.services
for insert to anon, authenticated
with check (true);

create policy "services_public_update"
on public.services
for update to anon, authenticated
using (true)
with check (true);

create policy "services_public_delete"
on public.services
for delete to anon, authenticated
using (true);

-- -----------------------------------------------------
-- 9. FOOTER POLICIES
-- -----------------------------------------------------
drop policy if exists "footer_select" on public.footer_links;
drop policy if exists "footer_insert" on public.footer_links;
drop policy if exists "footer_update" on public.footer_links;
drop policy if exists "footer_delete" on public.footer_links;

create policy "footer_select"
on public.footer_links
for select to anon, authenticated
using (true);

create policy "footer_insert"
on public.footer_links
for insert to anon, authenticated
with check (true);

create policy "footer_update"
on public.footer_links
for update to anon, authenticated
using (true)
with check (true);

create policy "footer_delete"
on public.footer_links
for delete to anon, authenticated
using (true);

-- -----------------------------------------------------
-- 10. DEFAULT HOMEPAGE
-- -----------------------------------------------------
insert into public.homepage_content
(title, subtitle, description, button_text, button_link)
select
  'Fresh Clothes.',
  'Fresh Confidence.',
  'Professional Dry Cleaning, Laundry और Premium Pressing Service — घर से Pickup और Doorstep Delivery के साथ।',
  'Book Pickup',
  '#booking'
where not exists (
  select 1 from public.homepage_content
);

-- -----------------------------------------------------
-- 11. DEFAULT CONTACT ROW
-- -----------------------------------------------------
insert into public.contact_information
(phone, whatsapp, email, address, instagram, facebook)
select '', '', '', '', '', ''
where not exists (
  select 1 from public.contact_information
);

-- -----------------------------------------------------
-- 12. STORAGE BUCKET FOR WEBSITE IMAGES
-- -----------------------------------------------------
insert into storage.buckets (id, name, public)
values ('website-image', 'website-image', true)
on conflict (id) do update set public = true;

-- -----------------------------------------------------
-- 13. STORAGE POLICIES
-- -----------------------------------------------------
drop policy if exists "website_image_public_read" on storage.objects;
drop policy if exists "website_image_public_insert" on storage.objects;
drop policy if exists "website_image_public_update" on storage.objects;
drop policy if exists "website_image_public_delete" on storage.objects;

create policy "website_image_public_read"
on storage.objects
for select to anon, authenticated
using (bucket_id = 'website-image');

create policy "website_image_public_insert"
on storage.objects
for insert to anon, authenticated
with check (bucket_id = 'website-image');

create policy "website_image_public_update"
on storage.objects
for update to anon, authenticated
using (bucket_id = 'website-image')
with check (bucket_id = 'website-image');

create policy "website_image_public_delete"
on storage.objects
for delete to anon, authenticated
using (bucket_id = 'website-image');

-- -----------------------------------------------------
-- 14. CHECK
-- -----------------------------------------------------
select 'homepage_content' as table_name, count(*) as rows
from public.homepage_content
union all
select 'contact_information', count(*)
from public.contact_information
union all
select 'services', count(*)
from public.services
union all
select 'footer_links', count(*)
from public.footer_links;
