-- Clã das Sombras — competition registration readiness and idempotent registration
-- Adds a player-safe preflight and keeps registration enforcement atomic in PostgreSQL.

create or replace function public.competition_registration_readiness(p_competition_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path=public
as $$
declare
  v_comp public.competition;
  v_club public.club;
  v_reg public.competition_registration;
  v_eligibility jsonb;
  v_silver bigint:=0;
  v_frozen boolean:=false;
  v_ready boolean:=false;
  v_reason text:=null;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  select * into v_comp from public.competition where id=p_competition_id;
  if not found then raise exception 'competition_not_found'; end if;

  select * into v_club
  from public.club
  where universe_id=v_comp.universe_id and user_id=auth.uid()
  limit 1;

  if not found then
    return jsonb_build_object(
      'competition_id',v_comp.id,
      'universe_id',v_comp.universe_id,
      'competition_status',v_comp.status,
      'registration_open',v_comp.status in ('DRAFT','REGISTRATION','OPEN'),
      'entry_fee',v_comp.entry_fee,
      'silver_balance',0,
      'silver_sufficient',v_comp.entry_fee=0,
      'club_id',null,
      'registration_state',null,
      'eligible_players',0,
      'min_squad_size',0,
      'missing_players',0,
      'roster_eligible',false,
      'economic_frozen',false,
      'ready',false,
      'reason','club_required_in_universe'
    );
  end if;

  select * into v_reg
  from public.competition_registration
  where competition_id=v_comp.id and club_id=v_club.id
  limit 1;

  select coalesce(balance,0) into v_silver
  from public.club_currency_account
  where club_id=v_club.id and currency='SILVER';
  v_silver:=coalesce(v_silver,0);

  v_eligibility:=public.club_competitive_eligibility(v_club.id);

  select exists(
    select 1 from public.economic_freeze f
    where f.active and (
      (f.scope='USER' and f.user_id=auth.uid()) or
      (f.scope='CLUB' and f.club_id=v_club.id) or
      (f.scope='UNIVERSE' and f.universe_id=v_comp.universe_id)
    )
  ) into v_frozen;

  if v_reg.id is not null and v_reg.state in ('REGISTERED','APPROVED') then
    v_reason:='already_registered';
  elsif v_comp.status not in ('DRAFT','REGISTRATION','OPEN') then
    v_reason:='registration_closed';
  elsif coalesce((v_eligibility->>'eligible')::boolean,false)=false then
    v_reason:='competitive_roster_ineligible';
  elsif v_frozen then
    v_reason:='economic_scope_frozen';
  elsif v_silver<v_comp.entry_fee then
    v_reason:='insufficient_silver';
  else
    v_ready:=true;
  end if;

  return jsonb_build_object(
    'competition_id',v_comp.id,
    'universe_id',v_comp.universe_id,
    'competition_status',v_comp.status,
    'registration_open',v_comp.status in ('DRAFT','REGISTRATION','OPEN'),
    'entry_fee',v_comp.entry_fee,
    'silver_balance',v_silver,
    'silver_sufficient',v_silver>=v_comp.entry_fee,
    'club_id',v_club.id,
    'registration_state',v_reg.state,
    'eligible_players',coalesce((v_eligibility->>'eligible_players')::integer,0),
    'min_squad_size',coalesce((v_eligibility->>'min_squad_size')::integer,0),
    'missing_players',coalesce((v_eligibility->>'missing_players')::integer,0),
    'roster_eligible',coalesce((v_eligibility->>'eligible')::boolean,false),
    'economic_frozen',v_frozen,
    'ready',v_ready,
    'reason',v_reason
  );
end;
$$;
revoke all on function public.competition_registration_readiness(uuid) from public,anon;
grant execute on function public.competition_registration_readiness(uuid) to authenticated;

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
  if p_idempotency_key is null or length(trim(p_idempotency_key))<3 then raise exception 'idempotency_key_required'; end if;

  -- An idempotency key may only replay the caller's own registration.
  select r.* into v_reg
  from public.competition_registration r
  join public.club c on c.id=r.club_id
  where r.idempotency_key=p_idempotency_key and c.user_id=auth.uid()
  limit 1;
  if found then return v_reg; end if;
  if exists(select 1 from public.competition_registration where idempotency_key=p_idempotency_key) then
    raise exception 'idempotency_key_conflict';
  end if;

  select * into v_comp from public.competition where id=p_competition_id for update;
  if not found then raise exception 'competition_not_found'; end if;
  if v_comp.status not in ('DRAFT','REGISTRATION','OPEN') then raise exception 'registration_closed'; end if;

  select * into v_club
  from public.club
  where universe_id=v_comp.universe_id and user_id=auth.uid()
  for update;
  if not found then raise exception 'club_required_in_universe'; end if;

  -- Repeated clicks/retries are idempotent even when the browser generated a new key.
  select * into v_reg
  from public.competition_registration
  where competition_id=p_competition_id and club_id=v_club.id and state in ('REGISTERED','APPROVED')
  limit 1;
  if found then return v_reg; end if;

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
