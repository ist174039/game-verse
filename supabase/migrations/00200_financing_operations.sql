-- Clã das Sombras — monetisation and controlled club financing

insert into public.platform_config(key,category,value,version)
values
  ('economy.gold_to_silver','ECONOMY',jsonb_build_object('enabled',true,'silver_per_gold',1000,'min_gold',1,'max_gold_per_operation',500),1),
  ('economy.loan_defaults','ECONOMY',jsonb_build_object('enabled',true,'interest_rate_pct',6.0,'min_principal',10000,'max_principal',500000,'installments',5),1),
  ('retention.daily_reward','RETENTION',jsonb_build_object('base_bronze',25,'streak_step',5,'max_streak_bonus_days',7),1)
on conflict(key) do nothing;

create table if not exists public.club_financing_operation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  club_id uuid not null references public.club(id) on delete restrict,
  universe_id uuid not null references public.universe(id) on delete restrict,
  gold_spent bigint not null check (gold_spent > 0),
  silver_credited bigint not null check (silver_credited > 0),
  exchange_rate bigint not null check (exchange_rate > 0),
  ledger_transaction_id uuid not null references public.ledger_transaction(id) on delete restrict,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create or replace function public.finance_club_with_gold(
  p_club_id uuid,
  p_gold_amount bigint,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club public.club;
  v_universe public.universe;
  v_config jsonb;
  v_rate bigint;
  v_max_gold bigint;
  v_user_account public.user_currency_account;
  v_club_account public.club_currency_account;
  v_tx public.ledger_transaction;
  v_existing public.club_financing_operation;
  v_silver bigint;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_gold_amount <= 0 then raise exception 'amount_must_be_positive'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 3 then raise exception 'idempotency_key_required'; end if;

  select * into v_existing from public.club_financing_operation where idempotency_key=p_idempotency_key;
  if found then return jsonb_build_object('user_id',v_existing.user_id,'club_id',v_existing.club_id,'gold_spent',v_existing.gold_spent,'silver_credited',v_existing.silver_credited,'transaction_id',v_existing.ledger_transaction_id); end if;

  select * into v_club from public.club where id=p_club_id for update;
  if not found then raise exception 'club_not_found'; end if;
  if v_club.user_id <> auth.uid() then raise exception 'club_not_owned'; end if;
  select * into v_universe from public.universe where id=v_club.universe_id for update;
  if v_universe.financing_policy='DISABLED' then raise exception 'financing_disabled_in_universe'; end if;

  if exists(select 1 from public.economic_freeze f where f.active and ((f.scope='USER' and f.user_id=auth.uid()) or (f.scope='CLUB' and f.club_id=p_club_id) or (f.scope='UNIVERSE' and f.universe_id=v_club.universe_id))) then raise exception 'economic_scope_frozen'; end if;

  select value into v_config from public.platform_config where key='economy.gold_to_silver';
  if coalesce((v_config->>'enabled')::boolean,false)=false then raise exception 'gold_financing_disabled'; end if;
  v_rate := coalesce((v_config->>'silver_per_gold')::bigint,1000);
  v_max_gold := coalesce((v_config->>'max_gold_per_operation')::bigint,500);
  if p_gold_amount > v_max_gold then raise exception 'financing_operation_limit_exceeded'; end if;
  v_silver := p_gold_amount * v_rate;

  select * into v_user_account from public.user_currency_account where user_id=auth.uid() and currency='GOLD' for update;
  if not found or v_user_account.balance < p_gold_amount then raise exception 'insufficient_gold'; end if;
  select * into v_club_account from public.club_currency_account where club_id=p_club_id and currency='SILVER' for update;
  if not found then raise exception 'club_silver_account_not_found'; end if;

  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata)
  values('GOLD_TO_SILVER_FINANCING',p_idempotency_key,'CLUB',p_club_id,'User financed club with Gold',auth.uid(),jsonb_build_object('gold_amount',p_gold_amount,'silver_amount',v_silver,'exchange_rate',v_rate,'universe_id',v_club.universe_id))
  returning * into v_tx;

  insert into public.ledger_entry(transaction_id,direction,currency,scope,user_account_id,amount) values(v_tx.id,'DEBIT','GOLD','USER',v_user_account.id,p_gold_amount);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,amount) values(v_tx.id,'CREDIT','GOLD','PLATFORM',p_gold_amount);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,amount) values(v_tx.id,'DEBIT','SILVER','PLATFORM',v_silver);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_tx.id,'CREDIT','SILVER','CLUB',v_club_account.id,v_silver);

  update public.user_currency_account set balance=balance-p_gold_amount,updated_at=now() where id=v_user_account.id;
  update public.club_currency_account set balance=balance+v_silver,updated_at=now() where id=v_club_account.id;

  insert into public.club_financing_operation(user_id,club_id,universe_id,gold_spent,silver_credited,exchange_rate,ledger_transaction_id,idempotency_key)
  values(auth.uid(),p_club_id,v_club.universe_id,p_gold_amount,v_silver,v_rate,v_tx.id,p_idempotency_key);

  return jsonb_build_object('user_id',auth.uid(),'club_id',p_club_id,'gold_spent',p_gold_amount,'silver_credited',v_silver,'transaction_id',v_tx.id);
end;
$$;

revoke all on function public.finance_club_with_gold(uuid,bigint,text) from public;
grant execute on function public.finance_club_with_gold(uuid,bigint,text) to authenticated;

create or replace function public.originate_club_loan(
  p_club_id uuid,
  p_principal bigint,
  p_idempotency_key text
)
returns public.club_loan
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club public.club;
  v_universe public.universe;
  v_account public.club_currency_account;
  v_config jsonb;
  v_rate numeric;
  v_installments integer;
  v_loan public.club_loan;
  v_tx public.ledger_transaction;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_club from public.club where id=p_club_id for update;
  if not found or v_club.user_id<>auth.uid() then raise exception 'club_not_owned'; end if;
  select * into v_universe from public.universe where id=v_club.universe_id;
  if v_universe.financing_policy not in ('STANDARD','OPEN') then raise exception 'loan_not_allowed_by_universe'; end if;
  if exists(select 1 from public.club_loan where club_id=p_club_id and state='ACTIVE') then raise exception 'active_loan_already_exists'; end if;
  if exists(select 1 from public.economic_freeze f where f.active and ((f.scope='USER' and f.user_id=auth.uid()) or (f.scope='CLUB' and f.club_id=p_club_id) or (f.scope='UNIVERSE' and f.universe_id=v_club.universe_id))) then raise exception 'economic_scope_frozen'; end if;

  select value into v_config from public.platform_config where key='economy.loan_defaults';
  if coalesce((v_config->>'enabled')::boolean,false)=false then raise exception 'loans_disabled'; end if;
  if p_principal < coalesce((v_config->>'min_principal')::bigint,10000) or p_principal > coalesce((v_config->>'max_principal')::bigint,500000) then raise exception 'loan_amount_outside_limits'; end if;
  v_rate := coalesce((v_config->>'interest_rate_pct')::numeric,6.0);
  v_installments := coalesce((v_config->>'installments')::integer,5);

  select * into v_account from public.club_currency_account where club_id=p_club_id and currency='SILVER' for update;
  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata)
  values('CLUB_LOAN_ORIGINATION',p_idempotency_key,'CLUB',p_club_id,'Platform loan origination',auth.uid(),jsonb_build_object('principal',p_principal,'interest_rate_pct',v_rate,'installments',v_installments)) returning * into v_tx;
  insert into public.ledger_entry(transaction_id,direction,currency,scope,amount) values(v_tx.id,'DEBIT','SILVER','PLATFORM',p_principal);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_tx.id,'CREDIT','SILVER','CLUB',v_account.id,p_principal);
  update public.club_currency_account set balance=balance+p_principal,updated_at=now() where id=v_account.id;

  insert into public.club_loan(universe_id,club_id,principal,outstanding_principal,interest_rate_pct,installments,installments_paid,state,next_payment_at)
  values(v_club.universe_id,p_club_id,p_principal,p_principal,v_rate,v_installments,0,'ACTIVE',now()+interval '7 days') returning * into v_loan;
  return v_loan;
end;
$$;

revoke all on function public.originate_club_loan(uuid,bigint,text) from public;
grant execute on function public.originate_club_loan(uuid,bigint,text) to authenticated;

alter table public.club_financing_operation enable row level security;
create policy club_financing_own_read on public.club_financing_operation for select to authenticated using (user_id=auth.uid());
