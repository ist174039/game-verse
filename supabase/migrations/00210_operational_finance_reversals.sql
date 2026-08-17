-- Clã das Sombras — operational finance, liabilities and auditable reversals

create table if not exists public.club_liability (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.club(id) on delete cascade,
  liability_type text not null check (liability_type in ('PAYROLL','MAINTENANCE','MATCH_COST','LOAN_INSTALLMENT','OTHER')),
  reference_type text,
  reference_id uuid,
  amount bigint not null check (amount > 0),
  outstanding_amount bigint not null check (outstanding_amount >= 0),
  state text not null default 'OPEN' check (state in ('OPEN','PARTIALLY_PAID','PAID','WAIVED')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.match_financial_event (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.match(id) on delete cascade,
  club_id uuid not null references public.club(id) on delete cascade,
  stadium_income bigint not null default 0 check (stadium_income >= 0),
  operating_cost bigint not null default 0 check (operating_cost >= 0),
  attendance integer check (attendance >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(match_id,club_id)
);

create table if not exists public.ledger_reversal (
  id uuid primary key default gen_random_uuid(),
  original_transaction_id uuid not null references public.ledger_transaction(id) on delete restrict,
  reversal_transaction_id uuid not null unique references public.ledger_transaction(id) on delete restrict,
  reason text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(original_transaction_id)
);

create or replace function public.service_reverse_ledger_transaction(
  p_transaction_id uuid,
  p_reason text,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_original public.ledger_transaction;
  v_existing public.ledger_reversal;
  v_reversal public.ledger_transaction;
  v_entry public.ledger_entry;
  v_balance bigint;
begin
  if p_reason is null or length(trim(p_reason)) < 5 then raise exception 'reversal_reason_required'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 3 then raise exception 'idempotency_key_required'; end if;

  select * into v_existing from public.ledger_reversal where original_transaction_id=p_transaction_id;
  if found then return v_existing.reversal_transaction_id; end if;

  select * into v_original from public.ledger_transaction where id=p_transaction_id for update;
  if not found then raise exception 'ledger_transaction_not_found'; end if;

  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,metadata)
  values('REVERSAL',p_idempotency_key,'LEDGER_TRANSACTION',p_transaction_id,trim(p_reason),jsonb_build_object('reverses_transaction_id',p_transaction_id))
  returning * into v_reversal;

  for v_entry in select * from public.ledger_entry where transaction_id=p_transaction_id order by id for update loop
    if v_entry.user_account_id is not null and v_entry.direction='CREDIT' then
      select balance into v_balance from public.user_currency_account where id=v_entry.user_account_id for update;
      if v_balance < v_entry.amount then raise exception 'insufficient_user_balance_for_reversal'; end if;
      update public.user_currency_account set balance=balance-v_entry.amount,updated_at=now() where id=v_entry.user_account_id;
    elsif v_entry.user_account_id is not null and v_entry.direction='DEBIT' then
      update public.user_currency_account set balance=balance+v_entry.amount,updated_at=now() where id=v_entry.user_account_id;
    elsif v_entry.club_account_id is not null and v_entry.direction='CREDIT' then
      select balance into v_balance from public.club_currency_account where id=v_entry.club_account_id for update;
      if v_balance < v_entry.amount then raise exception 'insufficient_club_balance_for_reversal'; end if;
      update public.club_currency_account set balance=balance-v_entry.amount,updated_at=now() where id=v_entry.club_account_id;
    elsif v_entry.club_account_id is not null and v_entry.direction='DEBIT' then
      update public.club_currency_account set balance=balance+v_entry.amount,updated_at=now() where id=v_entry.club_account_id;
    elsif v_entry.universe_account_id is not null and v_entry.direction='CREDIT' then
      select balance into v_balance from public.universe_currency_account where id=v_entry.universe_account_id for update;
      if v_balance < v_entry.amount then raise exception 'insufficient_universe_balance_for_reversal'; end if;
      update public.universe_currency_account set balance=balance-v_entry.amount,updated_at=now() where id=v_entry.universe_account_id;
    elsif v_entry.universe_account_id is not null and v_entry.direction='DEBIT' then
      update public.universe_currency_account set balance=balance+v_entry.amount,updated_at=now() where id=v_entry.universe_account_id;
    end if;

    insert into public.ledger_entry(transaction_id,direction,currency,scope,user_account_id,club_account_id,universe_account_id,amount)
    values(v_reversal.id,case when v_entry.direction='CREDIT' then 'DEBIT'::public.ledger_direction else 'CREDIT'::public.ledger_direction end,v_entry.currency,v_entry.scope,v_entry.user_account_id,v_entry.club_account_id,v_entry.universe_account_id,v_entry.amount);
  end loop;

  insert into public.ledger_reversal(original_transaction_id,reversal_transaction_id,reason)
  values(p_transaction_id,v_reversal.id,trim(p_reason));
  return v_reversal.id;
end;
$$;

revoke all on function public.service_reverse_ledger_transaction(uuid,text,text) from public;
grant execute on function public.service_reverse_ledger_transaction(uuid,text,text) to service_role;

create or replace function public.service_settle_club_financial_cycle(
  p_club_id uuid,
  p_cycle_key text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_idempotency_key text
)
returns public.club_financial_cycle
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle public.club_financial_cycle;
  v_account public.club_currency_account;
  v_payroll bigint := 0;
  v_maintenance bigint := 0;
  v_match_cost bigint := 0;
  v_sponsor bigint := 0;
  v_stadium bigint := 0;
  v_income bigint := 0;
  v_expense bigint := 0;
  v_paid bigint := 0;
  v_tx public.ledger_transaction;
begin
  select * into v_cycle from public.club_financial_cycle where club_id=p_club_id and cycle_key=p_cycle_key;
  if found and v_cycle.settled_at is not null then return v_cycle; end if;

  select coalesce(sum(pc.salary),0) into v_payroll from public.player_contract pc where pc.club_id=p_club_id and pc.status='ACTIVE';
  select coalesce(sum(ci.maintenance_cost),0) into v_maintenance from public.club_infrastructure ci where ci.club_id=p_club_id;
  select coalesce(sum(mfe.operating_cost),0),coalesce(sum(mfe.stadium_income),0) into v_match_cost,v_stadium
    from public.match_financial_event mfe where mfe.club_id=p_club_id and mfe.created_at>=p_period_start and mfe.created_at<p_period_end;
  select coalesce(sum(sc.periodic_payment),0) into v_sponsor from public.sponsorship_contract sc
    where sc.club_id=p_club_id and sc.state='ACTIVE' and sc.starts_at<p_period_end and (sc.ends_at is null or sc.ends_at>=p_period_start);

  v_income := v_stadium + v_sponsor;
  v_expense := v_payroll + v_maintenance + v_match_cost;

  insert into public.club_financial_cycle(club_id,cycle_key,payroll,maintenance,match_operating_cost,sponsorship_income,stadium_income,other_income,net_result)
  values(p_club_id,p_cycle_key,v_payroll,v_maintenance,v_match_cost,v_sponsor,v_stadium,0,v_income-v_expense)
  on conflict(club_id,cycle_key) do update set payroll=excluded.payroll,maintenance=excluded.maintenance,match_operating_cost=excluded.match_operating_cost,sponsorship_income=excluded.sponsorship_income,stadium_income=excluded.stadium_income,net_result=excluded.net_result
  returning * into v_cycle;

  select * into v_account from public.club_currency_account where club_id=p_club_id and currency='SILVER' for update;
  if not found then raise exception 'club_silver_account_not_found'; end if;

  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,metadata)
  values('CLUB_FINANCIAL_CYCLE',p_idempotency_key,'CLUB',p_club_id,'Recurring club financial cycle',jsonb_build_object('cycle_key',p_cycle_key,'income',v_income,'expense',v_expense)) returning * into v_tx;

  if v_income > 0 then
    insert into public.ledger_entry(transaction_id,direction,currency,scope,amount) values(v_tx.id,'DEBIT','SILVER','PLATFORM',v_income);
    insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_tx.id,'CREDIT','SILVER','CLUB',v_account.id,v_income);
    update public.club_currency_account set balance=balance+v_income,updated_at=now() where id=v_account.id;
  end if;

  select balance into v_paid from public.club_currency_account where id=v_account.id for update;
  v_paid := least(v_paid,v_expense);
  if v_paid > 0 then
    insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_tx.id,'DEBIT','SILVER','CLUB',v_account.id,v_paid);
    insert into public.ledger_entry(transaction_id,direction,currency,scope,amount) values(v_tx.id,'CREDIT','SILVER','PLATFORM',v_paid);
    update public.club_currency_account set balance=balance-v_paid,updated_at=now() where id=v_account.id;
  end if;

  if v_expense > v_paid then
    insert into public.club_liability(club_id,liability_type,reference_type,reference_id,amount,outstanding_amount,due_at)
    values(p_club_id,'OTHER','FINANCIAL_CYCLE',v_cycle.id,v_expense-v_paid,v_expense-v_paid,p_period_end);
  end if;

  update public.club_financial_cycle set settled_at=now() where id=v_cycle.id returning * into v_cycle;
  return v_cycle;
end;
$$;

revoke all on function public.service_settle_club_financial_cycle(uuid,text,timestamptz,timestamptz,text) from public;
grant execute on function public.service_settle_club_financial_cycle(uuid,text,timestamptz,timestamptz,text) to service_role;

alter table public.club_liability enable row level security;
alter table public.match_financial_event enable row level security;
alter table public.ledger_reversal enable row level security;
create policy club_liability_own_read on public.club_liability for select to authenticated using (exists(select 1 from public.club c where c.id=club_id and c.user_id=auth.uid()));
create policy match_financial_own_read on public.match_financial_event for select to authenticated using (exists(select 1 from public.club c where c.id=club_id and c.user_id=auth.uid()));
