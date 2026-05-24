-- ID Card Maker — backfill missing profile rows + harden activation
-- Run this once in your Supabase SQL Editor AFTER init.sql + 0002_license_keys.sql.

-- ─── ensure_profile: heal users that pre-date the trigger ──────
-- If an auth.users row exists but no matching profile row does
-- (e.g. user signed up before init.sql installed the on-signup
-- trigger), the client app's fetchProfile path falls back here to
-- create it. Returns the existing or newly-created profile.
create or replace function public.ensure_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  profile_row public.profiles%rowtype;
begin
  if caller_id is null then
    raise exception 'Not signed in';
  end if;

  -- Already there? Just return it.
  select * into profile_row from public.profiles where id = caller_id;
  if found then
    return profile_row;
  end if;

  -- Backfill from auth.users (the security-definer context lets us read it).
  insert into public.profiles (id, email, full_name)
  select id, email, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
  from auth.users where id = caller_id
  returning * into profile_row;

  return profile_row;
end;
$$;

grant execute on function public.ensure_profile() to authenticated;

-- ─── activate_license_key (v2): now self-heals the profile too ──
-- Same semantics as 0002 (one-account-per-key, idempotent re-entry
-- by the original owner), with an added ensure_profile() call up
-- front so users without a profile row can still redeem.
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

  -- Make sure the caller has a profile row to update.
  perform public.ensure_profile();

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
