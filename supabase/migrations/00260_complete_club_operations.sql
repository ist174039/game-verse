-- Clã das Sombras — complete club operations
-- Infrastructure upgrades, loan repayment lifecycle and paid competition registration.

insert into public.platform_config(key,category,value,version)
values ('economy.infrastructure_upgrade','ECONOMY',jsonb_build_object(
  'enabled',true,'max_level',5,
  'costs',jsonb_build_object('STADIUM',15000,'ACADEMY',12000,'TRAINING',10000,'MARKETING',8000,'FINANCE',9000),
  'maintenance',jsonb_build_object('STADIUM',1200,'ACADEMY',900,'TRAINING',800,'MARKETING',650,'FINANCE',700)
),1)
on conflict(key) do nothing;

create table if not exists public.club_infrastructure_upgrade (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.club(id) on delete restrict,
  infrastructure_type text not null check (infrastructure_type in ('STADIUM','ACADEMY','TRAINING','MARKETING','FINANCE')),
  from_level integer not null check (from_level between 0 and 4),
  to_level integer not null check (to_level between 1 and 5 and to_level=from_level+1),
  cost_silver bigint not null check (cost_silver > 0),
  ledger_transaction_id uuid not null references public.ledger_transaction(id) on delete restrict,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create or replace function public.upgrade_club_infrastructure(p_club_id uuid,p_infrastructure_type text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_club public.club; v_account public.club_currency_account; v_infra public.club_infrastructure;
  v_existing public.club_infrastructure_upgrade; v_config jsonb; v_base_cost bigint; v_base_maintenance bigint;
  v_max_level integer; v_from integer:=0; v_to integer; v_cost bigint; v_maintenance bigint; v_tx public.ledger_transaction;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_idempotency_key is null or length(p_idempotency_key)<3 then raise exception 'idempotency_key_required'; end if;
  if p_infrastructure_type not in ('STADIUM','ACADEMY','TRAINING','MARKETING','FINANCE') then raise exception 'invalid_infrastructure_type'; end if;
  select * into v_existing from public.club_infrastructure_upgrade where idempotency_key=p_idempotency_key;
  if found then return jsonb_build_object('club_id',v_existing.club_id,'infrastructure_type',v_existing.infrastructure_type,'from_level',v_existing.from_level,'to_level',v_existing.to_level,'cost_silver',v_existing.cost_silver,'transaction_id',v_existing.ledger_transaction_id); end if;
  select * into v_club from public.club where id=p_club_id for update;
  if not found then raise exception 'club_not_found'; end if;
  if v_club.user_id<>auth.uid() then raise exception 'club_not_owned'; end if;
  if exists(select 1 from public.economic_freeze f where f.active and ((f.scope='USER' and f.user_id=auth.uid()) or (f.scope='CLUB' and f.club_id=p_club_id) or (f.scope='UNIVERSE' and f.universe_id=v_club.universe_id))) then raise exception 'economic_scope_frozen'; end if;
  select value into v_config from public.platform_config where key='economy.infrastructure_upgrade';
  if coalesce((v_config->>'enabled')::boolean,false)=false then raise exception 'infrastructure_upgrades_disabled'; end if;
  v_max_level:=coalesce((v_config->>'max_level')::integer,5);
  v_base_cost:=coalesce((v_config->'costs'->>p_infrastructure_type)::bigint,0);
  v_base_maintenance:=coalesce((v_config->'maintenance'->>p_infrastructure_type)::bigint,0);
  if v_base_cost<=0 then raise exception 'infrastructure_cost_not_configured'; end if;
  select * into v_infra from public.club_infrastructure where club_id=p_club_id and infrastructure_type=p_infrastructure_type for update;
  if found then v_from:=v_infra.level; end if;
  if v_from>=v_max_level then raise exception 'infrastructure_max_level'; end if;
  v_to:=v_from+1; v_cost:=v_base_cost*v_to; v_maintenance:=v_base_maintenance*v_to;
  select * into v_account from public.club_currency_account where club_id=p_club_id and currency='SILVER' for update;
  if not found then raise exception 'club_silver_account_not_found'; end if;
  if v_account.balance<v_cost then raise exception 'insufficient_silver'; end if;
  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata)
  values('INFRASTRUCTURE_UPGRADE',p_idempotency_key,'CLUB',p_club_id,'Club infrastructure upgrade',auth.uid(),jsonb_build_object('infrastructure_type',p_infrastructure_type,'from_level',v_from,'to_level',v_to,'cost_silver',v_cost)) returning * into v_tx;
  insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_tx.id,'DEBIT','SILVER','CLUB',v_account.id,v_cost);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,amount) values(v_tx.id,'CREDIT','SILVER','PLATFORM',v_cost);
  update public.club_currency_account set balance=balance-v_cost,updated_at=now() where id=v_account.id;
  if v_from=0 then insert into public.club_infrastructure(club_id,infrastructure_type,level,maintenance_cost) values(p_club_id,p_infrastructure_type,v_to,v_maintenance) returning * into v_infra;
  else update public.club_infrastructure set level=v_to,maintenance_cost=v_maintenance,updated_at=now() where id=v_infra.id returning * into v_infra; end if;
  insert into public.club_infrastructure_upgrade(club_id,infrastructure_type,from_level,to_level,cost_silver,ledger_transaction_id,idempotency_key)
  values(p_club_id,p_infrastructure_type,v_from,v_to,v_cost,v_tx.id,p_idempotency_key);
  return jsonb_build_object('club_id',p_club_id,'infrastructure_type',p_infrastructure_type,'from_level',v_from,'to_level',v_to,'cost_silver',v_cost,'maintenance_cost',v_maintenance,'transaction_id',v_tx.id);
end; $$;
revoke all on function public.upgrade_club_infrastructure(uuid,text,text) from public;
grant execute on function public.upgrade_club_infrastructure(uuid,text,text) to authenticated;

alter table public.club_loan add column if not exists total_interest bigint not null default 0 check (total_interest>=0);
alter table public.club_loan add column if not exists outstanding_interest bigint not null default 0 check (outstanding_interest>=0);
alter table public.club_loan add column if not exists total_repaid bigint not null default 0 check (total_repaid>=0);
update public.club_loan set total_interest=ceil(principal*interest_rate_pct/100.0)::bigint,outstanding_interest=ceil(principal*interest_rate_pct/100.0)::bigint where total_interest=0 and interest_rate_pct>0 and total_repaid=0;

create table if not exists public.club_loan_repayment (
  id uuid primary key default gen_random_uuid(), loan_id uuid not null references public.club_loan(id) on delete restrict,
  club_id uuid not null references public.club(id) on delete restrict, amount bigint not null check(amount>0),
  interest_paid bigint not null default 0 check(interest_paid>=0), principal_paid bigint not null default 0 check(principal_paid>=0),
  ledger_transaction_id uuid not null references public.ledger_transaction(id) on delete restrict,
  idempotency_key text not null unique, created_at timestamptz not null default now()
);

create or replace function public.originate_club_loan(p_club_id uuid,p_principal bigint,p_idempotency_key text)
returns public.club_loan language plpgsql security definer set search_path=public as $$
declare
  v_club public.club; v_universe public.universe; v_account public.club_currency_account; v_config jsonb; v_rate numeric;
  v_installments integer; v_interest bigint; v_loan public.club_loan; v_tx public.ledger_transaction;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_idempotency_key is null or length(p_idempotency_key)<3 then raise exception 'idempotency_key_required'; end if;
  select * into v_club from public.club where id=p_club_id for update;
  if not found or v_club.user_id<>auth.uid() then raise exception 'club_not_owned'; end if;
  select * into v_universe from public.universe where id=v_club.universe_id;
  if v_universe.financing_policy not in ('STANDARD','OPEN') then raise exception 'loan_not_allowed_by_universe'; end if;
  if exists(select 1 from public.club_loan where club_id=p_club_id and state in ('ACTIVE','DEFAULTED')) then raise exception 'active_loan_already_exists'; end if;
  if exists(select 1 from public.economic_freeze f where f.active and ((f.scope='USER' and f.user_id=auth.uid()) or (f.scope='CLUB' and f.club_id=p_club_id) or (f.scope='UNIVERSE' and f.universe_id=v_club.universe_id))) then raise exception 'economic_scope_frozen'; end if;
  select value into v_config from public.platform_config where key='economy.loan_defaults';
  if coalesce((v_config->>'enabled')::boolean,false)=false then raise exception 'loans_disabled'; end if;
  if p_principal<coalesce((v_config->>'min_principal')::bigint,10000) or p_principal>coalesce((v_config->>'max_principal')::bigint,500000) then raise exception 'loan_amount_outside_limits'; end if;
  v_rate:=coalesce((v_config->>'interest_rate_pct')::numeric,6.0); v_installments:=coalesce((v_config->>'installments')::integer,5); v_interest:=ceil(p_principal*v_rate/100.0)::bigint;
  select * into v_account from public.club_currency_account where club_id=p_club_id and currency='SILVER' for update;
  if not found then raise exception 'club_silver_account_not_found'; end if;
  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata)
  values('CLUB_LOAN_ORIGINATION',p_idempotency_key,'CLUB',p_club_id,'Platform loan origination',auth.uid(),jsonb_build_object('principal',p_principal,'interest_rate_pct',v_rate,'total_interest',v_interest,'installments',v_installments)) returning * into v_tx;
  insert into public.ledger_entry(transaction_id,direction,currency,scope,amount) values(v_tx.id,'DEBIT','SILVER','PLATFORM',p_principal);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_tx.id,'CREDIT','SILVER','CLUB',v_account.id,p_principal);
  update public.club_currency_account set balance=balance+p_principal,updated_at=now() where id=v_account.id;
  insert into public.club_loan(universe_id,club_id,principal,outstanding_principal,interest_rate_pct,installments,installments_paid,state,next_payment_at,total_interest,outstanding_interest,total_repaid)
  values(v_club.universe_id,p_club_id,p_principal,p_principal,v_rate,v_installments,0,'ACTIVE',now()+interval '7 days',v_interest,v_interest,0) returning * into v_loan;
  return v_loan;
end; $$;
revoke all on function public.originate_club_loan(uuid,bigint,text) from public;
grant execute on function public.originate_club_loan(uuid,bigint,text) to authenticated;

create or replace function public.repay_club_loan_installment(p_loan_id uuid,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_loan public.club_loan; v_club public.club; v_account public.club_currency_account; v_existing public.club_loan_repayment;
  v_total_due bigint; v_remaining bigint; v_installment bigint; v_interest_paid bigint; v_principal_paid bigint; v_tx public.ledger_transaction; v_new_state text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_idempotency_key is null or length(p_idempotency_key)<3 then raise exception 'idempotency_key_required'; end if;
  select * into v_existing from public.club_loan_repayment where idempotency_key=p_idempotency_key;
  if found then return jsonb_build_object('loan_id',v_existing.loan_id,'amount',v_existing.amount,'interest_paid',v_existing.interest_paid,'principal_paid',v_existing.principal_paid,'transaction_id',v_existing.ledger_transaction_id); end if;
  select * into v_loan from public.club_loan where id=p_loan_id for update;
  if not found then raise exception 'loan_not_found'; end if;
  if v_loan.state not in ('ACTIVE','DEFAULTED') then raise exception 'loan_not_repayable'; end if;
  select * into v_club from public.club where id=v_loan.club_id;
  if v_club.user_id<>auth.uid() then raise exception 'club_not_owned'; end if;
  if exists(select 1 from public.economic_freeze f where f.active and ((f.scope='USER' and f.user_id=auth.uid()) or (f.scope='CLUB' and f.club_id=v_club.id) or (f.scope='UNIVERSE' and f.universe_id=v_club.universe_id))) then raise exception 'economic_scope_frozen'; end if;
  v_total_due:=v_loan.principal+v_loan.total_interest; v_remaining:=v_loan.outstanding_principal+v_loan.outstanding_interest;
  v_installment:=least(v_remaining,ceil(v_total_due::numeric/v_loan.installments)::bigint); if v_installment<=0 then raise exception 'loan_already_repaid'; end if;
  select * into v_account from public.club_currency_account where club_id=v_club.id and currency='SILVER' for update;
  if not found then raise exception 'club_silver_account_not_found'; end if; if v_account.balance<v_installment then raise exception 'insufficient_silver'; end if;
  v_interest_paid:=least(v_loan.outstanding_interest,v_installment); v_principal_paid:=v_installment-v_interest_paid;
  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata)
  values('CLUB_LOAN_REPAYMENT',p_idempotency_key,'CLUB_LOAN',v_loan.id,'Club loan installment',auth.uid(),jsonb_build_object('amount',v_installment,'interest_paid',v_interest_paid,'principal_paid',v_principal_paid)) returning * into v_tx;
  insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_tx.id,'DEBIT','SILVER','CLUB',v_account.id,v_installment);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,amount) values(v_tx.id,'CREDIT','SILVER','PLATFORM',v_installment);
  update public.club_currency_account set balance=balance-v_installment,updated_at=now() where id=v_account.id;
  v_new_state:=case when v_remaining-v_installment=0 then 'REPAID' else 'ACTIVE' end;
  update public.club_loan set outstanding_interest=greatest(0,outstanding_interest-v_interest_paid),outstanding_principal=greatest(0,outstanding_principal-v_principal_paid),total_repaid=total_repaid+v_installment,installments_paid=least(installments,installments_paid+1),state=v_new_state,next_payment_at=case when v_new_state='REPAID' then null else now()+interval '7 days' end where id=v_loan.id returning * into v_loan;
  insert into public.club_loan_repayment(loan_id,club_id,amount,interest_paid,principal_paid,ledger_transaction_id,idempotency_key) values(v_loan.id,v_club.id,v_installment,v_interest_paid,v_principal_paid,v_tx.id,p_idempotency_key);
  return jsonb_build_object('loan_id',v_loan.id,'amount',v_installment,'interest_paid',v_interest_paid,'principal_paid',v_principal_paid,'outstanding_principal',v_loan.outstanding_principal,'outstanding_interest',v_loan.outstanding_interest,'state',v_loan.state,'transaction_id',v_tx.id);
end; $$;
revoke all on function public.repay_club_loan_installment(uuid,text) from public;
grant execute on function public.repay_club_loan_installment(uuid,text) to authenticated;

create or replace function public.service_process_overdue_loans() returns integer language plpgsql security definer set search_path=public as $$
declare v_count integer; begin update public.club_loan set state='DEFAULTED' where state='ACTIVE' and next_payment_at is not null and next_payment_at<now()-interval '3 days'; get diagnostics v_count=row_count; return v_count; end; $$;
revoke all on function public.service_process_overdue_loans() from public;
grant execute on function public.service_process_overdue_loans() to service_role;

alter table public.competition_registration add column if not exists entry_fee_paid bigint not null default 0 check(entry_fee_paid>=0);
alter table public.competition_registration add column if not exists ledger_transaction_id uuid references public.ledger_transaction(id) on delete restrict;
alter table public.competition_registration add column if not exists idempotency_key text unique;
drop function if exists public.register_for_competition(uuid);

create or replace function public.register_for_competition(p_competition_id uuid,p_idempotency_key text)
returns public.competition_registration language plpgsql security definer set search_path=public as $$
declare
  v_comp public.competition; v_club public.club; v_reg public.competition_registration; v_club_account public.club_currency_account;
  v_universe_account public.universe_currency_account; v_tx public.ledger_transaction;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_idempotency_key is null or length(p_idempotency_key)<3 then raise exception 'idempotency_key_required'; end if;
  select * into v_reg from public.competition_registration where idempotency_key=p_idempotency_key; if found then return v_reg; end if;
  select * into v_comp from public.competition where id=p_competition_id for update; if not found then raise exception 'competition_not_found'; end if;
  if v_comp.status not in ('DRAFT','REGISTRATION','OPEN') then raise exception 'registration_closed'; end if;
  select * into v_club from public.club where universe_id=v_comp.universe_id and user_id=auth.uid() for update; if not found then raise exception 'club_required_in_universe'; end if;
  if exists(select 1 from public.competition_registration where competition_id=p_competition_id and club_id=v_club.id and state in ('REGISTERED','APPROVED')) then raise exception 'already_registered'; end if;
  if exists(select 1 from public.economic_freeze f where f.active and ((f.scope='USER' and f.user_id=auth.uid()) or (f.scope='CLUB' and f.club_id=v_club.id) or (f.scope='UNIVERSE' and f.universe_id=v_comp.universe_id))) then raise exception 'economic_scope_frozen'; end if;
  if v_comp.entry_fee>0 then
    select * into v_club_account from public.club_currency_account where club_id=v_club.id and currency='SILVER' for update; if not found then raise exception 'club_silver_account_not_found'; end if; if v_club_account.balance<v_comp.entry_fee then raise exception 'insufficient_silver'; end if;
    insert into public.universe_currency_account(universe_id,currency,balance) values(v_comp.universe_id,'SILVER',0) on conflict(universe_id,currency) do nothing;
    select * into v_universe_account from public.universe_currency_account where universe_id=v_comp.universe_id and currency='SILVER' for update;
    insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata)
    values('COMPETITION_ENTRY_FEE',p_idempotency_key,'COMPETITION',v_comp.id,'Competition registration fee',auth.uid(),jsonb_build_object('club_id',v_club.id,'entry_fee',v_comp.entry_fee,'universe_id',v_comp.universe_id)) returning * into v_tx;
    insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_tx.id,'DEBIT','SILVER','CLUB',v_club_account.id,v_comp.entry_fee);
    insert into public.ledger_entry(transaction_id,direction,currency,scope,universe_account_id,amount) values(v_tx.id,'CREDIT','SILVER','UNIVERSE',v_universe_account.id,v_comp.entry_fee);
    update public.club_currency_account set balance=balance-v_comp.entry_fee,updated_at=now() where id=v_club_account.id;
    update public.universe_currency_account set balance=balance+v_comp.entry_fee,updated_at=now() where id=v_universe_account.id;
    update public.competition set prize_pool=prize_pool+v_comp.entry_fee where id=v_comp.id;
  end if;
  insert into public.competition_registration(competition_id,club_id,state,entry_fee_paid,ledger_transaction_id,idempotency_key)
  values(p_competition_id,v_club.id,'REGISTERED',v_comp.entry_fee,v_tx.id,p_idempotency_key)
  on conflict(competition_id,club_id) do update set state='REGISTERED',registered_at=now(),entry_fee_paid=excluded.entry_fee_paid,ledger_transaction_id=excluded.ledger_transaction_id,idempotency_key=excluded.idempotency_key returning * into v_reg;
  return v_reg;
end; $$;
revoke all on function public.register_for_competition(uuid,text) from public;
grant execute on function public.register_for_competition(uuid,text) to authenticated;

alter table public.club_infrastructure_upgrade enable row level security;
alter table public.club_loan_repayment enable row level security;
create policy club_infrastructure_upgrade_own_read on public.club_infrastructure_upgrade for select to authenticated using (exists(select 1 from public.club c where c.id=club_id and c.user_id=auth.uid()));
create policy club_loan_repayment_own_read on public.club_loan_repayment for select to authenticated using (exists(select 1 from public.club c where c.id=club_id and c.user_id=auth.uid()));
