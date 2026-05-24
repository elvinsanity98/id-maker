-- ID Card Maker — drafts (named saved configurations)
-- Run this once in your Supabase SQL Editor after the earlier migrations.

create table if not exists public.drafts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  -- Snapshot of CardData, template id, palette id, size id, plus the
  -- photo / logo data URLs. Stored as a single JSONB blob so the
  -- shape can evolve without migrations.
  payload       jsonb not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists drafts_user_updated_idx
  on public.drafts (user_id, updated_at desc);

alter table public.drafts enable row level security;

-- Each user can only see / write their own drafts.
drop policy if exists "drafts_self_select" on public.drafts;
create policy "drafts_self_select" on public.drafts
  for select using (auth.uid() = user_id);

drop policy if exists "drafts_self_insert" on public.drafts;
create policy "drafts_self_insert" on public.drafts
  for insert with check (auth.uid() = user_id);

drop policy if exists "drafts_self_update" on public.drafts;
create policy "drafts_self_update" on public.drafts
  for update using (auth.uid() = user_id);

drop policy if exists "drafts_self_delete" on public.drafts;
create policy "drafts_self_delete" on public.drafts
  for delete using (auth.uid() = user_id);

-- Auto-bump updated_at on any UPDATE.
create or replace function public.touch_drafts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists drafts_updated_at on public.drafts;
create trigger drafts_updated_at
  before update on public.drafts
  for each row execute function public.touch_drafts_updated_at();
