-- ID Card Maker — Supabase schema
-- Run this once in your Supabase SQL Editor.

-- ─── Profiles ────────────────────────────────────────────────
-- A profile row mirrors each auth.users entry and stores tier + license.
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  tier            text not null default 'free' check (tier in ('free', 'premium')),
  license_key     text,
  activated_at    timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Each user can read & update only their own profile.
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- ─── Trigger: auto-create profile on new auth.users insert ─────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Payment requests (for manual GCash reconciliation) ────────
-- When a free user submits proof of GCash payment we insert a row here.
-- You (the admin) review these in the Supabase Table Editor, mark them paid,
-- and email the buyer a license key. They paste it in the app to activate.
create table if not exists public.payment_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  email           text not null,
  reference       text,
  notes           text,
  status          text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  created_at      timestamptz not null default now()
);

alter table public.payment_requests enable row level security;

-- Authenticated users can create payment requests for themselves.
drop policy if exists "payment_requests_insert_own" on public.payment_requests;
create policy "payment_requests_insert_own" on public.payment_requests
  for insert with check (auth.uid() = user_id);

-- And read back their own requests (so the app can show status).
drop policy if exists "payment_requests_select_own" on public.payment_requests;
create policy "payment_requests_select_own" on public.payment_requests
  for select using (auth.uid() = user_id);
