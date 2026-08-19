-- Clã das Sombras — anti-pay-to-win Gold financing guard
-- Apply after 00470_gold_package_catalog.sql.
--
-- Gold remains a global manager balance, but Silver injection is constrained by a
-- server-side weekly budget. The club row lock makes the accumulated limit atomic,
-- so splitting one conversion into many requests cannot bypass it.

do $$
declare
  v_target jsonb := jsonb_build_object(
    'enabled',true,
    'silver_per_gold',100,
    'min_gold',1,
    'max_gold_per_operation',250,
    'max_gold_per_club_per_cycle',250
  );
  v_current public.platform_config;
begin
  select * into v_current
  from public.platform_config
  where key='economy.gold_to_silver'
  for update;

  if not found then
    insert into public.platform_config(key,category,value,version,effective_from,updated_at)
    values('economy.gold_to_silver','ECONOMY',v_target,1,now(),now());
  elsif v_current.value is distinct from v_target then
    insert into public.platform_config_history(
      key,category,value,version,effective_from,changed_by,reason
    ) values(
      v_current.key,v_current.category,v_current.value,v_current.version,
      v_current.effective_from,null,'Introduce weekly anti-pay-to-win Gold financing limit'
    ) on conflict(key,version) do nothing;

    update public.platform_config
    set category='ECONOMY',value=v_target,version=v_current.version+1,
        effective_from=now(),updated_by=null,updated_at=now()
    where key='economy.gold_to_silver';

    insert into public.admin_audit_log(
      actor_user_id,action,target_type,target_id,old_state,new_state,reason
    ) values(
      null,'CONFIG_UPDATED','PLATFORM_CONFIG','economy.gold_to_silver',
      to_jsonb(v_current),
      jsonb_build_object('key','economy.gold_to_silver','value',v_target,'version',v_current.version+1),
      'Introduce weekly anti-pay-to-win Gold financing limit'
    );
  end if;
end;
$$;

alter table public.club_financing_operation
  add column if not exists cycle_key text;
alter table public.club_financing_operation
  add column if not exists cycle_gold_limit bigint;

update public.club_financing_operation
set cycle_key=to_char(created_at at time zone 'UTC','IYYY-"W"IW')
where cycle_key is null;

alter table public.club_financing_operation
  alter column cycle_key set not null;

create index if not exists club_financing_operation_cycle_idx
  on public.club_financing_operation(club_id,cycle_key);

create or replace function public.get_gold_financing_status(p_club_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_club public.club;
  v_universe public.universe;
  v_config jsonb;
  v_enabled boolean;
  v_rate bigint;
  v_operation_limit bigint;
  v_platform_cycle_limit bigint;
  v_universe_cycle_limit bigint;
  v_effective_cycle_limit bigint;
  v_spent bigint;
  v_remaining bigint;
  v_cycle_start timestamptz;
  v_cycle_end timestamptz;
  v_cycle_key text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  select * into v_club
  from public.club
  where id=p_club_id;
  if not found then raise exception 'club_not_found'; end if;
  if v_club.user_id<>auth.uid() then raise exception 'club_not_owned'; end if;

  select * into v_universe
  from public.universe
  where id=v_club.universe_id;

  select value into v_config
  from public.platform_config
  where key='economy.gold_to_silver';
  v_config:=coalesce(v_config,'{}'::jsonb);

  v_enabled:=coalesce((v_config->>'enabled')::boolean,false)
    and v_universe.financing_policy<>'DISABLED';
  -- These hard ceilings are deliberate fail-safes. Runtime configuration may make
  -- financing stricter, but an accidental admin edit cannot silently make it looser.
  v_rate:=least(100,greatest(1,coalesce((v_config->>'silver_per_gold')::bigint,100)));
  v_operation_limit:=least(250,greatest(1,coalesce((v_config->>'max_gold_per_operation')::bigint,250)));
  v_platform_cycle_limit:=least(250,greatest(0,coalesce((v_config->>'max_gold_per_club_per_cycle')::bigint,250)));

  -- LIMITED universes additionally honour their configured external-financing
  -- percentage. In the main universe this is 50% of the 25,000 starting treasury.
  if v_universe.financing_policy='LIMITED' then
    v_universe_cycle_limit:=greatest(0,floor(
      v_universe.starting_silver
      * v_universe.external_financing_limit_pct / 100.0
      / v_rate
    )::bigint);
    v_effective_cycle_limit:=least(v_platform_cycle_limit,v_universe_cycle_limit);
  else
    v_universe_cycle_limit:=v_platform_cycle_limit;
    v_effective_cycle_limit:=v_platform_cycle_limit;
  end if;

  v_cycle_start:=date_trunc('week',now() at time zone 'UTC') at time zone 'UTC';
  v_cycle_end:=v_cycle_start+interval '7 days';
  v_cycle_key:=to_char(v_cycle_start at time zone 'UTC','IYYY-"W"IW');

  select coalesce(sum(gold_spent),0) into v_spent
  from public.club_financing_operation
  where club_id=p_club_id and cycle_key=v_cycle_key;
  v_remaining:=greatest(0,v_effective_cycle_limit-v_spent);

  return jsonb_build_object(
    'enabled',v_enabled,
    'financingPolicy',v_universe.financing_policy,
    'silverPerGold',v_rate,
    'maxGoldPerOperation',least(v_operation_limit,v_effective_cycle_limit),
    'maxGoldPerCycle',v_effective_cycle_limit,
    'spentGoldThisCycle',v_spent,
    'remainingGoldThisCycle',case when v_enabled then v_remaining else 0 end,
    'maxSilverPerCycle',v_effective_cycle_limit*v_rate,
    'remainingSilverThisCycle',case when v_enabled then v_remaining*v_rate else 0 end,
    'cycleKey',v_cycle_key,
    'resetsAt',v_cycle_end
  );
end;
$$;

revoke all on function public.get_gold_financing_status(uuid) from public,anon;
grant execute on function public.get_gold_financing_status(uuid) to authenticated;

create or replace function public.finance_club_with_gold(
  p_club_id uuid,
  p_gold_amount bigint,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_club public.club;
  v_config jsonb;
  v_status jsonb;
  v_rate bigint;
  v_min_gold bigint;
  v_operation_limit bigint;
  v_cycle_limit bigint;
  v_cycle_spent bigint;
  v_cycle_remaining bigint;
  v_cycle_key text;
  v_user_account public.user_currency_account;
  v_club_account public.club_currency_account;
  v_tx public.ledger_transaction;
  v_existing public.club_financing_operation;
  v_silver bigint;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_gold_amount<=0 then raise exception 'amount_must_be_positive'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key))<8 then
    raise exception 'idempotency_key_required';
  end if;

  select * into v_existing
  from public.club_financing_operation
  where idempotency_key=trim(p_idempotency_key);
  if found then
    if v_existing.user_id<>auth.uid() or v_existing.club_id<>p_club_id then
      raise exception 'idempotency_key_conflict';
    end if;
    v_status:=public.get_gold_financing_status(p_club_id);
    return jsonb_build_object(
      'user_id',v_existing.user_id,
      'club_id',v_existing.club_id,
      'gold_spent',v_existing.gold_spent,
      'silver_credited',v_existing.silver_credited,
      'transaction_id',v_existing.ledger_transaction_id,
      'cycle_key',v_status->>'cycleKey',
      'cycle_gold_limit',(v_status->>'maxGoldPerCycle')::bigint,
      'cycle_gold_spent',(v_status->>'spentGoldThisCycle')::bigint,
      'cycle_gold_remaining',(v_status->>'remainingGoldThisCycle')::bigint
    );
  end if;

  -- This lock serialises all financing requests for the same club. The cumulative
  -- weekly sum below therefore cannot be raced by concurrent requests.
  select * into v_club
  from public.club
  where id=p_club_id
  for update;
  if not found then raise exception 'club_not_found'; end if;
  if v_club.user_id<>auth.uid() then raise exception 'club_not_owned'; end if;

  if exists(
    select 1 from public.economic_freeze f
    where f.active and (
      (f.scope='USER' and f.user_id=auth.uid())
      or (f.scope='CLUB' and f.club_id=p_club_id)
      or (f.scope='UNIVERSE' and f.universe_id=v_club.universe_id)
    )
  ) then raise exception 'economic_scope_frozen'; end if;

  v_status:=public.get_gold_financing_status(p_club_id);
  if coalesce((v_status->>'enabled')::boolean,false)=false then
    raise exception 'gold_financing_disabled';
  end if;

  select value into v_config
  from public.platform_config
  where key='economy.gold_to_silver';
  v_config:=coalesce(v_config,'{}'::jsonb);
  v_rate:=(v_status->>'silverPerGold')::bigint;
  v_min_gold:=greatest(1,coalesce((v_config->>'min_gold')::bigint,1));
  v_operation_limit:=(v_status->>'maxGoldPerOperation')::bigint;
  v_cycle_limit:=(v_status->>'maxGoldPerCycle')::bigint;
  v_cycle_spent:=(v_status->>'spentGoldThisCycle')::bigint;
  v_cycle_remaining:=(v_status->>'remainingGoldThisCycle')::bigint;
  v_cycle_key:=v_status->>'cycleKey';

  if p_gold_amount<v_min_gold then raise exception 'financing_minimum_not_met'; end if;
  if p_gold_amount>v_operation_limit then raise exception 'financing_operation_limit_exceeded'; end if;
  if p_gold_amount>v_cycle_remaining then raise exception 'financing_cycle_limit_exceeded'; end if;
  v_silver:=p_gold_amount*v_rate;

  select * into v_user_account
  from public.user_currency_account
  where user_id=auth.uid() and currency='GOLD'
  for update;
  if not found or v_user_account.balance<p_gold_amount then raise exception 'insufficient_gold'; end if;

  select * into v_club_account
  from public.club_currency_account
  where club_id=p_club_id and currency='SILVER'
  for update;
  if not found then raise exception 'club_silver_account_not_found'; end if;

  insert into public.ledger_transaction(
    transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata
  ) values(
    'GOLD_TO_SILVER_FINANCING',trim(p_idempotency_key),'CLUB',p_club_id,
    'User financed club with Gold',auth.uid(),
    jsonb_build_object(
      'gold_amount',p_gold_amount,
      'silver_amount',v_silver,
      'exchange_rate',v_rate,
      'universe_id',v_club.universe_id,
      'cycle_key',v_cycle_key,
      'cycle_gold_limit',v_cycle_limit
    )
  ) returning * into v_tx;

  insert into public.ledger_entry(transaction_id,direction,currency,scope,user_account_id,amount)
  values(v_tx.id,'DEBIT','GOLD','USER',v_user_account.id,p_gold_amount);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,amount)
  values(v_tx.id,'CREDIT','GOLD','PLATFORM',p_gold_amount);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,amount)
  values(v_tx.id,'DEBIT','SILVER','PLATFORM',v_silver);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount)
  values(v_tx.id,'CREDIT','SILVER','CLUB',v_club_account.id,v_silver);

  update public.user_currency_account
  set balance=balance-p_gold_amount,updated_at=now()
  where id=v_user_account.id;
  update public.club_currency_account
  set balance=balance+v_silver,updated_at=now()
  where id=v_club_account.id;

  insert into public.club_financing_operation(
    user_id,club_id,universe_id,gold_spent,silver_credited,exchange_rate,
    ledger_transaction_id,idempotency_key,cycle_key,cycle_gold_limit
  ) values(
    auth.uid(),p_club_id,v_club.universe_id,p_gold_amount,v_silver,v_rate,
    v_tx.id,trim(p_idempotency_key),v_cycle_key,v_cycle_limit
  );

  return jsonb_build_object(
    'user_id',auth.uid(),
    'club_id',p_club_id,
    'gold_spent',p_gold_amount,
    'silver_credited',v_silver,
    'transaction_id',v_tx.id,
    'cycle_key',v_cycle_key,
    'cycle_gold_limit',v_cycle_limit,
    'cycle_gold_spent',v_cycle_spent+p_gold_amount,
    'cycle_gold_remaining',v_cycle_limit-v_cycle_spent-p_gold_amount
  );
end;
$$;

revoke all on function public.finance_club_with_gold(uuid,bigint,text) from public,anon;
grant execute on function public.finance_club_with_gold(uuid,bigint,text) to authenticated;

comment on function public.get_gold_financing_status(uuid) is
  'Returns the authenticated manager club weekly Gold financing budget and usage.';
comment on function public.finance_club_with_gold(uuid,bigint,text) is
  'Atomically converts Gold to Silver within the club weekly financing budget.';
