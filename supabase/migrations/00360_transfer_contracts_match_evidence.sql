-- Clã das Sombras — transfer contracts and durable match evidence
-- Apply after 00350_pesdb_player_provider.sql.

-- Ensure every owned player has at most one active contract. Prefer the contract that
-- matches the current owner when legacy duplicates exist.
with ranked as (
  select pc.id,
         row_number() over (
           partition by pc.universe_player_id
           order by (pc.club_id=up.owner_club_id) desc, pc.created_at desc, pc.id desc
         ) as rn
  from public.player_contract pc
  join public.universe_player up on up.id=pc.universe_player_id
  where pc.status='ACTIVE'
)
update public.player_contract pc
set status='TRANSFERRED', updated_at=now()
from ranked r
where pc.id=r.id and r.rn>1;

create unique index if not exists player_contract_one_active_per_asset_idx
on public.player_contract(universe_player_id)
where status='ACTIVE';

create unique index if not exists match_evidence_file_path_idx
on public.match_evidence(match_id,file_path);

-- Internal contract helper. It is server-only and is called from atomic transfer functions.
create or replace function public.service_ensure_transfer_contract(
  p_universe_player_id uuid,
  p_club_id uuid,
  p_source text,
  p_reference_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_asset public.universe_player;
  v_club public.club;
  v_contract_id uuid;
  v_season_id uuid;
begin
  select * into v_asset from public.universe_player where id=p_universe_player_id for update;
  if not found then raise exception 'universe_player_not_found'; end if;
  if v_asset.owner_club_id is distinct from p_club_id then raise exception 'player_not_owned_by_target_club'; end if;

  select * into v_club from public.club where id=p_club_id;
  if not found then raise exception 'club_not_found'; end if;
  if v_club.universe_id<>v_asset.universe_id then raise exception 'club_universe_mismatch'; end if;

  update public.player_contract
  set status='TRANSFERRED',updated_at=now()
  where universe_player_id=p_universe_player_id
    and status='ACTIVE'
    and club_id<>p_club_id;

  select id into v_contract_id
  from public.player_contract
  where universe_player_id=p_universe_player_id and club_id=p_club_id and status='ACTIVE'
  order by created_at desc
  limit 1;
  if found then return v_contract_id; end if;

  select id into v_season_id
  from public.season
  where universe_id=v_asset.universe_id and status in ('ACTIVE','REGISTRATION','SCHEDULED')
  order by case status when 'ACTIVE' then 0 when 'REGISTRATION' then 1 else 2 end,created_at desc
  limit 1;

  insert into public.player_contract(universe_player_id,club_id,salary,start_season_id,status,clauses)
  values(
    p_universe_player_id,
    p_club_id,
    v_asset.salary_reference,
    v_season_id,
    'ACTIVE',
    jsonb_build_object(
      'source',coalesce(nullif(trim(p_source),''),'TRANSFER'),
      'reference_id',p_reference_id,
      'signed_at',now()
    )
  )
  returning id into v_contract_id;

  return v_contract_id;
end;
$$;
revoke all on function public.service_ensure_transfer_contract(uuid,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.service_ensure_transfer_contract(uuid,uuid,text,uuid) to service_role;

-- Direct transfer settlement now creates the buyer contract in the same transaction.
create or replace function public.buy_direct_market_listing(p_listing_id uuid,p_idempotency_key text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_l public.market_listing;
  v_u public.universe;
  v_buyer public.club;
  v_ba public.club_currency_account;
  v_sa public.club_currency_account;
  v_ua public.universe_currency_account;
  v_tx public.ledger_transaction;
  v_gross bigint;
  v_fee bigint;
  v_net bigint;
  v_contract_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if nullif(trim(coalesce(p_idempotency_key,'')),'') is null then raise exception 'idempotency_key_required'; end if;

  select * into v_tx from public.ledger_transaction where idempotency_key=p_idempotency_key;
  if found then return v_tx.metadata->'receipt'; end if;

  select * into v_l from public.market_listing where id=p_listing_id for update;
  if not found or v_l.status<>'ACTIVE' or v_l.listing_type<>'DIRECT' then raise exception 'listing_not_available'; end if;

  select * into v_buyer from public.club where universe_id=v_l.universe_id and user_id=auth.uid();
  if not found then raise exception 'buyer_club_required'; end if;
  if v_buyer.id=v_l.seller_club_id then raise exception 'cannot_buy_own_player'; end if;

  select * into v_u from public.universe where id=v_l.universe_id;
  select * into v_ba from public.club_currency_account where club_id=v_buyer.id and currency='SILVER' for update;
  if not found then raise exception 'buyer_silver_account_not_found'; end if;
  select * into v_sa from public.club_currency_account where club_id=v_l.seller_club_id and currency='SILVER' for update;
  if not found then raise exception 'seller_silver_account_not_found'; end if;

  insert into public.universe_currency_account(universe_id,currency,balance)
  values(v_l.universe_id,'SILVER',0)
  on conflict(universe_id,currency) do nothing;
  select * into v_ua from public.universe_currency_account where universe_id=v_l.universe_id and currency='SILVER' for update;

  v_gross:=v_l.asking_price;
  if v_gross is null or v_gross<=0 then raise exception 'invalid_listing_price'; end if;
  if v_ba.balance<v_gross then raise exception 'insufficient_silver'; end if;

  v_fee:=floor(v_gross*v_u.market_fee_pct/100.0);
  v_net:=v_gross-v_fee;

  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata)
  values('MARKET_DIRECT_TRANSFER',p_idempotency_key,'MARKET_LISTING',v_l.id,'Direct player transfer',auth.uid(),'{}'::jsonb)
  returning * into v_tx;

  insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount)
  values(v_tx.id,'DEBIT','SILVER','CLUB',v_ba.id,v_gross);
  if v_net>0 then
    insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount)
    values(v_tx.id,'CREDIT','SILVER','CLUB',v_sa.id,v_net);
  end if;
  if v_fee>0 then
    insert into public.ledger_entry(transaction_id,direction,currency,scope,universe_account_id,amount)
    values(v_tx.id,'CREDIT','SILVER','UNIVERSE',v_ua.id,v_fee);
  end if;

  update public.club_currency_account set balance=balance-v_gross,updated_at=now() where id=v_ba.id;
  update public.club_currency_account set balance=balance+v_net,updated_at=now() where id=v_sa.id;
  update public.universe_currency_account set balance=balance+v_fee,updated_at=now() where id=v_ua.id;

  update public.player_contract
  set status='TRANSFERRED',updated_at=now()
  where universe_player_id=v_l.universe_player_id and status='ACTIVE';

  update public.universe_player
  set owner_club_id=v_buyer.id,status='ACTIVE',acquired_at=now(),updated_at=now()
  where id=v_l.universe_player_id;

  select public.service_ensure_transfer_contract(v_l.universe_player_id,v_buyer.id,'MARKET_DIRECT',v_l.id)
  into v_contract_id;

  update public.market_listing set status='SOLD',updated_at=now() where id=v_l.id;

  update public.ledger_transaction
  set metadata=jsonb_build_object('receipt',jsonb_build_object(
    'listingId',v_l.id,
    'universePlayerId',v_l.universe_player_id,
    'sellerClubId',v_l.seller_club_id,
    'buyerClubId',v_buyer.id,
    'grossAmount',v_gross,
    'feeAmount',v_fee,
    'sellerNetAmount',v_net,
    'ledgerTransactionId',v_tx.id,
    'buyerContractId',v_contract_id
  ))
  where id=v_tx.id;

  return (select metadata->'receipt' from public.ledger_transaction where id=v_tx.id);
end;
$$;
revoke all on function public.buy_direct_market_listing(uuid,text) from public,anon;
grant execute on function public.buy_direct_market_listing(uuid,text) to authenticated;

-- Manual auction settlement follows the same lifecycle and no longer rolls back the
-- EXPIRED transition when an auction has no bids.
create or replace function public.settle_auction(p_listing_id uuid,p_idempotency_key text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_l public.market_listing;
  v_e public.auction_escrow;
  v_u public.universe;
  v_sa public.club_currency_account;
  v_ua public.universe_currency_account;
  v_tx public.ledger_transaction;
  v_fee bigint;
  v_net bigint;
  v_contract_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if nullif(trim(coalesce(p_idempotency_key,'')),'') is null then raise exception 'idempotency_key_required'; end if;

  select * into v_tx from public.ledger_transaction where idempotency_key=p_idempotency_key;
  if found then return v_tx.metadata->'receipt'; end if;

  select * into v_l from public.market_listing where id=p_listing_id for update;
  if not found or v_l.status<>'ACTIVE' or v_l.listing_type<>'AUCTION' then raise exception 'auction_not_settleable'; end if;
  if v_l.ends_at>now() then raise exception 'auction_still_open'; end if;

  select * into v_e from public.auction_escrow where listing_id=v_l.id and status='HELD' for update;
  if not found then
    update public.market_listing set status='EXPIRED',updated_at=now() where id=v_l.id;
    update public.universe_player
    set status=case when owner_club_id is null then 'AVAILABLE' else 'ACTIVE' end,updated_at=now()
    where id=v_l.universe_player_id and status='AUCTION';
    return jsonb_build_object('listingId',v_l.id,'status','EXPIRED','automatic',false);
  end if;

  select * into v_u from public.universe where id=v_l.universe_id;
  select * into v_sa from public.club_currency_account where club_id=v_l.seller_club_id and currency='SILVER' for update;
  if not found then raise exception 'seller_silver_account_not_found'; end if;
  insert into public.universe_currency_account(universe_id,currency,balance)
  values(v_l.universe_id,'SILVER',0)
  on conflict(universe_id,currency) do nothing;
  select * into v_ua from public.universe_currency_account where universe_id=v_l.universe_id and currency='SILVER' for update;

  v_fee:=floor(v_e.amount*v_u.auction_fee_pct/100.0);
  v_net:=v_e.amount-v_fee;

  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata)
  values('AUCTION_SETTLEMENT',p_idempotency_key,'MARKET_LISTING',v_l.id,'Auction settlement',auth.uid(),'{}'::jsonb)
  returning * into v_tx;

  insert into public.ledger_entry(transaction_id,direction,currency,scope,amount)
  values(v_tx.id,'DEBIT','SILVER','PLATFORM',v_e.amount);
  if v_net>0 then
    insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount)
    values(v_tx.id,'CREDIT','SILVER','CLUB',v_sa.id,v_net);
  end if;
  if v_fee>0 then
    insert into public.ledger_entry(transaction_id,direction,currency,scope,universe_account_id,amount)
    values(v_tx.id,'CREDIT','SILVER','UNIVERSE',v_ua.id,v_fee);
  end if;

  update public.club_currency_account set balance=balance+v_net,updated_at=now() where id=v_sa.id;
  update public.universe_currency_account set balance=balance+v_fee,updated_at=now() where id=v_ua.id;
  update public.auction_escrow set status='SETTLED',updated_at=now() where id=v_e.id;

  update public.player_contract
  set status='TRANSFERRED',updated_at=now()
  where universe_player_id=v_l.universe_player_id and status='ACTIVE';

  update public.universe_player
  set owner_club_id=v_e.bidder_club_id,status='ACTIVE',acquired_at=now(),updated_at=now()
  where id=v_l.universe_player_id;

  select public.service_ensure_transfer_contract(v_l.universe_player_id,v_e.bidder_club_id,'MARKET_AUCTION',v_l.id)
  into v_contract_id;

  update public.market_listing set status='SOLD',updated_at=now() where id=v_l.id;

  update public.ledger_transaction
  set metadata=jsonb_build_object('receipt',jsonb_build_object(
    'listingId',v_l.id,
    'universePlayerId',v_l.universe_player_id,
    'sellerClubId',v_l.seller_club_id,
    'buyerClubId',v_e.bidder_club_id,
    'grossAmount',v_e.amount,
    'feeAmount',v_fee,
    'sellerNetAmount',v_net,
    'ledgerTransactionId',v_tx.id,
    'buyerContractId',v_contract_id
  ))
  where id=v_tx.id;

  return (select metadata->'receipt' from public.ledger_transaction where id=v_tx.id);
end;
$$;
revoke all on function public.settle_auction(uuid,text) from public,anon;
grant execute on function public.settle_auction(uuid,text) to authenticated;

-- Worker settlement mirrors the interactive auction settlement and guarantees the contract.
create or replace function public.service_process_expired_auctions(p_limit integer default 200)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_l public.market_listing;
  v_e public.auction_escrow;
  v_u public.universe;
  v_sa public.club_currency_account;
  v_ua public.universe_currency_account;
  v_tx public.ledger_transaction;
  v_fee bigint;
  v_net bigint;
  v_contract_id uuid;
  v_settled integer:=0;
  v_expired integer:=0;
  v_failed integer:=0;
begin
  if p_limit<1 or p_limit>2000 then raise exception 'invalid_processing_limit'; end if;

  for v_l in
    select * from public.market_listing
    where status='ACTIVE' and listing_type='AUCTION' and ends_at is not null and ends_at<=now()
    order by ends_at asc
    for update skip locked
    limit p_limit
  loop
    begin
      select * into v_e from public.auction_escrow where listing_id=v_l.id and status='HELD' for update;
      if not found then
        update public.market_listing set status='EXPIRED',updated_at=now() where id=v_l.id;
        update public.universe_player
        set status=case when owner_club_id is null then 'AVAILABLE' else 'ACTIVE' end,updated_at=now()
        where id=v_l.universe_player_id and status='AUCTION';
        v_expired:=v_expired+1;
        continue;
      end if;

      select * into v_tx from public.ledger_transaction where idempotency_key=format('auction:auto:%s',v_l.id);
      if found then
        if v_l.status='ACTIVE' then update public.market_listing set status='SOLD',updated_at=now() where id=v_l.id; end if;
        perform public.service_ensure_transfer_contract(v_l.universe_player_id,v_e.bidder_club_id,'MARKET_AUCTION',v_l.id);
        v_settled:=v_settled+1;
        continue;
      end if;

      select * into v_u from public.universe where id=v_l.universe_id;
      select * into v_sa from public.club_currency_account where club_id=v_l.seller_club_id and currency='SILVER' for update;
      if not found then raise exception 'seller_silver_account_not_found'; end if;
      insert into public.universe_currency_account(universe_id,currency,balance)
      values(v_l.universe_id,'SILVER',0)
      on conflict(universe_id,currency) do nothing;
      select * into v_ua from public.universe_currency_account where universe_id=v_l.universe_id and currency='SILVER' for update;

      v_fee:=floor(v_e.amount*v_u.auction_fee_pct/100.0);
      v_net:=v_e.amount-v_fee;

      insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,metadata)
      values('AUCTION_SETTLEMENT',format('auction:auto:%s',v_l.id),'MARKET_LISTING',v_l.id,'Automatic auction settlement','{}'::jsonb)
      returning * into v_tx;

      insert into public.ledger_entry(transaction_id,direction,currency,scope,amount)
      values(v_tx.id,'DEBIT','SILVER','PLATFORM',v_e.amount);
      if v_net>0 then
        insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount)
        values(v_tx.id,'CREDIT','SILVER','CLUB',v_sa.id,v_net);
      end if;
      if v_fee>0 then
        insert into public.ledger_entry(transaction_id,direction,currency,scope,universe_account_id,amount)
        values(v_tx.id,'CREDIT','SILVER','UNIVERSE',v_ua.id,v_fee);
      end if;

      update public.club_currency_account set balance=balance+v_net,updated_at=now() where id=v_sa.id;
      update public.universe_currency_account set balance=balance+v_fee,updated_at=now() where id=v_ua.id;
      update public.auction_escrow set status='SETTLED',updated_at=now() where id=v_e.id;

      update public.player_contract
      set status='TRANSFERRED',updated_at=now()
      where universe_player_id=v_l.universe_player_id and status='ACTIVE';

      update public.universe_player
      set owner_club_id=v_e.bidder_club_id,status='ACTIVE',acquired_at=now(),updated_at=now()
      where id=v_l.universe_player_id;

      select public.service_ensure_transfer_contract(v_l.universe_player_id,v_e.bidder_club_id,'MARKET_AUCTION',v_l.id)
      into v_contract_id;

      update public.market_listing set status='SOLD',updated_at=now() where id=v_l.id;
      update public.ledger_transaction
      set metadata=jsonb_build_object('receipt',jsonb_build_object(
        'listingId',v_l.id,
        'universePlayerId',v_l.universe_player_id,
        'sellerClubId',v_l.seller_club_id,
        'buyerClubId',v_e.bidder_club_id,
        'grossAmount',v_e.amount,
        'feeAmount',v_fee,
        'sellerNetAmount',v_net,
        'ledgerTransactionId',v_tx.id,
        'buyerContractId',v_contract_id,
        'automatic',true
      ))
      where id=v_tx.id;
      v_settled:=v_settled+1;
    exception when others then
      v_failed:=v_failed+1;
      raise warning 'auction processing failed for %: %',v_l.id,sqlerrm;
    end;
  end loop;

  return jsonb_build_object('settled',v_settled,'expired',v_expired,'failed',v_failed);
end;
$$;
revoke all on function public.service_process_expired_auctions(integer) from public,anon,authenticated;
grant execute on function public.service_process_expired_auctions(integer) to service_role;

-- Durable evidence registration. Storage upload happens first, then this RPC verifies that
-- the object really exists and binds it to the match/user in the relational domain.
create or replace function public.register_match_evidence(
  p_match_id uuid,
  p_file_path text,
  p_metadata jsonb default '{}'::jsonb
)
returns public.match_evidence
language plpgsql
security definer
set search_path=public,storage
as $$
declare
  v_match public.match;
  v_evidence public.match_evidence;
  v_storage_metadata jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if nullif(trim(coalesce(p_file_path,'')),'') is null then raise exception 'file_path_required'; end if;
  if length(p_file_path)>500 or position('..' in p_file_path)>0 then raise exception 'invalid_file_path'; end if;

  select * into v_match from public.match where id=p_match_id;
  if not found then raise exception 'match_not_found'; end if;
  if v_match.state in ('SCHEDULED','CANCELLED') then raise exception 'match_not_accepting_evidence'; end if;
  if not exists(
    select 1 from public.club c
    where c.user_id=auth.uid() and c.id in (v_match.home_club_id,v_match.away_club_id)
  ) then raise exception 'not_match_participant'; end if;

  if p_file_path not like p_match_id::text||'/'||auth.uid()::text||'-%' then
    raise exception 'evidence_path_not_owned';
  end if;

  select metadata into v_storage_metadata
  from storage.objects
  where bucket_id='match-evidence' and name=p_file_path;
  if not found then raise exception 'evidence_object_not_found'; end if;

  insert into public.match_evidence(match_id,uploaded_by,file_path,metadata)
  values(
    p_match_id,
    auth.uid(),
    p_file_path,
    coalesce(p_metadata,'{}'::jsonb)||jsonb_build_object('storage',coalesce(v_storage_metadata,'{}'::jsonb))
  )
  on conflict(match_id,file_path) do update
  set metadata=public.match_evidence.metadata||excluded.metadata
  returning * into v_evidence;

  return v_evidence;
end;
$$;
revoke all on function public.register_match_evidence(uuid,text,jsonb) from public,anon;
grant execute on function public.register_match_evidence(uuid,text,jsonb) to authenticated;

-- Evidence metadata is RPC-only for writes. Participants retain read access through the
-- RLS policy introduced in 00340.
revoke insert,update,delete on public.match_evidence from authenticated;
grant select on public.match_evidence to authenticated;

-- Participants can read evidence objects. They can only delete their own newly-uploaded
-- orphan object if no relational evidence row has been registered yet.
drop policy if exists match_evidence_participant_read_storage on storage.objects;
create policy match_evidence_participant_read_storage
on storage.objects for select to authenticated
using (
  bucket_id='match-evidence'
  and exists(
    select 1
    from public.match mt
    join public.club c on c.id in (mt.home_club_id,mt.away_club_id)
    where mt.id::text=(storage.foldername(name))[1]
      and c.user_id=auth.uid()
  )
);

drop policy if exists match_evidence_orphan_cleanup on storage.objects;
create policy match_evidence_orphan_cleanup
on storage.objects for delete to authenticated
using (
  bucket_id='match-evidence'
  and name like (storage.foldername(name))[1]||'/'||auth.uid()::text||'-%'
  and not exists(select 1 from public.match_evidence me where me.file_path=name)
);
