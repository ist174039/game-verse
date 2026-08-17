-- Clã das Sombras — identity bootstrap for new Auth users
-- Creates the global manager identity and global currency accounts only.
-- Universe membership and club creation remain explicit onboarding actions.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := nullif(trim(coalesce(new.raw_user_meta_data->>'username', '')), '');
  if v_username is null then
    v_username := 'manager_' || left(replace(new.id::text, '-', ''), 10);
  end if;

  insert into public.user_profile(id, username, avatar_url, locale)
  values(
    new.id,
    v_username,
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    coalesce(nullif(new.raw_user_meta_data->>'locale', ''), 'pt')
  )
  on conflict (id) do nothing;

  insert into public.user_currency_account(user_id, currency, balance)
  values
    (new.id, 'GOLD', 0),
    (new.id, 'BRONZE', 0)
  on conflict (user_id, currency) do nothing;

  return new;
exception
  when unique_violation then
    -- A duplicate display username must never block account creation. Generate
    -- a deterministic fallback while preserving the global one-user identity.
    insert into public.user_profile(id, username, avatar_url, locale)
    values(
      new.id,
      'manager_' || left(replace(new.id::text, '-', ''), 12),
      nullif(new.raw_user_meta_data->>'avatar_url', ''),
      coalesce(nullif(new.raw_user_meta_data->>'locale', ''), 'pt')
    )
    on conflict (id) do nothing;

    insert into public.user_currency_account(user_id, currency, balance)
    values (new.id, 'GOLD', 0), (new.id, 'BRONZE', 0)
    on conflict (user_id, currency) do nothing;
    return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists on_auth_user_created_clan_identity on auth.users;
create trigger on_auth_user_created_clan_identity
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Backfill safety for users created before this migration.
insert into public.user_profile(id, username, avatar_url, locale)
select
  u.id,
  'manager_' || left(replace(u.id::text, '-', ''), 12),
  nullif(u.raw_user_meta_data->>'avatar_url', ''),
  coalesce(nullif(u.raw_user_meta_data->>'locale', ''), 'pt')
from auth.users u
where not exists(select 1 from public.user_profile p where p.id = u.id)
on conflict do nothing;

insert into public.user_currency_account(user_id, currency, balance)
select u.id, c.currency::public.currency_code, 0
from auth.users u
cross join (values ('GOLD'), ('BRONZE')) as c(currency)
on conflict (user_id, currency) do nothing;
