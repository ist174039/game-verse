-- Clã das Sombras — direct platform catalogue purchases
-- Apply after 00440_admin_identity_bootstrap.sql.
--
-- Provider imports are materialised as AVAILABLE universe assets. This command makes
-- those assets purchasable without first requiring a club-owned market listing.

create index if not exists universe_player_platform_market_idx
  on public.universe_player(universe_id,platform_price desc,id)
  where owner_club_id is null and status='AVAILABLE' and platform_price>0;

create or replace function public.buy_platform_player(
  p_universe_player_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_asset public.universe_player;
  v_buyer public.club;
  v_buyer_account public.club_currency_account;
  v_universe_account public.universe_currency_account;
  v_tx public.ledger_transaction;
  v_price bigint;
  v_contract_id uuid;
  v_receipt jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key))<8 then
    raise exception 'idempotency_key_required';
  end if;

  select * into v_tx
  from public.ledger_transaction
  where idempotency_key=trim(p_idempotency_key);
  if found then
    if v_tx.transaction_type<>'PLATFORM_PLAYER_PURCHASE'
       or v_tx.created_by is distinct from auth.uid()
       or v_tx.reference_id is distinct from p_universe_player_id then
      raise exception 'idempotency_key_conflict';
    end if;
    return v_tx.metadata->'receipt';
  end if;

  select * into v_asset
  from public.universe_player
  where id=p_universe_player_id
  for update;
  if not found or v_asset.owner_club_id is not null or v_asset.status<>'AVAILABLE' then
    raise exception 'platform_player_not_available';
  end if;

  select * into v_buyer
  from public.club
  where universe_id=v_asset.universe_id and user_id=auth.uid()
  for update;
  if not found then raise exception 'buyer_club_required'; end if;

  if exists(
    select 1 from public.economic_freeze f
    where f.active and (
      (f.scope='USER' and f.user_id=auth.uid())
      or (f.scope='CLUB' and f.club_id=v_buyer.id)
      or (f.scope='UNIVERSE' and f.universe_id=v_buyer.universe_id)
    )
  ) then raise exception 'economic_scope_frozen'; end if;

  select * into v_buyer_account
  from public.club_currency_account
  where club_id=v_buyer.id and currency='SILVER'
  for update;
  if not found then raise exception 'buyer_silver_account_not_found'; end if;

  insert into public.universe_currency_account(universe_id,currency,balance)
  values(v_asset.universe_id,'SILVER',0)
  on conflict(universe_id,currency) do nothing;
  select * into v_universe_account
  from public.universe_currency_account
  where universe_id=v_asset.universe_id and currency='SILVER'
  for update;

  v_price:=v_asset.platform_price;
  if v_price is null or v_price<=0 then raise exception 'invalid_platform_price'; end if;
  if v_buyer_account.balance<v_price then raise exception 'insufficient_silver'; end if;

  insert into public.ledger_transaction(
    transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata
  ) values(
    'PLATFORM_PLAYER_PURCHASE',trim(p_idempotency_key),'UNIVERSE_PLAYER',v_asset.id,
    'Platform player purchase',auth.uid(),'{}'::jsonb
  ) returning * into v_tx;

  insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount)
  values(v_tx.id,'DEBIT','SILVER','CLUB',v_buyer_account.id,v_price);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,universe_account_id,amount)
  values(v_tx.id,'CREDIT','SILVER','UNIVERSE',v_universe_account.id,v_price);

  update public.club_currency_account
  set balance=balance-v_price,updated_at=now()
  where id=v_buyer_account.id;
  update public.universe_currency_account
  set balance=balance+v_price,updated_at=now()
  where id=v_universe_account.id;

  update public.universe_player
  set owner_club_id=v_buyer.id,status='OWNED',acquired_at=now(),updated_at=now()
  where id=v_asset.id;

  select public.service_ensure_transfer_contract(v_asset.id,v_buyer.id,'PLATFORM_MARKET',v_tx.id)
  into v_contract_id;

  v_receipt:=jsonb_build_object(
    'universePlayerId',v_asset.id,
    'buyerClubId',v_buyer.id,
    'grossAmount',v_price,
    'ledgerTransactionId',v_tx.id,
    'buyerContractId',v_contract_id
  );

  update public.ledger_transaction
  set metadata=jsonb_build_object(
    'receipt',v_receipt,
    'source','PLATFORM_CATALOGUE',
    'universe_id',v_asset.universe_id
  )
  where id=v_tx.id;

  return v_receipt;
end;
$$;

revoke all on function public.buy_platform_player(uuid,text) from public,anon;
grant execute on function public.buy_platform_player(uuid,text) to authenticated;

comment on function public.buy_platform_player(uuid,text) is
  'Atomically buys an unowned AVAILABLE universe player at platform_price, settles Silver and creates the buyer contract.';
