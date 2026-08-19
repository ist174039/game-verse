-- Clã das Sombras — competitive roster eligibility and per-match lineups
-- Apply after 00400_match_dispute_resolution.sql.
--
-- A club may only enter competitions with a valid competitive roster. Each match
-- receives a private per-club starting XI selected from owned, operational players
-- with ACTIVE contracts. Result submission is rejected unless both lineups remain valid.

create table if not exists public.match_lineup (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.match(id) on delete cascade,
  club_id uuid not null references public.club(id) on delete cascade,
  formation text not null default '4-3-3',
  submitted_by uuid not null references auth.users(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(match_id,club_id),
  check (formation in ('4-3-3','4-2-3-1','4-4-2','3-5-2','5-3-2'))
);

create table if not exists public.match_lineup_player (
  lineup_id uuid not null references public.match_lineup(id) on delete cascade,
  universe_player_id uuid not null references public.universe_player(id) on delete restrict,
  slot smallint not null check (slot between 1 and 11),
  primary key(lineup_id,slot),
  unique(lineup_id,universe_player_id)
);

create index if not exists match_lineup_match_idx on public.match_lineup(match_id);
create index if not exists match_lineup_club_idx on public.match_lineup(club_id);
create index if not exists match_lineup_player_asset_idx on public.match_lineup_player(universe_player_id);

alter table public.match_lineup enable row level security;
alter table public.match_lineup_player enable row level security;

revoke all on public.match_lineup from public,anon,authenticated;
revoke all on public.match_lineup_player from public,anon,authenticated;
grant select on public.match_lineup to authenticated;
grant select on public.match_lineup_player to authenticated;

drop policy if exists match_lineup_own_read on public.match_lineup;
create policy match_lineup_own_read on public.match_lineup
for select to authenticated
using (
  exists(
    select 1 from public.club c
    where c.id=match_lineup.club_id and c.user_id=auth.uid()
  )
);

drop policy if exists match_lineup_player_own_read on public.match_lineup_player;
create policy match_lineup_player_own_read on public.match_lineup_player
for select to authenticated
using (
  exists(
    select 1
    from public.match_lineup ml
    join public.club c on c.id=ml.club_id
    where ml.id=match_lineup_player.lineup_id and c.user_id=auth.uid()
  )
);

create or replace function public.club_competitive_eligibility(p_club_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path=public
as $$
declare
  v_club public.club;
  v_universe public.universe;
  v_owned integer:=0;
  v_operational integer:=0;
  v_with_contract integer:=0;
  v_eligible integer:=0;
begin
  select * into v_club from public.club where id=p_club_id;
  if not found then raise exception 'club_not_found'; end if;

  select * into v_universe from public.universe where id=v_club.universe_id;
  if not found then raise exception 'universe_not_found'; end if;

  select
    count(*)::integer,
    count(*) filter (where up.status in ('ACTIVE','RESERVE'))::integer,
    count(*) filter (
      where exists(
        select 1 from public.player_contract pc
        where pc.universe_player_id=up.id
          and pc.club_id=v_club.id
          and pc.status='ACTIVE'
      )
    )::integer,
    count(*) filter (
      where up.status in ('ACTIVE','RESERVE')
        and exists(
          select 1 from public.player_contract pc
          where pc.universe_player_id=up.id
            and pc.club_id=v_club.id
            and pc.status='ACTIVE'
        )
    )::integer
  into v_owned,v_operational,v_with_contract,v_eligible
  from public.universe_player up
  where up.owner_club_id=v_club.id and up.universe_id=v_club.universe_id;

  return jsonb_build_object(
    'club_id',v_club.id,
    'universe_id',v_club.universe_id,
    'owned',v_owned,
    'operational',v_operational,
    'active_contracts',v_with_contract,
    'eligible_players',v_eligible,
    'min_squad_size',v_universe.min_squad_size,
    'max_squad_size',v_universe.max_squad_size,
    'eligible',v_eligible>=v_universe.min_squad_size,
    'missing_players',greatest(0,v_universe.min_squad_size-v_eligible)
  );
end;
$$;
revoke all on function public.club_competitive_eligibility(uuid) from public,anon,authenticated;
grant execute on function public.club_competitive_eligibility(uuid) to service_role;

create or replace function public.match_lineup_valid(p_match_id uuid,p_club_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path=public
as $$
declare
  v_lineup_id uuid;
  v_match public.match;
  v_total integer:=0;
  v_valid integer:=0;
begin
  select * into v_match from public.match where id=p_match_id;
  if not found then return false; end if;
  if p_club_id not in (v_match.home_club_id,v_match.away_club_id) then return false; end if;

  select id into v_lineup_id
  from public.match_lineup
  where match_id=p_match_id and club_id=p_club_id;
  if v_lineup_id is null then return false; end if;

  select
    count(*)::integer,
    count(*) filter (
      where up.owner_club_id=p_club_id
        and up.universe_id=v_match.universe_id
        and up.status in ('ACTIVE','RESERVE')
        and exists(
          select 1 from public.player_contract pc
          where pc.universe_player_id=up.id
            and pc.club_id=p_club_id
            and pc.status='ACTIVE'
        )
    )::integer
  into v_total,v_valid
  from public.match_lineup_player mlp
  join public.universe_player up on up.id=mlp.universe_player_id
  where mlp.lineup_id=v_lineup_id;

  return v_total=11 and v_valid=11;
end;
$$;
revoke all on function public.match_lineup_valid(uuid,uuid) from public,anon,authenticated;
grant execute on function public.match_lineup_valid(uuid,uuid) to service_role;

create or replace function public.match_lineup_readiness(p_match_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path=public
as $$
declare
  v_match public.match;
  v_own_club uuid;
  v_home_ready boolean;
  v_away_ready boolean;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  select * into v_match from public.match where id=p_match_id;
  if not found then raise exception 'match_not_found'; end if;

  select id into v_own_club
  from public.club
  where user_id=auth.uid() and id in (v_match.home_club_id,v_match.away_club_id)
  limit 1;
  if v_own_club is null then raise exception 'not_match_participant'; end if;

  v_home_ready:=public.match_lineup_valid(v_match.id,v_match.home_club_id);
  v_away_ready:=public.match_lineup_valid(v_match.id,v_match.away_club_id);

  return jsonb_build_object(
    'match_id',v_match.id,
    'home_ready',v_home_ready,
    'away_ready',v_away_ready,
    'own_ready',case when v_own_club=v_match.home_club_id then v_home_ready else v_away_ready end,
    'opponent_ready',case when v_own_club=v_match.home_club_id then v_away_ready else v_home_ready end,
    'both_ready',v_home_ready and v_away_ready
  );
end;
$$;
revoke all on function public.match_lineup_readiness(uuid) from public,anon;
grant execute on function public.match_lineup_readiness(uuid) to authenticated;

create or replace function public.save_match_lineup(
  p_match_id uuid,
  p_player_ids uuid[],
  p_formation text default '4-3-3'
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_match public.match;
  v_club public.club;
  v_lineup public.match_lineup;
  v_unique integer:=0;
  v_valid integer:=0;
  v_formation text:=coalesce(nullif(trim(p_formation),''),'4-3-3');
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_player_ids is null or cardinality(p_player_ids)<>11 then raise exception 'starting_eleven_required'; end if;
  if v_formation not in ('4-3-3','4-2-3-1','4-4-2','3-5-2','5-3-2') then raise exception 'invalid_formation'; end if;

  select count(distinct selected.player_id)::integer into v_unique
  from unnest(p_player_ids) as selected(player_id);
  if v_unique<>11 then raise exception 'duplicate_lineup_player'; end if;

  select * into v_match from public.match where id=p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;
  if v_match.state<>'READY' then raise exception 'lineup_locked_for_match_state'; end if;

  select * into v_club
  from public.club
  where user_id=auth.uid() and id in (v_match.home_club_id,v_match.away_club_id)
  limit 1;
  if not found then raise exception 'not_match_participant'; end if;

  select count(*)::integer into v_valid
  from public.universe_player up
  where up.id=any(p_player_ids)
    and up.owner_club_id=v_club.id
    and up.universe_id=v_match.universe_id
    and up.status in ('ACTIVE','RESERVE')
    and exists(
      select 1 from public.player_contract pc
      where pc.universe_player_id=up.id
        and pc.club_id=v_club.id
        and pc.status='ACTIVE'
    );
  if v_valid<>11 then raise exception 'invalid_or_ineligible_lineup_player'; end if;

  insert into public.match_lineup(match_id,club_id,formation,submitted_by,submitted_at,updated_at)
  values(v_match.id,v_club.id,v_formation,auth.uid(),now(),now())
  on conflict(match_id,club_id) do update
    set formation=excluded.formation,
        submitted_by=excluded.submitted_by,
        submitted_at=now(),
        updated_at=now()
  returning * into v_lineup;

  delete from public.match_lineup_player where lineup_id=v_lineup.id;
  insert into public.match_lineup_player(lineup_id,universe_player_id,slot)
  select v_lineup.id,player_id,ordinality::smallint
  from unnest(p_player_ids) with ordinality as selected(player_id,ordinality);

  return jsonb_build_object(
    'lineup_id',v_lineup.id,
    'match_id',v_match.id,
    'club_id',v_club.id,
    'formation',v_lineup.formation,
    'player_count',11,
    'submitted_at',v_lineup.submitted_at,
    'valid',true
  );
end;
$$;
revoke all on function public.save_match_lineup(uuid,uuid[],text) from public,anon;
grant execute on function public.save_match_lineup(uuid,uuid[],text) to authenticated;

-- Registration now validates the operational roster before any entry fee is charged.
create or replace function public.register_for_competition(p_competition_id uuid,p_idempotency_key text)
returns public.competition_registration
language plpgsql
security definer
set search_path=public
as $$
declare
  v_comp public.competition;
  v_club public.club;
  v_reg public.competition_registration;
  v_club_account public.club_currency_account;
  v_universe_account public.universe_currency_account;
  v_tx public.ledger_transaction;
  v_eligibility jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_idempotency_key is null or length(p_idempotency_key)<3 then raise exception 'idempotency_key_required'; end if;

  select * into v_reg from public.competition_registration where idempotency_key=p_idempotency_key;
  if found then return v_reg; end if;

  select * into v_comp from public.competition where id=p_competition_id for update;
  if not found then raise exception 'competition_not_found'; end if;
  if v_comp.status not in ('DRAFT','REGISTRATION','OPEN') then raise exception 'registration_closed'; end if;

  select * into v_club
  from public.club
  where universe_id=v_comp.universe_id and user_id=auth.uid()
  for update;
  if not found then raise exception 'club_required_in_universe'; end if;

  if exists(
    select 1 from public.competition_registration
    where competition_id=p_competition_id and club_id=v_club.id and state in ('REGISTERED','APPROVED')
  ) then raise exception 'already_registered'; end if;

  v_eligibility:=public.club_competitive_eligibility(v_club.id);
  if coalesce((v_eligibility->>'eligible')::boolean,false)=false then
    raise exception 'competitive_roster_ineligible: % eligible, % required',
      coalesce((v_eligibility->>'eligible_players')::integer,0),
      coalesce((v_eligibility->>'min_squad_size')::integer,0);
  end if;

  if exists(
    select 1 from public.economic_freeze f
    where f.active and (
      (f.scope='USER' and f.user_id=auth.uid()) or
      (f.scope='CLUB' and f.club_id=v_club.id) or
      (f.scope='UNIVERSE' and f.universe_id=v_comp.universe_id)
    )
  ) then raise exception 'economic_scope_frozen'; end if;

  if v_comp.entry_fee>0 then
    select * into v_club_account
    from public.club_currency_account
    where club_id=v_club.id and currency='SILVER'
    for update;
    if not found then raise exception 'club_silver_account_not_found'; end if;
    if v_club_account.balance<v_comp.entry_fee then raise exception 'insufficient_silver'; end if;

    insert into public.universe_currency_account(universe_id,currency,balance)
    values(v_comp.universe_id,'SILVER',0)
    on conflict(universe_id,currency) do nothing;

    select * into v_universe_account
    from public.universe_currency_account
    where universe_id=v_comp.universe_id and currency='SILVER'
    for update;

    insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata)
    values(
      'COMPETITION_ENTRY_FEE',p_idempotency_key,'COMPETITION',v_comp.id,
      'Competition registration fee',auth.uid(),
      jsonb_build_object('club_id',v_club.id,'entry_fee',v_comp.entry_fee,'universe_id',v_comp.universe_id)
    ) returning * into v_tx;

    insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount)
    values(v_tx.id,'DEBIT','SILVER','CLUB',v_club_account.id,v_comp.entry_fee);
    insert into public.ledger_entry(transaction_id,direction,currency,scope,universe_account_id,amount)
    values(v_tx.id,'CREDIT','SILVER','UNIVERSE',v_universe_account.id,v_comp.entry_fee);

    update public.club_currency_account set balance=balance-v_comp.entry_fee,updated_at=now() where id=v_club_account.id;
    update public.universe_currency_account set balance=balance+v_comp.entry_fee,updated_at=now() where id=v_universe_account.id;
    update public.competition set prize_pool=prize_pool+v_comp.entry_fee where id=v_comp.id;
  end if;

  insert into public.competition_registration(competition_id,club_id,state,entry_fee_paid,ledger_transaction_id,idempotency_key)
  values(p_competition_id,v_club.id,'REGISTERED',v_comp.entry_fee,v_tx.id,p_idempotency_key)
  on conflict(competition_id,club_id) do update
    set state='REGISTERED',registered_at=now(),entry_fee_paid=excluded.entry_fee_paid,
        ledger_transaction_id=excluded.ledger_transaction_id,idempotency_key=excluded.idempotency_key
  returning * into v_reg;

  return v_reg;
end;
$$;
revoke all on function public.register_for_competition(uuid,text) from public,anon;
grant execute on function public.register_for_competition(uuid,text) to authenticated;

create or replace function public.guard_match_result_lineups()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.state='RESULT_SUBMITTED' and old.state is distinct from new.state then
    -- Administrative dispute rulings may settle legacy matches created before lineups existed.
    if coalesce(new.result_metadata->>'confirmation_mode','')='ADMIN_DISPUTE_RESOLUTION' then
      return new;
    end if;
    if not public.match_lineup_valid(new.id,new.home_club_id) then raise exception 'home_lineup_not_ready'; end if;
    if not public.match_lineup_valid(new.id,new.away_club_id) then raise exception 'away_lineup_not_ready'; end if;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_match_result_lineups() from public,anon,authenticated;
grant execute on function public.guard_match_result_lineups() to service_role;

drop trigger if exists guard_match_result_lineups on public.match;
create trigger guard_match_result_lineups
before update of state on public.match
for each row execute function public.guard_match_result_lineups();

create or replace function public.reset_match_lineups_on_replay()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.state='READY'
     and old.state='DISPUTED'
     and coalesce((new.result_metadata->>'replay_required')::boolean,false) then
    delete from public.match_lineup where match_id=new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.reset_match_lineups_on_replay() from public,anon,authenticated;
grant execute on function public.reset_match_lineups_on_replay() to service_role;

drop trigger if exists reset_match_lineups_on_replay on public.match;
create trigger reset_match_lineups_on_replay
after update of state on public.match
for each row execute function public.reset_match_lineups_on_replay();
