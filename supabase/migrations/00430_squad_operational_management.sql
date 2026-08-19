-- Clã das Sombras — operational squad status management
-- Apply after 00421_market_guard_runtime_safety.sql.
--
-- ACTIVE and RESERVE are manager-controlled operational states. Both remain
-- competitively eligible when the player has an ACTIVE contract. OWNED may be
-- promoted into an operational state. Market/unavailable/system states cannot be
-- changed through this manager command. Every real transition is audit-trailed.

create table if not exists public.universe_player_status_history (
  id uuid primary key default gen_random_uuid(),
  universe_player_id uuid not null references public.universe_player(id) on delete cascade,
  club_id uuid not null references public.club(id) on delete cascade,
  from_status public.player_asset_status not null,
  to_status public.player_asset_status not null,
  changed_by uuid not null references auth.users(id) on delete restrict,
  idempotency_key text,
  reason text not null default 'MANAGER_OPERATIONAL_SELECTION',
  created_at timestamptz not null default now(),
  check (to_status in ('ACTIVE','RESERVE'))
);

create index if not exists universe_player_status_history_asset_idx
  on public.universe_player_status_history(universe_player_id,created_at desc);
create index if not exists universe_player_status_history_club_idx
  on public.universe_player_status_history(club_id,created_at desc);
create unique index if not exists universe_player_status_history_idempotency_uidx
  on public.universe_player_status_history(idempotency_key)
  where idempotency_key is not null;

alter table public.universe_player_status_history enable row level security;
revoke all on public.universe_player_status_history from public,anon,authenticated;
grant select on public.universe_player_status_history to authenticated;

drop policy if exists universe_player_status_history_own_read on public.universe_player_status_history;
create policy universe_player_status_history_own_read
on public.universe_player_status_history
for select to authenticated
using (
  exists(
    select 1 from public.club c
    where c.id=universe_player_status_history.club_id
      and c.user_id=auth.uid()
  )
);

create or replace function public.set_player_operational_status(
  p_universe_player_id uuid,
  p_target_status text,
  p_idempotency_key text
)
returns public.universe_player
language plpgsql
security definer
set search_path=public
as $$
declare
  v_asset public.universe_player;
  v_club public.club;
  v_target public.player_asset_status;
  v_existing public.universe_player_status_history;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key))<8 then
    raise exception 'idempotency_key_required';
  end if;
  if upper(trim(coalesce(p_target_status,''))) not in ('ACTIVE','RESERVE') then
    raise exception 'invalid_operational_status';
  end if;
  v_target:=upper(trim(p_target_status))::public.player_asset_status;

  select * into v_asset
  from public.universe_player
  where id=p_universe_player_id
  for update;
  if not found or v_asset.owner_club_id is null then raise exception 'player_not_owned'; end if;

  select * into v_club from public.club where id=v_asset.owner_club_id;
  if not found or v_club.user_id<>auth.uid() then raise exception 'not_player_owner'; end if;

  select * into v_existing
  from public.universe_player_status_history
  where idempotency_key=trim(p_idempotency_key);
  if found then
    if v_existing.universe_player_id<>v_asset.id or v_existing.changed_by<>auth.uid() then
      raise exception 'idempotency_key_conflict';
    end if;
    return v_asset;
  end if;

  if v_asset.status not in ('OWNED','ACTIVE','RESERVE') then
    raise exception 'player_status_not_manager_operational: %',v_asset.status;
  end if;

  if not exists(
    select 1 from public.player_contract pc
    where pc.universe_player_id=v_asset.id
      and pc.club_id=v_club.id
      and pc.status='ACTIVE'
  ) then
    raise exception 'active_player_contract_required';
  end if;

  if v_asset.status=v_target then return v_asset; end if;

  insert into public.universe_player_status_history(
    universe_player_id,club_id,from_status,to_status,changed_by,idempotency_key
  ) values(
    v_asset.id,v_club.id,v_asset.status,v_target,auth.uid(),trim(p_idempotency_key)
  );

  update public.universe_player
  set status=v_target,updated_at=now()
  where id=v_asset.id
  returning * into v_asset;

  return v_asset;
end;
$$;
revoke all on function public.set_player_operational_status(uuid,text,text) from public,anon;
grant execute on function public.set_player_operational_status(uuid,text,text) to authenticated;

-- Keep the manager command surface deliberately narrow. System-level state changes
-- (UNAVAILABLE, LISTED, AUCTION, transfer ownership) continue through their own
-- domain operations and guards.
comment on function public.set_player_operational_status(uuid,text,text) is
  'Manager operation for OWNED/ACTIVE/RESERVE -> ACTIVE/RESERVE transitions only; requires an active player contract.';
