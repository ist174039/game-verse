-- Clã das Sombras — auditable governance commands for backoffice

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  old_state jsonb,
  new_state jsonb,
  reason text,
  ticket_id uuid references public.support_ticket(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_target_idx on public.admin_audit_log(target_type,target_id,created_at desc);
create index if not exists admin_audit_actor_idx on public.admin_audit_log(actor_user_id,created_at desc);

create or replace function public.service_set_platform_config(
  p_key text,
  p_category text,
  p_value jsonb,
  p_effective_from timestamptz,
  p_actor_user_id uuid,
  p_reason text,
  p_ticket_id uuid default null
)
returns public.platform_config
language plpgsql security definer set search_path=public
as $$
declare v_old public.platform_config; v_new public.platform_config; v_version integer;
begin
  if length(trim(p_key))<2 then raise exception 'config_key_required'; end if;
  if length(trim(p_reason))<5 then raise exception 'change_reason_required'; end if;
  select * into v_old from public.platform_config where key=p_key for update;
  v_version:=coalesce(v_old.version,0)+1;
  if found then
    insert into public.platform_config_history(key,category,value,version,effective_from,changed_by,reason)
    values(v_old.key,v_old.category,v_old.value,v_old.version,v_old.effective_from,p_actor_user_id,p_reason)
    on conflict(key,version) do nothing;
  end if;
  insert into public.platform_config(key,category,value,version,effective_from,updated_by,updated_at)
  values(p_key,p_category,coalesce(p_value,'{}'::jsonb),v_version,coalesce(p_effective_from,now()),p_actor_user_id,now())
  on conflict(key) do update set category=excluded.category,value=excluded.value,version=excluded.version,effective_from=excluded.effective_from,updated_by=excluded.updated_by,updated_at=now()
  returning * into v_new;
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,ticket_id)
  values(p_actor_user_id,'CONFIG_UPDATED','PLATFORM_CONFIG',p_key,to_jsonb(v_old),to_jsonb(v_new),p_reason,p_ticket_id);
  return v_new;
end; $$;
revoke all on function public.service_set_platform_config(text,text,jsonb,timestamptz,uuid,text,uuid) from public;
grant execute on function public.service_set_platform_config(text,text,jsonb,timestamptz,uuid,text,uuid) to service_role;

create or replace function public.service_set_feature_flag(
  p_key text,
  p_enabled boolean,
  p_scope text,
  p_scope_reference text,
  p_configuration jsonb,
  p_actor_user_id uuid,
  p_reason text
)
returns public.feature_flag
language plpgsql security definer set search_path=public
as $$
declare v_old public.feature_flag; v_new public.feature_flag;
begin
  if p_scope not in ('GLOBAL','ENVIRONMENT','UNIVERSE','COHORT') then raise exception 'invalid_feature_flag_scope'; end if;
  if length(trim(p_reason))<5 then raise exception 'change_reason_required'; end if;
  select * into v_old from public.feature_flag where key=p_key for update;
  insert into public.feature_flag(key,enabled,scope,scope_reference,configuration,updated_by,updated_at)
  values(p_key,p_enabled,p_scope,p_scope_reference,coalesce(p_configuration,'{}'::jsonb),p_actor_user_id,now())
  on conflict(key) do update set enabled=excluded.enabled,scope=excluded.scope,scope_reference=excluded.scope_reference,configuration=excluded.configuration,updated_by=excluded.updated_by,updated_at=now()
  returning * into v_new;
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason)
  values(p_actor_user_id,'FEATURE_FLAG_UPDATED','FEATURE_FLAG',p_key,to_jsonb(v_old),to_jsonb(v_new),p_reason);
  return v_new;
end; $$;
revoke all on function public.service_set_feature_flag(text,boolean,text,text,jsonb,uuid,text) from public;
grant execute on function public.service_set_feature_flag(text,boolean,text,text,jsonb,uuid,text) to service_role;

create or replace function public.service_create_economic_freeze(
  p_scope text,
  p_user_id uuid,
  p_club_id uuid,
  p_universe_id uuid,
  p_reason text,
  p_case_id uuid,
  p_actor_user_id uuid
)
returns public.economic_freeze
language plpgsql security definer set search_path=public
as $$
declare v_freeze public.economic_freeze;
begin
  if length(trim(p_reason))<5 then raise exception 'freeze_reason_required'; end if;
  if p_scope='USER' and (p_user_id is null or p_club_id is not null or p_universe_id is not null) then raise exception 'invalid_user_freeze_scope';
  elsif p_scope='CLUB' and (p_club_id is null or p_user_id is not null or p_universe_id is not null) then raise exception 'invalid_club_freeze_scope';
  elsif p_scope='UNIVERSE' and (p_universe_id is null or p_user_id is not null or p_club_id is not null) then raise exception 'invalid_universe_freeze_scope';
  elsif p_scope not in ('USER','CLUB','UNIVERSE') then raise exception 'invalid_freeze_scope'; end if;
  insert into public.economic_freeze(scope,user_id,club_id,universe_id,reason,case_id,created_by)
  values(p_scope,p_user_id,p_club_id,p_universe_id,trim(p_reason),p_case_id,p_actor_user_id)
  returning * into v_freeze;
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,new_state,reason,metadata)
  values(p_actor_user_id,'ECONOMIC_FREEZE_CREATED',p_scope,coalesce(p_user_id::text,p_club_id::text,p_universe_id::text),to_jsonb(v_freeze),p_reason,jsonb_build_object('case_id',p_case_id));
  return v_freeze;
end; $$;
revoke all on function public.service_create_economic_freeze(text,uuid,uuid,uuid,text,uuid,uuid) from public;
grant execute on function public.service_create_economic_freeze(text,uuid,uuid,uuid,text,uuid,uuid) to service_role;

create or replace function public.service_release_economic_freeze(
  p_freeze_id uuid,
  p_actor_user_id uuid,
  p_reason text
)
returns public.economic_freeze
language plpgsql security definer set search_path=public
as $$
declare v_old public.economic_freeze; v_new public.economic_freeze;
begin
  if length(trim(p_reason))<5 then raise exception 'release_reason_required'; end if;
  select * into v_old from public.economic_freeze where id=p_freeze_id for update;
  if not found then raise exception 'freeze_not_found'; end if;
  update public.economic_freeze set active=false,released_by=p_actor_user_id,released_at=now() where id=p_freeze_id returning * into v_new;
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason)
  values(p_actor_user_id,'ECONOMIC_FREEZE_RELEASED','ECONOMIC_FREEZE',p_freeze_id::text,to_jsonb(v_old),to_jsonb(v_new),p_reason);
  return v_new;
end; $$;
revoke all on function public.service_release_economic_freeze(uuid,uuid,text) from public;
grant execute on function public.service_release_economic_freeze(uuid,uuid,text) to service_role;

alter table public.admin_audit_log enable row level security;
-- Intentionally no authenticated policy: audit data is server/backoffice only.
