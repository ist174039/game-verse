-- Clã das Sombras — controlled domain operations
-- No direct balance writes from browser clients.

-- Resolve a user's club inside one universe.
create or replace function public.my_club_in_universe(p_universe_id uuid)
returns public.club
language sql
stable
security definer
set search_path = public
as $$
  select c.*
  from public.club c
  where c.universe_id = p_universe_id
    and c.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.my_club_in_universe(uuid) from public;
grant execute on function public.my_club_in_universe(uuid) to authenticated;

-- Join a public universe. Application/invite/private policies use future moderation workflows.
create or replace function public.join_public_universe(p_universe_id uuid)
returns public.universe_membership
language plpgsql
security definer
set search_path = public
as $$
declare
  v_universe public.universe;
  v_membership public.universe_membership;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  select * into v_universe from public.universe where id = p_universe_id for update;
  if not found then raise exception 'universe_not_found'; end if;
  if v_universe.state not in ('OPEN_FOR_MEMBERS','ACTIVE','SEASON_CLOSED') then raise exception 'universe_not_open'; end if;
  if v_universe.access_policy <> 'PUBLIC' then raise exception 'universe_requires_controlled_admission'; end if;

  insert into public.universe_membership(universe_id,user_id,role)
  values(p_universe_id, auth.uid(), 'MEMBER')
  on conflict (universe_id,user_id) do update set user_id = excluded.user_id
  returning * into v_membership;

  return v_membership;
end;
$$;

revoke all on function public.join_public_universe(uuid) from public;
grant execute on function public.join_public_universe(uuid) to authenticated;

-- Create one club for the current user in a universe and seed Starting Silver atomically.
create or replace function public.create_club_in_universe(
  p_universe_id uuid,
  p_name text,
  p_motto text default null,
  p_logo_url text default null,
  p_idempotency_key text default null
)
returns public.club
language plpgsql
security definer
set search_path = public
as $$
declare
  v_universe public.universe;
  v_club public.club;
  v_account public.club_currency_account;
  v_tx public.ledger_transaction;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if length(trim(p_name)) < 3 then raise exception 'club_name_too_short'; end if;

  select * into v_universe from public.universe where id = p_universe_id for update;
  if not found then raise exception 'universe_not_found'; end if;
  if v_universe.state not in ('OPEN_FOR_MEMBERS','ACTIVE','SEASON_CLOSED') then raise exception 'universe_not_accepting_clubs'; end if;

  if not exists(select 1 from public.universe_membership m where m.universe_id = p_universe_id and m.user_id = auth.uid()) then
    raise exception 'universe_membership_required';
  end if;

  if exists(select 1 from public.club c where c.universe_id = p_universe_id and c.user_id = auth.uid()) then
    raise exception 'club_already_exists_in_universe';
  end if;

  insert into public.club(universe_id,user_id,name,motto,logo_url)
  values(p_universe_id,auth.uid(),trim(p_name),nullif(trim(p_motto),''),p_logo_url)
  returning * into v_club;

  insert into public.club_currency_account(club_id,currency,balance)
  values(v_club.id,'SILVER',v_universe.starting_silver)
  returning * into v_account;

  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata)
  values('CLUB_STARTING_GRANT',p_idempotency_key,'CLUB',v_club.id,'Starting Silver defined by universe',auth.uid(),jsonb_build_object('universe_id',p_universe_id))
  returning * into v_tx;

  if v_universe.starting_silver > 0 then
    insert into public.ledger_entry(transaction_id,direction,currency,scope,amount)
    values(v_tx.id,'DEBIT','SILVER','PLATFORM',v_universe.starting_silver);

    insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount)
    values(v_tx.id,'CREDIT','SILVER','CLUB',v_account.id,v_universe.starting_silver);
  end if;

  return v_club;
exception
  when unique_violation then
    if p_idempotency_key is not null then
      select c.* into v_club
      from public.club c
      where c.universe_id = p_universe_id and c.user_id = auth.uid();
      if found then return v_club; end if;
    end if;
    raise;
end;
$$;

revoke all on function public.create_club_in_universe(uuid,text,text,text,text) from public;
grant execute on function public.create_club_in_universe(uuid,text,text,text,text) to authenticated;

-- Internal/service-only user currency grant. Used for purchased Gold, Bronze rewards or audited compensation.
create or replace function public.service_grant_user_currency(
  p_user_id uuid,
  p_currency public.currency_code,
  p_amount bigint,
  p_transaction_type text,
  p_reason text,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.user_currency_account;
  v_tx public.ledger_transaction;
begin
  if p_currency not in ('GOLD','BRONZE') then raise exception 'invalid_global_currency'; end if;
  if p_amount <= 0 then raise exception 'amount_must_be_positive'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 3 then raise exception 'idempotency_key_required'; end if;

  select * into v_tx from public.ledger_transaction where idempotency_key = p_idempotency_key;
  if found then return v_tx.id; end if;

  insert into public.user_currency_account(user_id,currency,balance)
  values(p_user_id,p_currency,0)
  on conflict(user_id,currency) do nothing;

  select * into v_account
  from public.user_currency_account
  where user_id = p_user_id and currency = p_currency
  for update;

  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,metadata)
  values(p_transaction_type,p_idempotency_key,'USER',p_user_id,p_reason,jsonb_build_object('service_operation',true))
  returning * into v_tx;

  insert into public.ledger_entry(transaction_id,direction,currency,scope,amount)
  values(v_tx.id,'DEBIT',p_currency,'PLATFORM',p_amount);

  insert into public.ledger_entry(transaction_id,direction,currency,scope,user_account_id,amount)
  values(v_tx.id,'CREDIT',p_currency,'USER',v_account.id,p_amount);

  update public.user_currency_account set balance = balance + p_amount where id = v_account.id;
  return v_tx.id;
end;
$$;

revoke all on function public.service_grant_user_currency(uuid,public.currency_code,bigint,text,text,text) from public;
grant execute on function public.service_grant_user_currency(uuid,public.currency_code,bigint,text,text,text) to service_role;

-- Internal/service-only debit. Gold purchases and Bronze store spend use this primitive.
create or replace function public.service_debit_user_currency(
  p_user_id uuid,
  p_currency public.currency_code,
  p_amount bigint,
  p_transaction_type text,
  p_reason text,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.user_currency_account;
  v_tx public.ledger_transaction;
begin
  if p_currency not in ('GOLD','BRONZE') then raise exception 'invalid_global_currency'; end if;
  if p_amount <= 0 then raise exception 'amount_must_be_positive'; end if;

  select * into v_tx from public.ledger_transaction where idempotency_key = p_idempotency_key;
  if found then return v_tx.id; end if;

  select * into v_account from public.user_currency_account
  where user_id = p_user_id and currency = p_currency for update;
  if not found then raise exception 'currency_account_not_found'; end if;
  if v_account.balance < p_amount then raise exception 'insufficient_balance'; end if;

  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,metadata)
  values(p_transaction_type,p_idempotency_key,'USER',p_user_id,p_reason,jsonb_build_object('service_operation',true))
  returning * into v_tx;

  insert into public.ledger_entry(transaction_id,direction,currency,scope,user_account_id,amount)
  values(v_tx.id,'DEBIT',p_currency,'USER',v_account.id,p_amount);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,amount)
  values(v_tx.id,'CREDIT',p_currency,'PLATFORM',p_amount);

  update public.user_currency_account set balance = balance - p_amount where id = v_account.id;
  return v_tx.id;
end;
$$;

revoke all on function public.service_debit_user_currency(uuid,public.currency_code,bigint,text,text,text) from public;
grant execute on function public.service_debit_user_currency(uuid,public.currency_code,bigint,text,text,text) to service_role;
