-- Clã das Sombras — governed universe creation, complete support lifecycle and moderation/fraud operations
-- Apply after 00490_identity_media_and_club_kits.sql.

create index if not exists support_ticket_queue_idx on public.support_ticket(status,priority,updated_at desc);
create index if not exists support_ticket_requester_idx on public.support_ticket(requester_user_id,updated_at desc) where requester_user_id is not null;
create index if not exists moderation_case_queue_idx on public.moderation_case(status,severity,updated_at desc);
create index if not exists moderation_case_target_user_idx on public.moderation_case(target_user_id,updated_at desc) where target_user_id is not null;
create index if not exists economic_freeze_case_idx on public.economic_freeze(case_id,active) where case_id is not null;

insert into public.platform_config(key,category,value)
values(
  'universes.community_creation',
  'UNIVERSES',
  '{"enabled":true,"gold_cost":250,"max_owned":3,"starting_silver":25000,"market_fee_pct":5,"auction_fee_pct":5,"min_squad_size":18,"max_squad_size":25}'::jsonb
)
on conflict(key) do nothing;

-- Safe read model for the player-facing universe creation UI. Platform config remains private.
create or replace function public.get_community_universe_creation_policy()
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_cfg jsonb;
  v_owned integer:=0;
  v_gold bigint:=0;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select value into v_cfg from public.platform_config where key='universes.community_creation';
  v_cfg:=coalesce(v_cfg,'{}'::jsonb);
  select count(*) into v_owned
  from public.universe
  where owner_user_id=auth.uid() and kind='COMMUNITY' and state not in ('CANCELLED','ARCHIVED');
  select coalesce(balance,0) into v_gold
  from public.user_currency_account
  where user_id=auth.uid() and currency='GOLD';
  return jsonb_build_object(
    'enabled',coalesce((v_cfg->>'enabled')::boolean,false),
    'gold_cost',greatest(0,coalesce((v_cfg->>'gold_cost')::bigint,250)),
    'max_owned',greatest(1,coalesce((v_cfg->>'max_owned')::integer,3)),
    'owned_count',v_owned,
    'gold_balance',coalesce(v_gold,0)
  );
end;
$$;
revoke all on function public.get_community_universe_creation_policy() from public;
revoke all on function public.get_community_universe_creation_policy() from anon;
grant execute on function public.get_community_universe_creation_policy() to authenticated;

-- One atomic governed operation: validate policy, charge Gold, create universe,
-- assign OWNER membership and write ledger + audit. Browser never edits balances directly.
create or replace function public.create_governed_community_universe(
  p_name text,
  p_slug text,
  p_description text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid:=auth.uid();
  v_cfg jsonb;
  v_enabled boolean:=false;
  v_cost bigint:=250;
  v_max_owned integer:=3;
  v_owned integer:=0;
  v_starting_silver bigint:=25000;
  v_market_fee numeric:=5;
  v_auction_fee numeric:=5;
  v_min_squad integer:=18;
  v_max_squad integer:=25;
  v_account public.user_currency_account;
  v_universe public.universe;
  v_tx public.ledger_transaction;
  v_remaining bigint:=0;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if length(trim(coalesce(p_name,'')))<3 or length(trim(p_name))>50 then raise exception 'universe_name_invalid'; end if;
  if length(trim(coalesce(p_slug,'')))<3 or length(trim(p_slug))>48 or trim(p_slug) !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'universe_slug_invalid'; end if;
  if length(coalesce(p_description,''))>500 then raise exception 'universe_description_too_long'; end if;
  if length(trim(coalesce(p_idempotency_key,'')))<8 then raise exception 'idempotency_key_required'; end if;

  select * into v_tx from public.ledger_transaction where idempotency_key=trim(p_idempotency_key);
  if found then
    if v_tx.transaction_type<>'COMMUNITY_UNIVERSE_CREATION' or v_tx.created_by is distinct from v_uid then raise exception 'idempotency_conflict'; end if;
    select * into v_universe from public.universe where id=v_tx.reference_id and owner_user_id=v_uid;
    if not found then raise exception 'idempotency_reference_missing'; end if;
    select coalesce(balance,0) into v_remaining from public.user_currency_account where user_id=v_uid and currency='GOLD';
    return jsonb_build_object('universe',to_jsonb(v_universe),'charged_gold',0,'remaining_gold',coalesce(v_remaining,0),'replayed',true);
  end if;

  select value into v_cfg from public.platform_config where key='universes.community_creation';
  v_cfg:=coalesce(v_cfg,'{}'::jsonb);
  v_enabled:=coalesce((v_cfg->>'enabled')::boolean,false);
  v_cost:=greatest(0,coalesce((v_cfg->>'gold_cost')::bigint,250));
  v_max_owned:=greatest(1,least(20,coalesce((v_cfg->>'max_owned')::integer,3)));
  v_starting_silver:=greatest(0,coalesce((v_cfg->>'starting_silver')::bigint,25000));
  v_market_fee:=coalesce((v_cfg->>'market_fee_pct')::numeric,5);
  v_auction_fee:=coalesce((v_cfg->>'auction_fee_pct')::numeric,5);
  v_min_squad:=greatest(1,coalesce((v_cfg->>'min_squad_size')::integer,18));
  v_max_squad:=greatest(v_min_squad,coalesce((v_cfg->>'max_squad_size')::integer,25));

  if not v_enabled then raise exception 'universe_creation_disabled'; end if;
  if v_market_fee<0 or v_market_fee>100 or v_auction_fee<0 or v_auction_fee>100 then raise exception 'invalid_universe_fee_policy'; end if;

  select count(*) into v_owned
  from public.universe
  where owner_user_id=v_uid and kind='COMMUNITY' and state not in ('CANCELLED','ARCHIVED');
  if v_owned>=v_max_owned then raise exception 'community_universe_limit_reached'; end if;

  if exists(select 1 from public.universe where slug=trim(p_slug)) then raise exception 'universe_slug_in_use'; end if;

  if v_cost>0 then
    select * into v_account
    from public.user_currency_account
    where user_id=v_uid and currency='GOLD'
    for update;
    if not found or v_account.balance<v_cost then raise exception 'insufficient_gold'; end if;
  end if;

  begin
    insert into public.universe(
      kind,name,slug,description,owner_user_id,state,access_policy,economic_profile,financing_policy,
      starting_silver,market_fee_pct,auction_fee_pct,min_squad_size,max_squad_size
    ) values(
      'COMMUNITY',trim(p_name),trim(p_slug),nullif(trim(coalesce(p_description,'')),''),v_uid,
      'OPEN_FOR_MEMBERS','PUBLIC','STANDARD','STANDARD',v_starting_silver,v_market_fee,v_auction_fee,v_min_squad,v_max_squad
    ) returning * into v_universe;
  exception when unique_violation then
    raise exception 'universe_slug_in_use';
  end;

  insert into public.universe_membership(universe_id,user_id,role)
  values(v_universe.id,v_uid,'OWNER')
  on conflict(universe_id,user_id) do update set role='OWNER';

  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,metadata,created_by)
  values(
    'COMMUNITY_UNIVERSE_CREATION',trim(p_idempotency_key),'UNIVERSE',v_universe.id,
    'Governed community universe creation',
    jsonb_build_object('gold_cost',v_cost,'policy_key','universes.community_creation'),v_uid
  ) returning * into v_tx;

  if v_cost>0 then
    insert into public.ledger_entry(transaction_id,direction,currency,scope,user_account_id,amount)
    values(v_tx.id,'DEBIT','GOLD','USER',v_account.id,v_cost);
    insert into public.ledger_entry(transaction_id,direction,currency,scope,amount)
    values(v_tx.id,'CREDIT','GOLD','PLATFORM',v_cost);
    update public.user_currency_account set balance=balance-v_cost,updated_at=now() where id=v_account.id returning balance into v_remaining;
  else
    select coalesce(balance,0) into v_remaining from public.user_currency_account where user_id=v_uid and currency='GOLD';
  end if;

  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,new_state,reason,metadata)
  values(v_uid,'COMMUNITY_UNIVERSE_CREATED','UNIVERSE',v_universe.id::text,to_jsonb(v_universe),'Governed community universe creation',jsonb_build_object('gold_cost',v_cost));

  return jsonb_build_object('universe',to_jsonb(v_universe),'charged_gold',v_cost,'remaining_gold',coalesce(v_remaining,0),'replayed',false);
end;
$$;
revoke all on function public.create_governed_community_universe(text,text,text,text) from public;
revoke all on function public.create_governed_community_universe(text,text,text,text) from anon;
grant execute on function public.create_governed_community_universe(text,text,text,text) to authenticated;

-- Player-facing support lifecycle.
create or replace function public.create_support_ticket(
  p_category text,
  p_subject text,
  p_description text,
  p_club_id uuid,
  p_universe_id uuid,
  p_metadata jsonb
)
returns public.support_ticket
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid:=auth.uid();
  v_ticket public.support_ticket;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_category not in ('PAYMENT','ECONOMY','MATCH','MARKET','ACCOUNT','UNIVERSE','MODERATION','TECHNICAL','OTHER') then raise exception 'invalid_ticket_category'; end if;
  if length(trim(coalesce(p_subject,'')))<4 or length(trim(p_subject))>120 then raise exception 'ticket_subject_invalid'; end if;
  if length(trim(coalesce(p_description,'')))<10 or length(trim(p_description))>4000 then raise exception 'ticket_description_invalid'; end if;
  if p_club_id is not null and not exists(select 1 from public.club where id=p_club_id and user_id=v_uid) then raise exception 'ticket_club_not_owned'; end if;
  if p_universe_id is not null and not exists(select 1 from public.universe_membership where universe_id=p_universe_id and user_id=v_uid) then raise exception 'ticket_universe_not_joined'; end if;

  insert into public.support_ticket(requester_user_id,club_id,universe_id,category,priority,status,subject,description,metadata)
  values(v_uid,p_club_id,p_universe_id,p_category,'NORMAL','OPEN',trim(p_subject),trim(p_description),coalesce(p_metadata,'{}'::jsonb))
  returning * into v_ticket;

  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,new_state,reason,ticket_id)
  values(v_uid,'SUPPORT_TICKET_CREATED','SUPPORT_TICKET',v_ticket.id::text,to_jsonb(v_ticket),'Ticket created by requester',v_ticket.id);
  return v_ticket;
end;
$$;
revoke all on function public.create_support_ticket(text,text,text,uuid,uuid,jsonb) from public;
revoke all on function public.create_support_ticket(text,text,text,uuid,uuid,jsonb) from anon;
grant execute on function public.create_support_ticket(text,text,text,uuid,uuid,jsonb) to authenticated;

create or replace function public.reply_support_ticket(p_ticket_id uuid,p_body text)
returns public.ticket_note
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid:=auth.uid();
  v_ticket public.support_ticket;
  v_note public.ticket_note;
  v_new_status public.ticket_status;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if length(trim(coalesce(p_body,'')))<2 or length(trim(p_body))>4000 then raise exception 'ticket_reply_invalid'; end if;
  select * into v_ticket from public.support_ticket where id=p_ticket_id and requester_user_id=v_uid for update;
  if not found then raise exception 'ticket_not_found'; end if;
  if v_ticket.status='CLOSED' then raise exception 'ticket_closed_reopen_required'; end if;
  v_new_status:=case when v_ticket.status in ('WAITING_USER','RESOLVED') then 'IN_PROGRESS'::public.ticket_status else v_ticket.status end;
  insert into public.ticket_note(ticket_id,author_user_id,internal,body)
  values(p_ticket_id,v_uid,false,trim(p_body)) returning * into v_note;
  update public.support_ticket set status=v_new_status,updated_at=now() where id=p_ticket_id;
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,new_state,reason,ticket_id,metadata)
  values(v_uid,'SUPPORT_TICKET_REQUESTER_REPLY','SUPPORT_TICKET',p_ticket_id::text,jsonb_build_object('status',v_new_status),'Requester replied',p_ticket_id,jsonb_build_object('note_id',v_note.id));
  return v_note;
end;
$$;
revoke all on function public.reply_support_ticket(uuid,text) from public;
revoke all on function public.reply_support_ticket(uuid,text) from anon;
grant execute on function public.reply_support_ticket(uuid,text) to authenticated;

create or replace function public.reopen_support_ticket(p_ticket_id uuid,p_body text)
returns public.support_ticket
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid:=auth.uid();
  v_old public.support_ticket;
  v_new public.support_ticket;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_old from public.support_ticket where id=p_ticket_id and requester_user_id=v_uid for update;
  if not found then raise exception 'ticket_not_found'; end if;
  if v_old.status not in ('RESOLVED','CLOSED') then raise exception 'ticket_not_reopenable'; end if;
  if length(trim(coalesce(p_body,'')))<2 or length(trim(p_body))>4000 then raise exception 'reopen_reason_required'; end if;
  insert into public.ticket_note(ticket_id,author_user_id,internal,body) values(p_ticket_id,v_uid,false,trim(p_body));
  update public.support_ticket set status='OPEN',assigned_admin_id=null,updated_at=now() where id=p_ticket_id returning * into v_new;
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,ticket_id)
  values(v_uid,'SUPPORT_TICKET_REOPENED','SUPPORT_TICKET',p_ticket_id::text,to_jsonb(v_old),to_jsonb(v_new),trim(p_body),p_ticket_id);
  return v_new;
end;
$$;
revoke all on function public.reopen_support_ticket(uuid,text) from public;
revoke all on function public.reopen_support_ticket(uuid,text) from anon;
grant execute on function public.reopen_support_ticket(uuid,text) to authenticated;

-- Enforce the support state machine in the existing service command.
create or replace function public.service_update_support_ticket(
  p_ticket_id uuid,
  p_status text,
  p_assigned_admin_id uuid,
  p_actor_user_id uuid,
  p_reason text
)
returns public.support_ticket
language plpgsql
security definer
set search_path=public
as $$
declare
  v_old public.support_ticket;
  v_new public.support_ticket;
begin
  if p_status not in ('OPEN','IN_PROGRESS','WAITING_USER','WAITING_INTERNAL','RESOLVED','CLOSED') then raise exception 'invalid_ticket_status'; end if;
  if p_actor_user_id is null then raise exception 'actor_required'; end if;
  if length(trim(coalesce(p_reason,'')))<5 then raise exception 'change_reason_required'; end if;
  select * into v_old from public.support_ticket where id=p_ticket_id for update;
  if not found then raise exception 'ticket_not_found'; end if;

  if p_status<>v_old.status::text and not (
    (v_old.status='OPEN' and p_status in ('IN_PROGRESS','CLOSED')) or
    (v_old.status='IN_PROGRESS' and p_status in ('WAITING_USER','WAITING_INTERNAL','RESOLVED','CLOSED')) or
    (v_old.status='WAITING_USER' and p_status in ('IN_PROGRESS','WAITING_INTERNAL','RESOLVED','CLOSED')) or
    (v_old.status='WAITING_INTERNAL' and p_status in ('IN_PROGRESS','WAITING_USER','RESOLVED','CLOSED')) or
    (v_old.status='RESOLVED' and p_status in ('IN_PROGRESS','CLOSED')) or
    (v_old.status='CLOSED' and p_status='OPEN')
  ) then raise exception 'invalid_ticket_transition'; end if;

  update public.support_ticket
  set status=p_status::public.ticket_status,assigned_admin_id=p_assigned_admin_id,updated_at=now()
  where id=p_ticket_id returning * into v_new;
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,ticket_id)
  values(p_actor_user_id,'SUPPORT_TICKET_UPDATED','SUPPORT_TICKET',p_ticket_id::text,to_jsonb(v_old),to_jsonb(v_new),trim(p_reason),p_ticket_id);
  return v_new;
end;
$$;
revoke all on function public.service_update_support_ticket(uuid,text,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.service_update_support_ticket(uuid,text,uuid,uuid,text) to service_role;

create or replace function public.service_set_support_ticket_priority(p_ticket_id uuid,p_priority text,p_actor_user_id uuid,p_reason text)
returns public.support_ticket
language plpgsql
security definer
set search_path=public
as $$
declare v_old public.support_ticket;v_new public.support_ticket;
begin
  if p_priority not in ('LOW','NORMAL','HIGH','CRITICAL') then raise exception 'invalid_ticket_priority'; end if;
  if p_actor_user_id is null then raise exception 'actor_required'; end if;
  if length(trim(coalesce(p_reason,'')))<5 then raise exception 'change_reason_required'; end if;
  select * into v_old from public.support_ticket where id=p_ticket_id for update;
  if not found then raise exception 'ticket_not_found'; end if;
  update public.support_ticket set priority=p_priority,updated_at=now() where id=p_ticket_id returning * into v_new;
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,ticket_id)
  values(p_actor_user_id,'SUPPORT_TICKET_PRIORITY_UPDATED','SUPPORT_TICKET',p_ticket_id::text,to_jsonb(v_old),to_jsonb(v_new),trim(p_reason),p_ticket_id);
  return v_new;
end;
$$;
revoke all on function public.service_set_support_ticket_priority(uuid,text,uuid,text) from public,anon,authenticated;
grant execute on function public.service_set_support_ticket_priority(uuid,text,uuid,text) to service_role;

create or replace function public.service_reply_support_ticket(p_ticket_id uuid,p_body text,p_actor_user_id uuid)
returns public.ticket_note
language plpgsql
security definer
set search_path=public
as $$
declare v_old public.support_ticket;v_new public.support_ticket;v_note public.ticket_note;
begin
  if p_actor_user_id is null then raise exception 'actor_required'; end if;
  if length(trim(coalesce(p_body,'')))<2 or length(trim(p_body))>4000 then raise exception 'ticket_reply_invalid'; end if;
  select * into v_old from public.support_ticket where id=p_ticket_id for update;
  if not found then raise exception 'ticket_not_found'; end if;
  if v_old.status in ('RESOLVED','CLOSED') then raise exception 'ticket_reopen_before_reply'; end if;
  insert into public.ticket_note(ticket_id,author_user_id,internal,body)
  values(p_ticket_id,p_actor_user_id,false,trim(p_body)) returning * into v_note;
  update public.support_ticket set status='WAITING_USER',assigned_admin_id=coalesce(assigned_admin_id,p_actor_user_id),updated_at=now() where id=p_ticket_id returning * into v_new;
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,ticket_id,metadata)
  values(p_actor_user_id,'SUPPORT_TICKET_PUBLIC_REPLY','SUPPORT_TICKET',p_ticket_id::text,to_jsonb(v_old),to_jsonb(v_new),'Public support reply',p_ticket_id,jsonb_build_object('note_id',v_note.id));
  return v_note;
end;
$$;
revoke all on function public.service_reply_support_ticket(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.service_reply_support_ticket(uuid,text,uuid) to service_role;

-- Moderation state machine and audited evidence/signal operations.
create or replace function public.service_update_moderation_case(
  p_case_id uuid,
  p_status text,
  p_assigned_admin_id uuid,
  p_resolution jsonb,
  p_actor_user_id uuid,
  p_reason text
)
returns public.moderation_case
language plpgsql
security definer
set search_path=public
as $$
declare v_old public.moderation_case;v_new public.moderation_case;
begin
  if p_status not in ('OPEN','INVESTIGATING','ACTION_REQUIRED','RESOLVED','DISMISSED') then raise exception 'invalid_case_status'; end if;
  if p_actor_user_id is null then raise exception 'actor_required'; end if;
  if length(trim(coalesce(p_reason,'')))<5 then raise exception 'change_reason_required'; end if;
  select * into v_old from public.moderation_case where id=p_case_id for update;
  if not found then raise exception 'moderation_case_not_found'; end if;

  if p_status<>v_old.status::text and not (
    (v_old.status='OPEN' and p_status in ('INVESTIGATING','DISMISSED')) or
    (v_old.status='INVESTIGATING' and p_status in ('ACTION_REQUIRED','RESOLVED','DISMISSED')) or
    (v_old.status='ACTION_REQUIRED' and p_status in ('INVESTIGATING','RESOLVED','DISMISSED')) or
    (v_old.status in ('RESOLVED','DISMISSED') and p_status='OPEN')
  ) then raise exception 'invalid_moderation_transition'; end if;
  if p_status='RESOLVED' and coalesce(length(trim(p_resolution->>'summary')),0)<5 then raise exception 'moderation_resolution_required'; end if;

  update public.moderation_case
  set status=p_status::public.case_status,
      assigned_admin_id=p_assigned_admin_id,
      resolution=case when p_resolution is null then resolution else p_resolution end,
      updated_at=now()
  where id=p_case_id returning * into v_new;
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,metadata)
  values(p_actor_user_id,'MODERATION_CASE_UPDATED','MODERATION_CASE',p_case_id::text,to_jsonb(v_old),to_jsonb(v_new),trim(p_reason),jsonb_build_object('status',p_status));
  return v_new;
end;
$$;
revoke all on function public.service_update_moderation_case(uuid,text,uuid,jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.service_update_moderation_case(uuid,text,uuid,jsonb,uuid,text) to service_role;

create or replace function public.service_create_moderation_case(
  p_case_type text,p_severity text,p_summary text,
  p_reporter_user_id uuid,p_target_user_id uuid,p_target_club_id uuid,p_target_universe_id uuid,p_match_id uuid,
  p_assigned_admin_id uuid,p_evidence jsonb,p_signals jsonb,p_actor_user_id uuid,p_reason text
)
returns public.moderation_case
language plpgsql
security definer
set search_path=public
as $$
declare v_case public.moderation_case;
begin
  if p_case_type not in ('RESULT_DISPUTE','SOCIAL_REPORT','FRAUD','APPEAL','PAYMENT_RISK','OTHER') then raise exception 'invalid_case_type'; end if;
  if p_severity not in ('LOW','MEDIUM','HIGH','CRITICAL') then raise exception 'invalid_case_severity'; end if;
  if length(trim(coalesce(p_summary,'')))<5 or length(trim(p_summary))>500 then raise exception 'moderation_summary_invalid'; end if;
  if p_actor_user_id is null then raise exception 'actor_required'; end if;
  if length(trim(coalesce(p_reason,'')))<5 then raise exception 'change_reason_required'; end if;
  insert into public.moderation_case(case_type,status,severity,reporter_user_id,target_user_id,target_club_id,target_universe_id,match_id,assigned_admin_id,summary,evidence,signals)
  values(p_case_type,'OPEN',p_severity,p_reporter_user_id,p_target_user_id,p_target_club_id,p_target_universe_id,p_match_id,p_assigned_admin_id,trim(p_summary),coalesce(p_evidence,'[]'::jsonb),coalesce(p_signals,'{}'::jsonb))
  returning * into v_case;
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,new_state,reason,metadata)
  values(p_actor_user_id,'MODERATION_CASE_CREATED','MODERATION_CASE',v_case.id::text,to_jsonb(v_case),trim(p_reason),jsonb_build_object('case_type',p_case_type,'severity',p_severity));
  return v_case;
end;
$$;
revoke all on function public.service_create_moderation_case(text,text,text,uuid,uuid,uuid,uuid,uuid,uuid,jsonb,jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.service_create_moderation_case(text,text,text,uuid,uuid,uuid,uuid,uuid,uuid,jsonb,jsonb,uuid,text) to service_role;

create or replace function public.service_add_moderation_evidence(p_case_id uuid,p_evidence jsonb,p_actor_user_id uuid,p_reason text)
returns public.moderation_case
language plpgsql
security definer
set search_path=public
as $$
declare v_old public.moderation_case;v_new public.moderation_case;v_item jsonb;
begin
  if jsonb_typeof(coalesce(p_evidence,'null'::jsonb))<>'object' then raise exception 'moderation_evidence_must_be_object'; end if;
  if p_actor_user_id is null then raise exception 'actor_required'; end if;
  if length(trim(coalesce(p_reason,'')))<5 then raise exception 'change_reason_required'; end if;
  select * into v_old from public.moderation_case where id=p_case_id for update;
  if not found then raise exception 'moderation_case_not_found'; end if;
  v_item:=p_evidence||jsonb_build_object('added_by',p_actor_user_id,'added_at',now());
  update public.moderation_case set evidence=coalesce(evidence,'[]'::jsonb)||jsonb_build_array(v_item),updated_at=now() where id=p_case_id returning * into v_new;
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,metadata)
  values(p_actor_user_id,'MODERATION_EVIDENCE_ADDED','MODERATION_CASE',p_case_id::text,to_jsonb(v_old),to_jsonb(v_new),trim(p_reason),jsonb_build_object('evidence',v_item));
  return v_new;
end;
$$;
revoke all on function public.service_add_moderation_evidence(uuid,jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.service_add_moderation_evidence(uuid,jsonb,uuid,text) to service_role;

create or replace function public.service_add_moderation_signal(p_case_id uuid,p_signal_key text,p_signal_value jsonb,p_actor_user_id uuid,p_reason text)
returns public.moderation_case
language plpgsql
security definer
set search_path=public
as $$
declare v_old public.moderation_case;v_new public.moderation_case;v_signal jsonb;
begin
  if length(trim(coalesce(p_signal_key,'')))<2 or length(trim(p_signal_key))>80 then raise exception 'moderation_signal_key_invalid'; end if;
  if p_actor_user_id is null then raise exception 'actor_required'; end if;
  if length(trim(coalesce(p_reason,'')))<5 then raise exception 'change_reason_required'; end if;
  select * into v_old from public.moderation_case where id=p_case_id for update;
  if not found then raise exception 'moderation_case_not_found'; end if;
  v_signal:=jsonb_build_object('value',coalesce(p_signal_value,'null'::jsonb),'recorded_by',p_actor_user_id,'recorded_at',now());
  update public.moderation_case set signals=coalesce(signals,'{}'::jsonb)||jsonb_build_object(trim(p_signal_key),v_signal),updated_at=now() where id=p_case_id returning * into v_new;
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,metadata)
  values(p_actor_user_id,'MODERATION_SIGNAL_RECORDED','MODERATION_CASE',p_case_id::text,to_jsonb(v_old),to_jsonb(v_new),trim(p_reason),jsonb_build_object('signal_key',trim(p_signal_key)));
  return v_new;
end;
$$;
revoke all on function public.service_add_moderation_signal(uuid,text,jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.service_add_moderation_signal(uuid,text,jsonb,uuid,text) to service_role;

-- Detector-friendly fraud primitive. Reuses an active case when the same signal/target is already open.
create or replace function public.service_upsert_fraud_case(
  p_signal_key text,p_signal_value jsonb,p_severity text,p_summary text,
  p_target_user_id uuid,p_target_club_id uuid,p_target_universe_id uuid,p_match_id uuid,
  p_actor_user_id uuid
)
returns public.moderation_case
language plpgsql
security definer
set search_path=public
as $$
declare v_case public.moderation_case;v_rank integer;v_current_rank integer;v_signal jsonb;
begin
  if p_severity not in ('LOW','MEDIUM','HIGH','CRITICAL') then raise exception 'invalid_case_severity'; end if;
  if length(trim(coalesce(p_signal_key,'')))<2 then raise exception 'fraud_signal_key_required'; end if;
  if length(trim(coalesce(p_summary,'')))<5 then raise exception 'fraud_summary_required'; end if;
  if p_target_user_id is null and p_target_club_id is null and p_target_universe_id is null and p_match_id is null then raise exception 'fraud_target_required'; end if;

  select * into v_case
  from public.moderation_case
  where case_type='FRAUD' and status in ('OPEN','INVESTIGATING','ACTION_REQUIRED')
    and target_user_id is not distinct from p_target_user_id
    and target_club_id is not distinct from p_target_club_id
    and target_universe_id is not distinct from p_target_universe_id
    and match_id is not distinct from p_match_id
    and signals ? trim(p_signal_key)
  order by created_at desc limit 1 for update;

  v_signal:=jsonb_build_object('value',coalesce(p_signal_value,'null'::jsonb),'recorded_by',p_actor_user_id,'recorded_at',now());
  if not found then
    insert into public.moderation_case(case_type,status,severity,target_user_id,target_club_id,target_universe_id,match_id,summary,signals)
    values('FRAUD','OPEN',p_severity,p_target_user_id,p_target_club_id,p_target_universe_id,p_match_id,trim(p_summary),jsonb_build_object(trim(p_signal_key),v_signal))
    returning * into v_case;
    insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,new_state,reason,metadata)
    values(p_actor_user_id,'FRAUD_CASE_AUTO_CREATED','MODERATION_CASE',v_case.id::text,to_jsonb(v_case),'Fraud signal opened a case',jsonb_build_object('signal_key',trim(p_signal_key)));
  else
    v_rank:=case p_severity when 'CRITICAL' then 4 when 'HIGH' then 3 when 'MEDIUM' then 2 else 1 end;
    v_current_rank:=case v_case.severity when 'CRITICAL' then 4 when 'HIGH' then 3 when 'MEDIUM' then 2 else 1 end;
    update public.moderation_case
    set severity=case when v_rank>v_current_rank then p_severity else severity end,
        signals=coalesce(signals,'{}'::jsonb)||jsonb_build_object(trim(p_signal_key),v_signal),updated_at=now()
    where id=v_case.id returning * into v_case;
    insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,new_state,reason,metadata)
    values(p_actor_user_id,'FRAUD_CASE_SIGNAL_UPDATED','MODERATION_CASE',v_case.id::text,to_jsonb(v_case),'Fraud signal updated active case',jsonb_build_object('signal_key',trim(p_signal_key)));
  end if;
  return v_case;
end;
$$;
revoke all on function public.service_upsert_fraud_case(text,jsonb,text,text,uuid,uuid,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.service_upsert_fraud_case(text,jsonb,text,text,uuid,uuid,uuid,uuid,uuid) to service_role;
