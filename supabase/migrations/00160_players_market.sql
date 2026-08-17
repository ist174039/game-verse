-- Clã das Sombras — players, valuation history, market and auction operations
-- Player attributes originate from the external provider. The platform stores snapshots
-- and recalculates market/economic values without artificial player progression.

create table if not exists public.player_provider_snapshot (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_master(id) on delete cascade,
  provider text not null,
  external_id text not null,
  provider_version text,
  overall integer not null check (overall between 1 and 100),
  attributes jsonb not null default '{}'::jsonb,
  source_payload jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now()
);
create index if not exists player_provider_snapshot_player_idx on public.player_provider_snapshot(player_id, captured_at desc);

create table if not exists public.universe_player_valuation (
  id uuid primary key default gen_random_uuid(),
  universe_player_id uuid not null references public.universe_player(id) on delete cascade,
  overall integer not null check (overall between 1 and 100),
  platform_price bigint not null check (platform_price >= 0),
  market_reference_value bigint not null check (market_reference_value >= 0),
  salary_reference bigint not null check (salary_reference >= 0),
  reason text not null check (reason in ('PROVIDER_IMPORT','PROVIDER_UPDATE','MANUAL_RECALCULATION')),
  created_at timestamptz not null default now()
);
create index if not exists universe_player_valuation_asset_idx on public.universe_player_valuation(universe_player_id, created_at desc);

create table if not exists public.auction_escrow (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listing(id) on delete cascade,
  bidder_club_id uuid not null references public.club(id) on delete restrict,
  amount bigint not null check (amount > 0),
  status text not null default 'HELD' check (status in ('HELD','RELEASED','SETTLED')),
  ledger_transaction_id uuid not null references public.ledger_transaction(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists auction_one_held_escrow_idx on public.auction_escrow(listing_id) where status = 'HELD';

-- Provider/service operation. Saves an immutable source snapshot and updates the canonical player.
create or replace function public.service_upsert_provider_player(
  p_provider text,
  p_external_id text,
  p_provider_version text,
  p_name text,
  p_position text,
  p_overall integer,
  p_nationality text,
  p_image_url text,
  p_attributes jsonb,
  p_popularity_index numeric,
  p_source_payload jsonb
)
returns public.player_master
language plpgsql security definer set search_path = public
as $$
declare v_player public.player_master;
begin
  if p_overall < 1 or p_overall > 100 then raise exception 'invalid_overall'; end if;
  insert into public.player_master(provider,external_id,provider_version,name,position,overall,nationality,image_url,attributes,popularity_index,updated_at)
  values(p_provider,p_external_id,p_provider_version,p_name,p_position,p_overall,p_nationality,p_image_url,coalesce(p_attributes,'{}'::jsonb),p_popularity_index,now())
  on conflict(provider,external_id) do update set provider_version=excluded.provider_version,name=excluded.name,position=excluded.position,overall=excluded.overall,nationality=excluded.nationality,image_url=excluded.image_url,attributes=excluded.attributes,popularity_index=excluded.popularity_index,updated_at=now()
  returning * into v_player;
  insert into public.player_provider_snapshot(player_id,provider,external_id,provider_version,overall,attributes,source_payload)
  values(v_player.id,p_provider,p_external_id,p_provider_version,p_overall,coalesce(p_attributes,'{}'::jsonb),coalesce(p_source_payload,'{}'::jsonb));
  return v_player;
end; $$;
revoke all on function public.service_upsert_provider_player(text,text,text,text,text,integer,text,text,jsonb,numeric,jsonb) from public;
grant execute on function public.service_upsert_provider_player(text,text,text,text,text,integer,text,text,jsonb,numeric,jsonb) to service_role;

-- Records each recalculation. Rating is read from PLAYER_MASTER; only economic values are recalculated.
create or replace function public.service_revalue_universe_player(p_universe_player_id uuid,p_platform_price bigint,p_market_value bigint,p_salary bigint,p_reason text)
returns public.universe_player
language plpgsql security definer set search_path = public
as $$
declare v_asset public.universe_player; v_master public.player_master;
begin
  if least(p_platform_price,p_market_value,p_salary) < 0 then raise exception 'negative_value_not_allowed'; end if;
  select * into v_asset from public.universe_player where id=p_universe_player_id for update;
  if not found then raise exception 'universe_player_not_found'; end if;
  select * into v_master from public.player_master where id=v_asset.player_id;
  update public.universe_player set platform_price=p_platform_price,market_reference_value=p_market_value,salary_reference=p_salary,updated_at=now() where id=v_asset.id returning * into v_asset;
  insert into public.universe_player_valuation(universe_player_id,overall,platform_price,market_reference_value,salary_reference,reason)
  values(v_asset.id,v_master.overall,p_platform_price,p_market_value,p_salary,p_reason);
  return v_asset;
end; $$;
revoke all on function public.service_revalue_universe_player(uuid,bigint,bigint,bigint,text) from public;
grant execute on function public.service_revalue_universe_player(uuid,bigint,bigint,bigint,text) to service_role;

create or replace function public.create_direct_market_listing(p_universe_player_id uuid,p_asking_price bigint,p_idempotency_key text)
returns public.market_listing language plpgsql security definer set search_path=public as $$
declare v_asset public.universe_player; v_club public.club; v_listing public.market_listing;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_asking_price <= 0 then raise exception 'invalid_asking_price'; end if;
  select * into v_asset from public.universe_player where id=p_universe_player_id for update;
  if not found or v_asset.owner_club_id is null then raise exception 'player_not_owned'; end if;
  select * into v_club from public.club where id=v_asset.owner_club_id;
  if v_club.user_id <> auth.uid() then raise exception 'not_player_owner'; end if;
  if exists(select 1 from public.market_listing where universe_player_id=v_asset.id and status='ACTIVE') then raise exception 'player_already_listed'; end if;
  insert into public.market_listing(universe_id,universe_player_id,seller_club_id,listing_type,asking_price,status)
  values(v_asset.universe_id,v_asset.id,v_club.id,'DIRECT',p_asking_price,'ACTIVE') returning * into v_listing;
  update public.universe_player set status='LISTED',updated_at=now() where id=v_asset.id;
  return v_listing;
end; $$;
revoke all on function public.create_direct_market_listing(uuid,bigint,text) from public;
grant execute on function public.create_direct_market_listing(uuid,bigint,text) to authenticated;

create or replace function public.create_auction_listing(p_universe_player_id uuid,p_starting_price bigint,p_buy_now_price bigint,p_ends_at timestamptz,p_idempotency_key text)
returns public.market_listing language plpgsql security definer set search_path=public as $$
declare v_asset public.universe_player; v_club public.club; v_listing public.market_listing;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_starting_price <= 0 or p_ends_at <= now() then raise exception 'invalid_auction_terms'; end if;
  if p_buy_now_price is not null and p_buy_now_price < p_starting_price then raise exception 'buy_now_below_starting_price'; end if;
  select * into v_asset from public.universe_player where id=p_universe_player_id for update;
  select * into v_club from public.club where id=v_asset.owner_club_id;
  if not found or v_club.user_id <> auth.uid() then raise exception 'not_player_owner'; end if;
  if exists(select 1 from public.market_listing where universe_player_id=v_asset.id and status='ACTIVE') then raise exception 'player_already_listed'; end if;
  insert into public.market_listing(universe_id,universe_player_id,seller_club_id,listing_type,asking_price,buy_now_price,ends_at,status)
  values(v_asset.universe_id,v_asset.id,v_club.id,'AUCTION',p_starting_price,p_buy_now_price,p_ends_at,'ACTIVE') returning * into v_listing;
  update public.universe_player set status='AUCTION',updated_at=now() where id=v_asset.id;
  return v_listing;
end; $$;
revoke all on function public.create_auction_listing(uuid,bigint,bigint,timestamptz,text) from public;
grant execute on function public.create_auction_listing(uuid,bigint,bigint,timestamptz,text) to authenticated;

create or replace function public.buy_direct_market_listing(p_listing_id uuid,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_l public.market_listing; v_u public.universe; v_buyer public.club; v_ba public.club_currency_account; v_sa public.club_currency_account; v_ua public.universe_currency_account; v_tx public.ledger_transaction; v_gross bigint; v_fee bigint; v_net bigint;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_tx from public.ledger_transaction where idempotency_key=p_idempotency_key;
  if found then return v_tx.metadata->'receipt'; end if;
  select * into v_l from public.market_listing where id=p_listing_id for update;
  if not found or v_l.status<>'ACTIVE' or v_l.listing_type<>'DIRECT' then raise exception 'listing_not_available'; end if;
  select * into v_buyer from public.club where universe_id=v_l.universe_id and user_id=auth.uid();
  if not found then raise exception 'buyer_club_required'; end if;
  if v_buyer.id=v_l.seller_club_id then raise exception 'cannot_buy_own_player'; end if;
  select * into v_u from public.universe where id=v_l.universe_id;
  select * into v_ba from public.club_currency_account where club_id=v_buyer.id and currency='SILVER' for update;
  select * into v_sa from public.club_currency_account where club_id=v_l.seller_club_id and currency='SILVER' for update;
  insert into public.universe_currency_account(universe_id,currency,balance) values(v_l.universe_id,'SILVER',0) on conflict(universe_id,currency) do nothing;
  select * into v_ua from public.universe_currency_account where universe_id=v_l.universe_id and currency='SILVER' for update;
  v_gross:=v_l.asking_price; if v_ba.balance<v_gross then raise exception 'insufficient_silver'; end if;
  v_fee:=floor(v_gross*v_u.market_fee_pct/100.0); v_net:=v_gross-v_fee;
  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata)
  values('MARKET_DIRECT_TRANSFER',p_idempotency_key,'MARKET_LISTING',v_l.id,'Direct player transfer',auth.uid(),'{}') returning * into v_tx;
  insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_tx.id,'DEBIT','SILVER','CLUB',v_ba.id,v_gross);
  if v_net>0 then insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_tx.id,'CREDIT','SILVER','CLUB',v_sa.id,v_net); end if;
  if v_fee>0 then insert into public.ledger_entry(transaction_id,direction,currency,scope,universe_account_id,amount) values(v_tx.id,'CREDIT','SILVER','UNIVERSE',v_ua.id,v_fee); end if;
  update public.club_currency_account set balance=balance-v_gross,updated_at=now() where id=v_ba.id;
  update public.club_currency_account set balance=balance+v_net,updated_at=now() where id=v_sa.id;
  update public.universe_currency_account set balance=balance+v_fee,updated_at=now() where id=v_ua.id;
  update public.universe_player set owner_club_id=v_buyer.id,status='ACTIVE',acquired_at=now(),updated_at=now() where id=v_l.universe_player_id;
  update public.market_listing set status='SOLD',updated_at=now() where id=v_l.id;
  update public.player_contract set status='TRANSFERRED',updated_at=now() where universe_player_id=v_l.universe_player_id and status='ACTIVE';
  update public.ledger_transaction set metadata=jsonb_build_object('receipt',jsonb_build_object('listingId',v_l.id,'universePlayerId',v_l.universe_player_id,'sellerClubId',v_l.seller_club_id,'buyerClubId',v_buyer.id,'grossAmount',v_gross,'feeAmount',v_fee,'sellerNetAmount',v_net,'ledgerTransactionId',v_tx.id)) where id=v_tx.id;
  return (select metadata->'receipt' from public.ledger_transaction where id=v_tx.id);
end; $$;
revoke all on function public.buy_direct_market_listing(uuid,text) from public;
grant execute on function public.buy_direct_market_listing(uuid,text) to authenticated;

create or replace function public.place_auction_bid(p_listing_id uuid,p_amount bigint,p_idempotency_key text)
returns public.auction_bid language plpgsql security definer set search_path=public as $$
declare v_l public.market_listing; v_bidder public.club; v_acc public.club_currency_account; v_prev public.auction_escrow; v_prev_acc public.club_currency_account; v_tx public.ledger_transaction; v_release_tx public.ledger_transaction; v_bid public.auction_bid; v_high bigint;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_l from public.market_listing where id=p_listing_id for update;
  if not found or v_l.status<>'ACTIVE' or v_l.listing_type<>'AUCTION' or v_l.ends_at<=now() then raise exception 'auction_not_open'; end if;
  select * into v_bidder from public.club where universe_id=v_l.universe_id and user_id=auth.uid();
  if not found or v_bidder.id=v_l.seller_club_id then raise exception 'invalid_bidder'; end if;
  select coalesce(max(amount),0) into v_high from public.auction_bid where listing_id=v_l.id;
  if p_amount < greatest(coalesce(v_l.asking_price,1),v_high+1) then raise exception 'bid_too_low'; end if;
  select * into v_tx from public.ledger_transaction where idempotency_key=p_idempotency_key;
  if found then select * into v_bid from public.auction_bid where id=(v_tx.metadata->>'bid_id')::uuid; return v_bid; end if;
  select * into v_acc from public.club_currency_account where club_id=v_bidder.id and currency='SILVER' for update;
  if v_acc.balance<p_amount then raise exception 'insufficient_silver'; end if;
  select * into v_prev from public.auction_escrow where listing_id=v_l.id and status='HELD' for update;
  if found then
    select * into v_prev_acc from public.club_currency_account where club_id=v_prev.bidder_club_id and currency='SILVER' for update;
    insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by)
    values('AUCTION_ESCROW_RELEASE','release:'||v_prev.id,'MARKET_LISTING',v_l.id,'Previous highest bid released',auth.uid()) returning * into v_release_tx;
    insert into public.ledger_entry(transaction_id,direction,currency,scope,amount) values(v_release_tx.id,'DEBIT','SILVER','PLATFORM',v_prev.amount);
    insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_release_tx.id,'CREDIT','SILVER','CLUB',v_prev_acc.id,v_prev.amount);
    update public.club_currency_account set balance=balance+v_prev.amount,updated_at=now() where id=v_prev_acc.id;
    update public.auction_escrow set status='RELEASED',updated_at=now() where id=v_prev.id;
  end if;
  insert into public.auction_bid(listing_id,bidder_club_id,amount) values(v_l.id,v_bidder.id,p_amount) returning * into v_bid;
  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata)
  values('AUCTION_ESCROW_HOLD',p_idempotency_key,'MARKET_LISTING',v_l.id,'Auction bid escrow hold',auth.uid(),jsonb_build_object('bid_id',v_bid.id)) returning * into v_tx;
  insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_tx.id,'DEBIT','SILVER','CLUB',v_acc.id,p_amount);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,amount) values(v_tx.id,'CREDIT','SILVER','PLATFORM',p_amount);
  update public.club_currency_account set balance=balance-p_amount,updated_at=now() where id=v_acc.id;
  insert into public.auction_escrow(listing_id,bidder_club_id,amount,ledger_transaction_id) values(v_l.id,v_bidder.id,p_amount,v_tx.id);
  return v_bid;
end; $$;
revoke all on function public.place_auction_bid(uuid,bigint,text) from public;
grant execute on function public.place_auction_bid(uuid,bigint,text) to authenticated;

create or replace function public.settle_auction(p_listing_id uuid,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_l public.market_listing; v_e public.auction_escrow; v_u public.universe; v_sa public.club_currency_account; v_ua public.universe_currency_account; v_tx public.ledger_transaction; v_fee bigint; v_net bigint;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_tx from public.ledger_transaction where idempotency_key=p_idempotency_key; if found then return v_tx.metadata->'receipt'; end if;
  select * into v_l from public.market_listing where id=p_listing_id for update;
  if not found or v_l.status<>'ACTIVE' or v_l.listing_type<>'AUCTION' then raise exception 'auction_not_settleable'; end if;
  if v_l.ends_at>now() then raise exception 'auction_still_open'; end if;
  select * into v_e from public.auction_escrow where listing_id=v_l.id and status='HELD' for update;
  if not found then update public.market_listing set status='EXPIRED',updated_at=now() where id=v_l.id; update public.universe_player set status='ACTIVE',updated_at=now() where id=v_l.universe_player_id; raise exception 'auction_without_bids'; end if;
  select * into v_u from public.universe where id=v_l.universe_id;
  select * into v_sa from public.club_currency_account where club_id=v_l.seller_club_id and currency='SILVER' for update;
  insert into public.universe_currency_account(universe_id,currency,balance) values(v_l.universe_id,'SILVER',0) on conflict(universe_id,currency) do nothing;
  select * into v_ua from public.universe_currency_account where universe_id=v_l.universe_id and currency='SILVER' for update;
  v_fee:=floor(v_e.amount*v_u.auction_fee_pct/100.0); v_net:=v_e.amount-v_fee;
  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata) values('AUCTION_SETTLEMENT',p_idempotency_key,'MARKET_LISTING',v_l.id,'Auction settlement',auth.uid(),'{}') returning * into v_tx;
  insert into public.ledger_entry(transaction_id,direction,currency,scope,amount) values(v_tx.id,'DEBIT','SILVER','PLATFORM',v_e.amount);
  if v_net>0 then insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_tx.id,'CREDIT','SILVER','CLUB',v_sa.id,v_net); end if;
  if v_fee>0 then insert into public.ledger_entry(transaction_id,direction,currency,scope,universe_account_id,amount) values(v_tx.id,'CREDIT','SILVER','UNIVERSE',v_ua.id,v_fee); end if;
  update public.club_currency_account set balance=balance+v_net,updated_at=now() where id=v_sa.id;
  update public.universe_currency_account set balance=balance+v_fee,updated_at=now() where id=v_ua.id;
  update public.auction_escrow set status='SETTLED',updated_at=now() where id=v_e.id;
  update public.universe_player set owner_club_id=v_e.bidder_club_id,status='ACTIVE',acquired_at=now(),updated_at=now() where id=v_l.universe_player_id;
  update public.market_listing set status='SOLD',updated_at=now() where id=v_l.id;
  update public.player_contract set status='TRANSFERRED',updated_at=now() where universe_player_id=v_l.universe_player_id and status='ACTIVE';
  update public.ledger_transaction set metadata=jsonb_build_object('receipt',jsonb_build_object('listingId',v_l.id,'universePlayerId',v_l.universe_player_id,'sellerClubId',v_l.seller_club_id,'buyerClubId',v_e.bidder_club_id,'grossAmount',v_e.amount,'feeAmount',v_fee,'sellerNetAmount',v_net,'ledgerTransactionId',v_tx.id)) where id=v_tx.id;
  return (select metadata->'receipt' from public.ledger_transaction where id=v_tx.id);
end; $$;
revoke all on function public.settle_auction(uuid,text) from public;
grant execute on function public.settle_auction(uuid,text) to authenticated;

create or replace function public.cancel_market_listing(p_listing_id uuid,p_idempotency_key text)
returns void language plpgsql security definer set search_path=public as $$
declare v_l public.market_listing; v_seller public.club;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_l from public.market_listing where id=p_listing_id for update;
  if not found or v_l.status<>'ACTIVE' then return; end if;
  select * into v_seller from public.club where id=v_l.seller_club_id;
  if v_seller.user_id<>auth.uid() then raise exception 'not_listing_owner'; end if;
  if v_l.listing_type='AUCTION' and exists(select 1 from public.auction_escrow where listing_id=v_l.id and status='HELD') then raise exception 'auction_with_bids_cannot_be_cancelled'; end if;
  update public.market_listing set status='CANCELLED',updated_at=now() where id=v_l.id;
  update public.universe_player set status='ACTIVE',updated_at=now() where id=v_l.universe_player_id and owner_club_id=v_l.seller_club_id;
end; $$;
revoke all on function public.cancel_market_listing(uuid,text) from public;
grant execute on function public.cancel_market_listing(uuid,text) to authenticated;

alter table public.player_provider_snapshot enable row level security;
alter table public.universe_player_valuation enable row level security;
alter table public.auction_escrow enable row level security;
create policy "provider snapshots readable" on public.player_provider_snapshot for select to authenticated using (true);
create policy "valuations readable" on public.universe_player_valuation for select to authenticated using (true);
create policy "own auction escrow readable" on public.auction_escrow for select to authenticated using (exists(select 1 from public.club c where c.id=bidder_club_id and c.user_id=auth.uid()));
