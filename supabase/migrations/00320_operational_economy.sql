-- Clã das Sombras — sponsorships, match operations, financial cycles and liabilities
-- Apply after 00310_retention_operations.sql.

alter table public.sponsorship_contract add column if not exists accepted_at timestamptz;
alter table public.sponsorship_contract add column if not exists signing_ledger_transaction_id uuid references public.ledger_transaction(id) on delete restrict;

insert into public.platform_config(key,category,value)
values
  ('economy.match_operations','ECONOMY','{"base_home_operating_cost":300,"base_away_operating_cost":200,"stadium_capacity_base":5000,"stadium_capacity_per_level":5000,"attendance_fan_factor":0.30,"attendance_prestige_factor":0.05,"ticket_income_per_attendee":2}'::jsonb),
  ('economy.sponsorship_defaults','ECONOMY','{"base_periodic_payment":500,"marketing_level_bonus":250,"fan_factor":0.02,"signing_multiplier":2,"objective_multiplier":3,"duration_days":28}'::jsonb),
  ('economy.financial_cycle','ECONOMY','{"cycle_days":7}'::jsonb)
on conflict(key) do nothing;

create or replace function public.service_generate_sponsorship_offer(p_club_id uuid)
returns public.sponsorship_contract
language plpgsql security definer set search_path=public as $$
declare v_club public.club;v_level integer:=1;v_cfg jsonb;v_periodic bigint;v_signing bigint;v_objective bigint;v_days integer;v_offer public.sponsorship_contract;
begin
  select * into v_club from public.club where id=p_club_id;
  if not found then raise exception 'club_not_found';end if;
  update public.sponsorship_contract set state='COMPLETED' where club_id=p_club_id and state='ACTIVE' and ends_at is not null and ends_at<now();
  select * into v_offer from public.sponsorship_contract where club_id=p_club_id and state in ('OFFERED','ACTIVE') order by starts_at desc limit 1;
  if found then return v_offer;end if;
  select level into v_level from public.club_infrastructure where club_id=p_club_id and infrastructure_type='MARKETING';
  v_level:=coalesce(v_level,1);
  select value into v_cfg from public.platform_config where key='economy.sponsorship_defaults';
  v_cfg:=coalesce(v_cfg,'{}'::jsonb);
  v_periodic:=greatest(100,
    coalesce((v_cfg->>'base_periodic_payment')::bigint,500)
    + v_level*coalesce((v_cfg->>'marketing_level_bonus')::bigint,250)
    + floor(v_club.fans*coalesce((v_cfg->>'fan_factor')::numeric,0.02))::bigint);
  v_signing:=floor(v_periodic*coalesce((v_cfg->>'signing_multiplier')::numeric,2))::bigint;
  v_objective:=floor(v_periodic*coalesce((v_cfg->>'objective_multiplier')::numeric,3))::bigint;
  v_days:=greatest(7,coalesce((v_cfg->>'duration_days')::integer,28));
  insert into public.sponsorship_contract(universe_id,club_id,name,state,signing_bonus,periodic_payment,objective_bonus,objectives,starts_at,ends_at)
  values(v_club.universe_id,p_club_id,'Parceiro Comercial do Clube','OFFERED',v_signing,v_periodic,v_objective,jsonb_build_object('type','COMPETITIVE_ACTIVITY','description','Bónus de objetivo reservado para futuras metas verificadas.'),now(),now()+make_interval(days=>v_days))
  returning * into v_offer;
  return v_offer;
end;
$$;
revoke all on function public.service_generate_sponsorship_offer(uuid) from public;
grant execute on function public.service_generate_sponsorship_offer(uuid) to service_role;

create or replace function public.service_refresh_sponsorship_offers()
returns integer language plpgsql security definer set search_path=public as $$
declare v_club record;v_count integer:=0;
begin
  update public.sponsorship_contract set state='COMPLETED' where state='ACTIVE' and ends_at is not null and ends_at<now();
  for v_club in select id from public.club loop
    if not exists(select 1 from public.sponsorship_contract where club_id=v_club.id and state in ('OFFERED','ACTIVE')) then
      perform public.service_generate_sponsorship_offer(v_club.id);v_count:=v_count+1;
    end if;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.service_refresh_sponsorship_offers() from public;
grant execute on function public.service_refresh_sponsorship_offers() to service_role;

create or replace function public.accept_sponsorship_offer(p_contract_id uuid,p_idempotency_key text)
returns public.sponsorship_contract language plpgsql security definer set search_path=public as $$
declare v_contract public.sponsorship_contract;v_club public.club;v_account public.club_currency_account;v_tx public.ledger_transaction;v_key text;
begin
  if auth.uid() is null then raise exception 'authentication_required';end if;
  select * into v_contract from public.sponsorship_contract where id=p_contract_id for update;
  if not found then raise exception 'sponsorship_not_found';end if;
  select * into v_club from public.club where id=v_contract.club_id;
  if v_club.user_id<>auth.uid() then raise exception 'club_not_owned';end if;
  if v_contract.state='ACTIVE' then return v_contract;end if;
  if v_contract.state<>'OFFERED' then raise exception 'sponsorship_not_acceptable';end if;
  if exists(select 1 from public.economic_freeze f where f.active and ((f.scope='USER' and f.user_id=auth.uid()) or (f.scope='CLUB' and f.club_id=v_club.id) or (f.scope='UNIVERSE' and f.universe_id=v_club.universe_id))) then raise exception 'economic_scope_frozen';end if;
  insert into public.club_currency_account(club_id,currency,balance) values(v_club.id,'SILVER',0) on conflict(club_id,currency) do nothing;
  select * into v_account from public.club_currency_account where club_id=v_club.id and currency='SILVER' for update;
  if v_contract.signing_bonus>0 then
    v_key:=format('sponsorship:%s:%s',auth.uid(),v_contract.id);
    select * into v_tx from public.ledger_transaction where idempotency_key=v_key;
    if not found then
      insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata)
      values('SPONSORSHIP_SIGNING',v_key,'SPONSORSHIP',v_contract.id,'Sponsorship signing bonus',auth.uid(),jsonb_build_object('club_id',v_club.id)) returning * into v_tx;
      insert into public.ledger_entry(transaction_id,direction,currency,scope,amount) values(v_tx.id,'DEBIT','SILVER','PLATFORM',v_contract.signing_bonus);
      insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_tx.id,'CREDIT','SILVER','CLUB',v_account.id,v_contract.signing_bonus);
      update public.club_currency_account set balance=balance+v_contract.signing_bonus,updated_at=now() where id=v_account.id;
    end if;
  end if;
  update public.sponsorship_contract set state='ACTIVE',accepted_at=now(),signing_ledger_transaction_id=v_tx.id,starts_at=now() where id=v_contract.id returning * into v_contract;
  return v_contract;
end;
$$;
revoke all on function public.accept_sponsorship_offer(uuid,text) from public;
grant execute on function public.accept_sponsorship_offer(uuid,text) to authenticated;

create or replace function public.service_create_match_financial_events(p_match_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare v_match public.match;v_home public.club;v_away public.club;v_cfg jsonb;v_stadium_level integer:=1;v_capacity integer;v_attendance integer;v_ticket bigint;v_home_cost bigint;v_away_cost bigint;v_count integer:=0;
begin
  select * into v_match from public.match where id=p_match_id;
  if not found then raise exception 'match_not_found';end if;
  if v_match.state<>'SETTLED' then raise exception 'match_not_settled';end if;
  if exists(select 1 from public.match_financial_event where match_id=p_match_id) then select count(*) into v_count from public.match_financial_event where match_id=p_match_id;return v_count;end if;
  select * into v_home from public.club where id=v_match.home_club_id;select * into v_away from public.club where id=v_match.away_club_id;
  select level into v_stadium_level from public.club_infrastructure where club_id=v_home.id and infrastructure_type='STADIUM';v_stadium_level:=coalesce(v_stadium_level,1);
  select value into v_cfg from public.platform_config where key='economy.match_operations';v_cfg:=coalesce(v_cfg,'{}'::jsonb);
  v_capacity:=coalesce((v_cfg->>'stadium_capacity_base')::integer,5000)+v_stadium_level*coalesce((v_cfg->>'stadium_capacity_per_level')::integer,5000);
  v_attendance:=least(v_capacity,greatest(500,floor(v_home.fans*coalesce((v_cfg->>'attendance_fan_factor')::numeric,0.30)+v_home.prestige*coalesce((v_cfg->>'attendance_prestige_factor')::numeric,0.05)+1000)::integer));
  v_ticket:=v_attendance*coalesce((v_cfg->>'ticket_income_per_attendee')::bigint,2);
  v_home_cost:=coalesce((v_cfg->>'base_home_operating_cost')::bigint,300)+v_stadium_level*50;
  v_away_cost:=coalesce((v_cfg->>'base_away_operating_cost')::bigint,200);
  insert into public.match_financial_event(match_id,club_id,stadium_income,operating_cost,attendance,metadata) values(p_match_id,v_home.id,v_ticket,v_home_cost,v_attendance,jsonb_build_object('stadium_level',v_stadium_level,'capacity',v_capacity)) on conflict(match_id,club_id) do nothing;
  insert into public.match_financial_event(match_id,club_id,stadium_income,operating_cost,attendance,metadata) values(p_match_id,v_away.id,0,v_away_cost,null,jsonb_build_object('away_match',true)) on conflict(match_id,club_id) do nothing;
  return 2;
end;
$$;
revoke all on function public.service_create_match_financial_events(uuid) from public;
grant execute on function public.service_create_match_financial_events(uuid) to service_role;

create or replace function public.match_finance_after_settlement()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='APPLIED' and not exists(select 1 from public.match_financial_event where match_id=new.match_id) then perform public.service_create_match_financial_events(new.match_id);end if;
  return new;
end;
$$;
drop trigger if exists match_finance_settlement_trigger on public.match_settlement;
create trigger match_finance_settlement_trigger after insert on public.match_settlement for each row execute function public.match_finance_after_settlement();

create or replace function public.pay_club_liability(p_liability_id uuid,p_amount bigint,p_idempotency_key text)
returns public.club_liability language plpgsql security definer set search_path=public as $$
declare v_l public.club_liability;v_club public.club;v_account public.club_currency_account;v_tx public.ledger_transaction;v_pay bigint;v_key text;
begin
  if auth.uid() is null then raise exception 'authentication_required';end if;
  select * into v_l from public.club_liability where id=p_liability_id for update;if not found then raise exception 'liability_not_found';end if;
  select * into v_club from public.club where id=v_l.club_id;if v_club.user_id<>auth.uid() then raise exception 'club_not_owned';end if;
  if v_l.state not in ('OPEN','PARTIALLY_PAID') or v_l.outstanding_amount<=0 then return v_l;end if;
  if p_amount<=0 then raise exception 'amount_must_be_positive';end if;
  v_pay:=least(p_amount,v_l.outstanding_amount);
  select * into v_account from public.club_currency_account where club_id=v_club.id and currency='SILVER' for update;if not found then raise exception 'club_silver_account_not_found';end if;
  if v_account.balance<v_pay then raise exception 'insufficient_silver';end if;
  v_key:=format('liability:%s:%s',v_l.id,coalesce(nullif(p_idempotency_key,''),gen_random_uuid()::text));
  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata) values('LIABILITY_PAYMENT',v_key,'CLUB_LIABILITY',v_l.id,'Club liability payment',auth.uid(),jsonb_build_object('club_id',v_club.id,'amount',v_pay)) returning * into v_tx;
  insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount) values(v_tx.id,'DEBIT','SILVER','CLUB',v_account.id,v_pay);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,amount) values(v_tx.id,'CREDIT','SILVER','PLATFORM',v_pay);
  update public.club_currency_account set balance=balance-v_pay,updated_at=now() where id=v_account.id;
  update public.club_liability set outstanding_amount=outstanding_amount-v_pay,state=case when outstanding_amount-v_pay=0 then 'PAID' else 'PARTIALLY_PAID' end,updated_at=now() where id=v_l.id returning * into v_l;
  return v_l;
end;
$$;
revoke all on function public.pay_club_liability(uuid,bigint,text) from public;
grant execute on function public.pay_club_liability(uuid,bigint,text) to authenticated;

create or replace function public.service_process_due_financial_cycles()
returns integer language plpgsql security definer set search_path=public as $$
declare v_club record;v_start timestamptz;v_end timestamptz;v_key text;v_count integer:=0;
begin
  v_end:=date_trunc('week',now());v_start:=v_end-interval '7 days';v_key:=to_char(v_start,'IYYY-"W"IW');
  for v_club in select id from public.club loop
    if not exists(select 1 from public.club_financial_cycle where club_id=v_club.id and cycle_key=v_key and settled_at is not null) then
      begin perform public.service_settle_club_financial_cycle(v_club.id,v_key,v_start,v_end,format('financial_cycle:%s:%s',v_club.id,v_key));v_count:=v_count+1;exception when others then raise warning 'financial cycle failed for %: %',v_club.id,sqlerrm;end;
    end if;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.service_process_due_financial_cycles() from public;
grant execute on function public.service_process_due_financial_cycles() to service_role;
