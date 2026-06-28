-- ID Card Maker — per-org attendance: time-in/out, auto late, settings
-- Run once in Supabase SQL Editor after 0005_attendance.sql.

-- ─── attendance: add org, event (in/out); relax status ─────────
alter table public.attendance add column if not exists org text;
alter table public.attendance add column if not exists event text not null default 'in';

-- status now carries on-time / late (auto-computed). Keep legacy values valid.
alter table public.attendance drop constraint if exists attendance_status_check;
alter table public.attendance
  add constraint attendance_status_check
  check (status in ('on-time', 'late', 'present', 'late-legacy', 'absent'));

alter table public.attendance drop constraint if exists attendance_event_check;
alter table public.attendance
  add constraint attendance_event_check check (event in ('in', 'out'));

create index if not exists attendance_owner_org_idx
  on public.attendance (owner_id, org, scanned_at desc);

-- ─── org_settings: per-org cutoff times ────────────────────────
-- One row per (owner, org). Scans compare the clock against these to
-- decide on-time vs late for Time-In and Time-Out independently.
create table if not exists public.org_settings (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  org           text not null,
  late_after_in text not null default '08:00',  -- HH:MM, on-time if scan <= this
  late_after_out text not null default '17:00', -- HH:MM, on-time if scan <= this
  updated_at    timestamptz not null default now(),
  unique (owner_id, org)
);

alter table public.org_settings enable row level security;

drop policy if exists "org_settings_self_all" on public.org_settings;
create policy "org_settings_self_all" on public.org_settings
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
