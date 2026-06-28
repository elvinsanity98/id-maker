-- ID Card Maker — students roster + attendance log
-- Run once in Supabase SQL Editor after the earlier migrations.

-- ─── students: roster, auto-upserted from saved drafts ─────────
-- Keyed by (owner_id, lrn) so each account has its own roster and
-- the same LRN can't duplicate within one account.
create table if not exists public.students (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  lrn         text not null,
  name        text,
  grade       text,
  school      text,
  photo       text,
  updated_at  timestamptz not null default now(),
  unique (owner_id, lrn)
);

create index if not exists students_owner_lrn_idx
  on public.students (owner_id, lrn);

alter table public.students enable row level security;

drop policy if exists "students_self_all" on public.students;
create policy "students_self_all" on public.students
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ─── attendance: one row per scan ──────────────────────────────
create table if not exists public.attendance (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  student_lrn text not null,
  student_name text,
  status      text not null default 'present' check (status in ('present', 'late', 'absent')),
  source      text,                        -- 'camera' | 'scanner'
  scanned_at  timestamptz not null default now()
);

create index if not exists attendance_owner_time_idx
  on public.attendance (owner_id, scanned_at desc);

alter table public.attendance enable row level security;

drop policy if exists "attendance_self_all" on public.attendance;
create policy "attendance_self_all" on public.attendance
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
