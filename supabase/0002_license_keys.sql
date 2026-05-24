-- ID Card Maker — license_keys table + atomic activation
-- Run this once in your Supabase SQL Editor AFTER init.sql.

-- ─── license_keys: source of truth for which keys are valid ─────
create table if not exists public.license_keys (
  key             text primary key,
  status          text not null default 'unused' check (status in ('unused', 'used', 'revoked')),
  used_by         uuid references auth.users(id) on delete set null,
  used_at         timestamptz,
  issued_to       text,                             -- buyer email or note
  notes           text,
  created_at      timestamptz not null default now()
);

alter table public.license_keys enable row level security;

-- No SELECT/INSERT/UPDATE policies for anon or authenticated. The table
-- is admin-only by default; the activation function below uses
-- SECURITY DEFINER to bypass RLS just for the one allowed code path.
-- You (the admin) read/write via service_role through the Supabase
-- dashboard, never from the client app.

-- ─── activate_license_key: atomic redeem ────────────────────────
-- Returns: { ok: boolean, message: text }
-- - Validates the caller is signed in.
-- - Looks up the normalized key.
-- - Refuses if revoked, missing, or already-used-by-someone-else.
-- - On success: flips status='used', stamps used_by + used_at, and
--   upgrades the caller's profile to 'premium' in the same txn.
-- - Re-entry by the original owner is idempotent ('already activated').
create or replace function public.activate_license_key(input_key text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  normalized text := upper(trim(input_key));
  key_row license_keys%rowtype;
begin
  if caller_id is null then
    return json_build_object('ok', false, 'message', 'Not signed in.');
  end if;

  select * into key_row from license_keys where key = normalized;

  if not found then
    return json_build_object('ok', false,
      'message', 'License key not recognized. Make sure you pasted it exactly as received.');
  end if;

  if key_row.status = 'revoked' then
    return json_build_object('ok', false, 'message', 'This license key has been revoked.');
  end if;

  if key_row.status = 'used' then
    if key_row.used_by = caller_id then
      -- Same owner re-entering their key: idempotent success.
      update profiles
      set tier = 'premium',
          license_key = normalized,
          activated_at = coalesce(activated_at, now())
      where id = caller_id;
      return json_build_object('ok', true,
        'message', 'Already activated on this account.');
    end if;
    return json_build_object('ok', false,
      'message', 'This license key has already been used by another account.');
  end if;

  -- Mark the key as used by this caller (atomic with the profile update).
  update license_keys
  set status = 'used',
      used_by = caller_id,
      used_at = now()
  where key = normalized;

  update profiles
  set tier = 'premium',
      license_key = normalized,
      activated_at = now()
  where id = caller_id;

  return json_build_object('ok', true, 'message', 'Premium activated!');
end;
$$;

grant execute on function public.activate_license_key(text) to authenticated;
