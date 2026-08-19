-- Clã das Sombras — market/competition roster guards and real seller operations
-- Apply after 00410_competitive_roster_lineups.sql.
--
-- A market action may not make an already committed club competitively invalid.
-- Auction bids reserve squad capacity so settlement cannot deadlock on max_squad_size.
-- Listing creation becomes idempotent and preserves the player's previous operational status.

alter table public.market_listing
  add column if not exists idempotency_key text,
  add column if not exists player_status_before_listing text;

create unique index if not exists market_listing_idempotency_uidx
  on public.market_listing(idempotency_key)
  where idempotency_key is not null;

create or replace function public.club_has_competitive_commitment(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select
    exists(
      select 1
      from public.competition_registration cr
      join public.competition c on c.id=cr.competition_id
      where cr.club_id=p_club_id
        and cr.state in ('REGISTERED','APPROVED')
        and c.status in ('REGISTRATION','SCHEDULED','ACTIVE')
    )
    or exists(
      select 1
      from public.competition_participant cp
      join public.competition c on c.id=cp.competition_id
      where cp.club_id=p_club_id
        and cp.status in ('PENDING','ACTIVE')
        and c.status in ('SCHEDULED','ACTIVE')
    )
    or exists(
      select 1
      from public.match m
      where p_club_id in (m.home_club_id,m.away_club_id)
        and m.state in ('SCHEDULED','READY','PLAYED','RESULT_SUBMITTED','CONFIRMED','DISPUTED','AUTO_CONFIRMED')
    );
$$;
revoke all on function public.club_has_competitive_commitment(uuid) from public,anon,authenticated;
grant execute on function public.club_has_competitive_commitment(uuid) to service_role;

create or replace function public.player_locked_in_pending_lineup(p_universe_player_id uuid,p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1
    from public.match_lineup_player mlp
    join public.match_lineup ml on ml.id=mlp.lineup_id
    join public.match m on m.id=ml.match_id
    where mlp.universe_player_id=p_universe_player_id
      and ml.club_id=p_club_id
      and m.state in ('SCHEDULED','READY','PLAYED','RESULT_SUBMITTED','CONFIRMED','DISPUTED','AUTO_CONFIRMED')
  );
$$;
revoke all on function public.player_locked_in_pending_lineup(uuid,uuid) from public,anon,authenticated;
grant execute on function public.player_locked_in_pending_lineup(uuid,uuid) to service_role;

create or replace function public.club_competitive_release_check(p_club_id uuid,p_universe_player_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_club public.club;
  v_universe public.universe;
  v_remaining integer:=0;
  v_committed boolean:=false;
  v_locked boolean:=false;
begin
  select * into v_club from public.club where id=p_club_id;
  if not found then raise exception 'club_not_found'; end if;
  select * into v_universe from public.universe where id=v_club.universe_id;
  if not found then raise exception 'universe_not_found'; end if;

  v_committed:=public.club_has_competitive_commitment(v_club.id);
  v_locked:=public.player_locked_in_pending_lineup(p_universe_player_id,v_club.id);

  select count(*)::integer into v_remaining
  from public.universe_player up
  where up.owner_club_id=v_club.id
    and up.universe_id=v_club.universe_id
    and up.id<>p_universe_player_id
    and up.status in ('ACTIVE','RESERVE')
    and exists(
      select 1 from public.player_contract pc
      where pc.universe_player_id=up.id
        and pc.club_id=v_club.id
        and pc.status='ACTIVE'
    );

  return jsonb_build_object(
    'club_id',v_club.id,
    'universe_id',v_club.universe_id,
    'competitive_commitment',v_committed,
    'locked_in_pending_lineup',v_locked,
    'eligible_after_release',v_remaining,
    'min_squad_size',v_universe.min_squad_size,
    'allowed',not v_committed or (not v_locked and v_remaining>=v_universe.min_squad_size)
  );
end;
$$;
revoke all on function public.club_competitive_release_check(uuid,uuid) from public,anon,authenticated;
grant execute on function public.club_competitive_release_check(uuid,uuid) to service_role;

create or replace function public.guard_universe_player_competitive_market()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_currently_eligible boolean:=false;
  v_check jsonb;
  v_max integer;
  v_owned integer:=0;
  v_reserved integer:=0;
begin
  if old.owner_club_id is not null
     and (
       old.owner_club_id is distinct from new.owner_club_id
       or (old.status in ('ACTIVE','RESERVE') and new.status not in ('ACTIVE','RESERVE'))
     )
     and public.club_has_competitive_commitment(old.owner_club_id) then

    if public.player_locked_in_pending_lineup(old.id,old.owner_club_id) then
      raise exception 'player_locked_in_pending_lineup';
    end if;

    v_currently_eligible:=old.status in ('ACTIVE','RESERVE') and exists(
      select 1 from public.player_contract pc
      where pc.universe_player_id=old.id
        and pc.club_id=old.owner_club_id
        and pc.status='ACTIVE'
    );

    if v_currently_eligible then
      v_check:=public.club_competitive_release_check(old.owner_club_id,old.id);
      if coalesce((v_check->>'allowed')::boolean,false)=false then
        raise exception 'competitive_roster_minimum_protected: % eligible after operation, % required',
          coalesce((v_check->>'eligible_after_release')::integer,0),
          coalesce((v_check->>'min_squad_size')::integer,0);
      end if;
    end if;
  end if;

  if new.owner_club_id is not null and old.owner_club_id is distinct from new.owner_club_id then
    select u.max_squad_size into v_max
    from public.club c join public.universe u on u.id=c.universe_id
    where c.id=new.owner_club_id and c.universe_id=new.universe_id;
    if v_max is null then raise exception 'buyer_club_or_universe_not_found'; end if;

    select count(*)::integer into v_owned
    from public.universe_player up
    where up.owner_club_id=new.owner_club_id
      and up.universe_id=new.universe_id
      and up.id<>new.id;

    select count(*)::integer into v_reserved
    from public.auction_escrow ae
    join public.market_listing ml on ml.id=ae.listing_id
    where ae.bidder_club_id=new.owner_club_id
      and ae.status='HELD'
      and ml.universe_id=new.universe_id
      and ml.universe_player_id<>new.id;

    if v_owned+v_reserved+1>v_max then
      raise exception 'buyer_squad_capacity_exceeded: % owned/reserved, % maximum',v_owned+v_reserved,v_max;
    end if;
  end if;

  return new;
end;
$$;
revoke all on function public.guard_universe_player_competitive_market() from public,anon,authenticated;
grant execute on function public.guard_universe_player_competitive_market() to service_role;

drop trigger if exists guard_universe_player_competitive_market on public.universe_player;
create trigger guard_universe_player_competitive_market
before update of owner_club_id,status on public.universe_player
for each row execute function public.guard_universe_player_competitive_market();

create or replace function public.guard_player_contract_competitive_release()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_asset public.universe_player;
  v_check jsonb;
begin
  if old.status='ACTIVE'
     and (tg_op='DELETE' or new.status is distinct from 'ACTIVE') then
    select * into v_asset from public.universe_player where id=old.universe_player_id;
    if found
       and v_asset.owner_club_id=old.club_id
       and v_asset.status in ('ACTIVE','RESERVE')
       and public.club_has_competitive_commitment(old.club_id) then
      if public.player_locked_in_pending_lineup(v_asset.id,old.club_id) then
        raise exception 'player_locked_in_pending_lineup';
      end if;
      v_check:=public.club_competitive_release_check(old.club_id,v_asset.id);
      if coalesce((v_check->>'allowed')::boolean,false)=false then
        raise exception 'competitive_roster_minimum_protected: % eligible after contract change, % required',
          coalesce((v_check->>'eligible_after_release')::integer,0),
          coalesce((v_check->>'min_squad_size')::integer,0);
      end if;
    end if;
  end if;
  return case when tg_op='DELETE' then old else new end;
end;
$$;
revoke all on function public.guard_player_contract_competitive_release() from public,anon,authenticated;
grant execute on function public.guard_player_contract_competitive_release() to service_role;

drop trigger if exists guard_player_contract_competitive_release_update on public.player_contract;
create trigger guard_player_contract_competitive_release_update
before update of status on public.player_contract
for each row execute function public.guard_player_contract_competitive_release();

drop trigger if exists guard_player_contract_competitive_release_delete on public.player_contract;
create trigger guard_player_contract_competitive_release_delete
before delete on public.player_contract
for each row execute function public.guard_player_contract_competitive_release();

create or replace function public.guard_auction_squad_slot_reservation()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_listing public.market_listing;
  v_max integer;
  v_owned integer:=0;
  v_other_reserved integer:=0;
begin
  if new.status<>'HELD' or (tg_op='UPDATE' and old.status='HELD') then return new; end if;

  select * into v_listing from public.market_listing where id=new.listing_id;
  if not found then raise exception 'listing_not_found'; end if;

  select u.max_squad_size into v_max
  from public.club c join public.universe u on u.id=c.universe_id
  where c.id=new.bidder_club_id and c.universe_id=v_listing.universe_id;
  if v_max is null then raise exception 'bidder_club_or_universe_not_found'; end if;

  select count(*)::integer into v_owned
  from public.universe_player up
  where up.owner_club_id=new.bidder_club_id and up.universe_id=v_listing.universe_id;

  select count(*)::integer into v_other_reserved
  from public.auction_escrow ae
  join public.market_listing ml on ml.id=ae.listing_id
  where ae.bidder_club_id=new.bidder_club_id
    and ae.status='HELD'
    and ae.id is distinct from new.id
    and ml.universe_id=v_listing.universe_id;

  if v_owned+v_other_reserved+1>v_max then
    raise exception 'auction_squad_capacity_exceeded: % owned/reserved, % maximum',v_owned+v_other_reserved,v_max;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_auction_squad_slot_reservation() from public,anon,authenticated;
grant execute on function public.guard_auction_squad_slot_reservation() to service_role;

drop trigger if exists guard_auction_squad_slot_reservation on public.auction_escrow;
create trigger guard_auction_squad_slot_reservation
before insert or update of status on public.auction_escrow
for each row execute function public.guard_auction_squad_slot_reservation();

create or replace function public.create_direct_market_listing(
  p_universe_player_id uuid,
  p_asking_price bigint,
  p_idempotency_key text
)
returns public.market_listing
language plpgsql
security definer
set search_path=public
as $$
declare
  v_asset public.universe_player;
  v_club public.club;
  v_listing public.market_listing;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key))<8 then raise exception 'idempotency_key_required'; end if;
  if p_asking_price<=0 then raise exception 'invalid_asking_price'; end if;

  select * into v_listing from public.market_listing where idempotency_key=trim(p_idempotency_key);
  if found then return v_listing; end if;

  select * into v_asset from public.universe_player where id=p_universe_player_id for update;
  if not found or v_asset.owner_club_id is null then raise exception 'player_not_owned'; end if;
  if v_asset.status in ('LISTED','AUCTION') then raise exception 'player_already_listed'; end if;

  select * into v_club from public.club where id=v_asset.owner_club_id;
  if not found or v_club.user_id<>auth.uid() then raise exception 'not_player_owner'; end if;
  if exists(select 1 from public.market_listing where universe_player_id=v_asset.id and status='ACTIVE') then raise exception 'player_already_listed'; end if;

  insert into public.market_listing(
    universe_id,universe_player_id,seller_club_id,listing_type,asking_price,status,idempotency_key,player_status_before_listing
  ) values(
    v_asset.universe_id,v_asset.id,v_club.id,'DIRECT',p_asking_price,'ACTIVE',trim(p_idempotency_key),v_asset.status
  ) returning * into v_listing;

  update public.universe_player set status='LISTED',updated_at=now() where id=v_asset.id;
  return v_listing;
end;
$$;
revoke all on function public.create_direct_market_listing(uuid,bigint,text) from public,anon;
grant execute on function public.create_direct_market_listing(uuid,bigint,text) to authenticated;

create or replace function public.create_auction_listing(
  p_universe_player_id uuid,
  p_starting_price bigint,
  p_buy_now_price bigint,
  p_ends_at timestamptz,
  p_idempotency_key text
)
returns public.market_listing
language plpgsql
security definer
set search_path=public
as $$
declare
  v_asset public.universe_player;
  v_club public.club;
  v_listing public.market_listing;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key))<8 then raise exception 'idempotency_key_required'; end if;
  if p_starting_price<=0 or p_ends_at<=now() then raise exception 'invalid_auction_terms'; end if;
  if p_buy_now_price is not null and p_buy_now_price<p_starting_price then raise exception 'buy_now_below_starting_price'; end if;

  select * into v_listing from public.market_listing where idempotency_key=trim(p_idempotency_key);
  if found then return v_listing; end if;

  select * into v_asset from public.universe_player where id=p_universe_player_id for update;
  if not found or v_asset.owner_club_id is null then raise exception 'player_not_owned'; end if;
  if v_asset.status in ('LISTED','AUCTION') then raise exception 'player_already_listed'; end if;

  select * into v_club from public.club where id=v_asset.owner_club_id;
  if not found or v_club.user_id<>auth.uid() then raise exception 'not_player_owner'; end if;
  if exists(select 1 from public.market_listing where universe_player_id=v_asset.id and status='ACTIVE') then raise exception 'player_already_listed'; end if;

  insert into public.market_listing(
    universe_id,universe_player_id,seller_club_id,listing_type,asking_price,buy_now_price,ends_at,status,idempotency_key,player_status_before_listing
  ) values(
    v_asset.universe_id,v_asset.id,v_club.id,'AUCTION',p_starting_price,p_buy_now_price,p_ends_at,'ACTIVE',trim(p_idempotency_key),v_asset.status
  ) returning * into v_listing;

  update public.universe_player set status='AUCTION',updated_at=now() where id=v_asset.id;
  return v_listing;
end;
$$;
revoke all on function public.create_auction_listing(uuid,bigint,bigint,timestamptz,text) from public,anon;
grant execute on function public.create_auction_listing(uuid,bigint,bigint,timestamptz,text) to authenticated;

create or replace function public.cancel_market_listing(p_listing_id uuid,p_idempotency_key text)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_l public.market_listing;
  v_seller public.club;
  v_restore text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key))<3 then raise exception 'idempotency_key_required'; end if;
  select * into v_l from public.market_listing where id=p_listing_id for update;
  if not found or v_l.status<>'ACTIVE' then return; end if;
  select * into v_seller from public.club where id=v_l.seller_club_id;
  if not found or v_seller.user_id<>auth.uid() then raise exception 'not_listing_owner'; end if;
  if v_l.listing_type='AUCTION' and exists(select 1 from public.auction_escrow where listing_id=v_l.id and status='HELD') then
    raise exception 'auction_with_bids_cannot_be_cancelled';
  end if;

  v_restore:=case
    when v_l.player_status_before_listing in ('OWNED','ACTIVE','RESERVE','UNAVAILABLE') then v_l.player_status_before_listing
    else 'ACTIVE'
  end;

  update public.market_listing set status='CANCELLED',updated_at=now() where id=v_l.id;
  update public.universe_player
  set status=v_restore,updated_at=now()
  where id=v_l.universe_player_id and owner_club_id=v_l.seller_club_id;
end;
$$;
revoke all on function public.cancel_market_listing(uuid,text) from public,anon;
grant execute on function public.cancel_market_listing(uuid,text) to authenticated;
