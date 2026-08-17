-- Clã das Sombras — transversal economic freeze guards and match settlement reversal

create or replace function public.economic_scope_is_frozen(
  p_club_id uuid default null,
  p_user_id uuid default null,
  p_universe_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1 from public.economic_freeze f
    where f.active and (
      (f.scope='USER' and f.user_id is not null and f.user_id = coalesce(p_user_id,(select c.user_id from public.club c where c.id=p_club_id))) or
      (f.scope='CLUB' and f.club_id=p_club_id) or
      (f.scope='UNIVERSE' and f.universe_id=coalesce(p_universe_id,(select c.universe_id from public.club c where c.id=p_club_id)))
    )
  );
$$;
revoke all on function public.economic_scope_is_frozen(uuid,uuid,uuid) from public;
grant execute on function public.economic_scope_is_frozen(uuid,uuid,uuid) to authenticated,service_role;

create or replace function public.guard_market_listing_economic_freeze()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if public.economic_scope_is_frozen(new.seller_club_id,null,new.universe_id) then
    raise exception 'economic_scope_frozen';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_market_listing_freeze on public.market_listing;
create trigger guard_market_listing_freeze before insert or update on public.market_listing
for each row execute function public.guard_market_listing_economic_freeze();

create or replace function public.guard_auction_bid_economic_freeze()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare v_universe uuid;
begin
  select universe_id into v_universe from public.market_listing where id=new.listing_id;
  if public.economic_scope_is_frozen(new.bidder_club_id,null,v_universe) then
    raise exception 'economic_scope_frozen';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_auction_bid_freeze on public.auction_bid;
create trigger guard_auction_bid_freeze before insert or update on public.auction_bid
for each row execute function public.guard_auction_bid_economic_freeze();

create or replace function public.guard_player_ownership_economic_freeze()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if old.owner_club_id is distinct from new.owner_club_id then
    if old.owner_club_id is not null and public.economic_scope_is_frozen(old.owner_club_id,null,new.universe_id) then raise exception 'seller_economic_scope_frozen'; end if;
    if new.owner_club_id is not null and public.economic_scope_is_frozen(new.owner_club_id,null,new.universe_id) then raise exception 'buyer_economic_scope_frozen'; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_universe_player_transfer_freeze on public.universe_player;
create trigger guard_universe_player_transfer_freeze before update of owner_club_id on public.universe_player
for each row execute function public.guard_player_ownership_economic_freeze();

create or replace function public.guard_player_contract_economic_freeze()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if public.economic_scope_is_frozen(new.club_id,null,null) then raise exception 'economic_scope_frozen'; end if;
  return new;
end;
$$;

drop trigger if exists guard_player_contract_freeze on public.player_contract;
create trigger guard_player_contract_freeze before insert or update on public.player_contract
for each row execute function public.guard_player_contract_economic_freeze();

create or replace function public.service_reverse_match_settlement(
  p_match_id uuid,
  p_reason text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_match public.match;
  v_settlement public.match_settlement;
  v_comp public.competition;
  v_home_delta integer;
  v_away_delta integer;
  v_home_points integer;
  v_away_points integer;
  v_home_result text;
  v_away_result text;
  v_ledger_tx uuid;
  v_reverse_tx uuid;
begin
  if p_reason is null or length(trim(p_reason))<5 then raise exception 'reversal_reason_required'; end if;
  select * into v_match from public.match where id=p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;
  select * into v_settlement from public.match_settlement where match_id=p_match_id and status='APPLIED' order by settlement_version desc limit 1 for update;
  if not found then raise exception 'applied_settlement_not_found'; end if;

  v_home_delta:=coalesce((v_settlement.payload->>'home_elo_delta')::integer,0);
  v_away_delta:=coalesce((v_settlement.payload->>'away_elo_delta')::integer,0);
  v_home_points:=coalesce((v_settlement.payload->>'home_points')::integer,0);
  v_away_points:=coalesce((v_settlement.payload->>'away_points')::integer,0);

  update public.club set elo=greatest(0,elo-v_home_delta),updated_at=now() where id=v_match.home_club_id;
  update public.club set elo=greatest(0,elo-v_away_delta),updated_at=now() where id=v_match.away_club_id;

  select * into v_comp from public.competition where id=v_match.competition_id;
  if found and v_comp.type='LEAGUE' then
    if v_match.home_score>v_match.away_score then v_home_result:='W';v_away_result:='L';
    elsif v_match.home_score<v_match.away_score then v_home_result:='L';v_away_result:='W';
    else v_home_result:='D';v_away_result:='D'; end if;

    update public.league_standing set
      played=greatest(0,played-1),
      won=greatest(0,won-case when v_home_result='W' then 1 else 0 end),
      drawn=greatest(0,drawn-case when v_home_result='D' then 1 else 0 end),
      lost=greatest(0,lost-case when v_home_result='L' then 1 else 0 end),
      goals_for=greatest(0,goals_for-coalesce(v_match.home_score,0)),
      goals_against=greatest(0,goals_against-coalesce(v_match.away_score,0)),
      points=greatest(0,points-v_home_points),updated_at=now()
    where competition_id=v_comp.id and club_id=v_match.home_club_id;

    update public.league_standing set
      played=greatest(0,played-1),
      won=greatest(0,won-case when v_away_result='W' then 1 else 0 end),
      drawn=greatest(0,drawn-case when v_away_result='D' then 1 else 0 end),
      lost=greatest(0,lost-case when v_away_result='L' then 1 else 0 end),
      goals_for=greatest(0,goals_for-coalesce(v_match.away_score,0)),
      goals_against=greatest(0,goals_against-coalesce(v_match.home_score,0)),
      points=greatest(0,points-v_away_points),updated_at=now()
    where competition_id=v_comp.id and club_id=v_match.away_club_id;
  end if;

  if v_settlement.payload ? 'ledger_transaction_id' then
    v_ledger_tx := (v_settlement.payload->>'ledger_transaction_id')::uuid;
    select public.service_reverse_ledger_transaction(v_ledger_tx,'Match settlement reversal: '||trim(p_reason),p_idempotency_key||':ledger') into v_reverse_tx;
  end if;

  update public.match_settlement set status='REVERSED',payload=payload||jsonb_build_object('reversed_at',now(),'reversal_reason',trim(p_reason),'reversal_key',p_idempotency_key,'reversal_ledger_transaction_id',v_reverse_tx) where id=v_settlement.id;
  update public.match set state='DISPUTED',confirmed_at=null,settled_at=null,updated_at=now(),result_metadata=coalesce(result_metadata,'{}'::jsonb)||jsonb_build_object('settlement_reversed',true,'reversal_reason',trim(p_reason)) where id=p_match_id;

  return jsonb_build_object('match_id',p_match_id,'reversed_settlement_id',v_settlement.id,'ledger_reversal_id',v_reverse_tx,'state','DISPUTED');
end;
$$;
revoke all on function public.service_reverse_match_settlement(uuid,text,text) from public;
grant execute on function public.service_reverse_match_settlement(uuid,text,text) to service_role;
