-- Clã das Sombras — automatic auction settlement runtime
-- Apply after 00281_competition_runtime.sql.

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
        update public.universe_player set status=case when owner_club_id is null then 'AVAILABLE' else 'ACTIVE' end,updated_at=now()
        where id=v_l.universe_player_id and status='AUCTION';
        v_expired:=v_expired+1;
        continue;
      end if;

      select * into v_tx from public.ledger_transaction where idempotency_key=format('auction:auto:%s',v_l.id);
      if found then
        if v_l.status='ACTIVE' then update public.market_listing set status='SOLD',updated_at=now() where id=v_l.id; end if;
        v_settled:=v_settled+1;
        continue;
      end if;

      select * into v_u from public.universe where id=v_l.universe_id;
      select * into v_sa from public.club_currency_account where club_id=v_l.seller_club_id and currency='SILVER' for update;
      if not found then raise exception 'seller_silver_account_not_found'; end if;
      insert into public.universe_currency_account(universe_id,currency,balance) values(v_l.universe_id,'SILVER',0) on conflict(universe_id,currency) do nothing;
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
      update public.universe_player set owner_club_id=v_e.bidder_club_id,status='ACTIVE',acquired_at=now(),updated_at=now() where id=v_l.universe_player_id;
      update public.market_listing set status='SOLD',updated_at=now() where id=v_l.id;
      update public.player_contract set status='TRANSFERRED',updated_at=now() where universe_player_id=v_l.universe_player_id and status='ACTIVE';
      update public.ledger_transaction set metadata=jsonb_build_object('receipt',jsonb_build_object(
        'listingId',v_l.id,'universePlayerId',v_l.universe_player_id,'sellerClubId',v_l.seller_club_id,
        'buyerClubId',v_e.bidder_club_id,'grossAmount',v_e.amount,'feeAmount',v_fee,'sellerNetAmount',v_net,
        'ledgerTransactionId',v_tx.id,'automatic',true
      )) where id=v_tx.id;
      v_settled:=v_settled+1;
    exception when others then
      v_failed:=v_failed+1;
      raise warning 'auction processing failed for %: %',v_l.id,sqlerrm;
    end;
  end loop;
  return jsonb_build_object('settled',v_settled,'expired',v_expired,'failed',v_failed);
end;
$$;
revoke all on function public.service_process_expired_auctions(integer) from public;
grant execute on function public.service_process_expired_auctions(integer) to service_role;
