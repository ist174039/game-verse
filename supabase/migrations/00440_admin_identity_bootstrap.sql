-- Clã das Sombras — persisted admin identities and secure first-admin bootstrap
-- Apply after 00430_squad_operational_management.sql.

create table if not exists public.admin_user (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in (
    'super_admin','platform_admin','economy_admin','competition_admin',
    'moderator','support_agent','finance_operator','read_only_analyst'
  )),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_user_active_role_idx
  on public.admin_user(active,role)
  where active;

alter table public.admin_user enable row level security;
revoke all on public.admin_user from public,anon,authenticated;
grant select on public.admin_user to authenticated;

drop policy if exists admin_user_self_read on public.admin_user;
create policy admin_user_self_read on public.admin_user
for select to authenticated
using (user_id=auth.uid());

-- Backfill legacy administrators that were previously represented only by Auth app_metadata.role.
insert into public.admin_user(user_id,role,active,created_by,created_at,updated_at)
select
  u.id,
  u.raw_app_meta_data->>'role',
  true,
  null,
  coalesce(u.created_at,now()),
  now()
from auth.users u
where (u.raw_app_meta_data->>'role') in (
  'super_admin','platform_admin','economy_admin','competition_admin',
  'moderator','support_agent','finance_operator','read_only_analyst'
)
on conflict(user_id) do nothing;

create or replace function public.service_bootstrap_admin_by_email(
  p_email text,
  p_reason text default 'Initial platform administrator bootstrap'
)
returns public.admin_user
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_email text:=lower(trim(coalesce(p_email,'')));
  v_user auth.users;
  v_admin public.admin_user;
  v_old public.admin_user;
begin
  if length(v_email)<3 or position('@' in v_email)=0 then raise exception 'valid_admin_email_required'; end if;
  if length(trim(coalesce(p_reason,'')))<5 then raise exception 'bootstrap_reason_required'; end if;

  select * into v_user
  from auth.users
  where lower(email)=v_email
  order by created_at asc
  limit 1;
  if not found then raise exception 'auth_user_not_found'; end if;

  select * into v_old from public.admin_user where user_id=v_user.id for update;
  if found and v_old.active and v_old.role='super_admin' then
    return v_old;
  end if;

  -- One-shot bootstrap / recovery: once another active admin exists, this path closes.
  if exists(select 1 from public.admin_user where active and user_id<>v_user.id) then
    raise exception 'admin_bootstrap_closed';
  end if;

  insert into public.admin_user(user_id,role,active,created_by,created_at,updated_at)
  values(v_user.id,'super_admin',true,null,coalesce(v_old.created_at,now()),now())
  on conflict(user_id) do update
    set role='super_admin',active=true,updated_at=now()
  returning * into v_admin;

  -- Compatibility mirror only. Authorization source of truth is public.admin_user.
  update auth.users
  set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb) || jsonb_build_object('role','super_admin'),
      updated_at=now()
  where id=v_user.id;

  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,metadata)
  values(
    null,'ADMIN_BOOTSTRAPPED','ADMIN_USER',v_user.id::text,
    case when v_old.user_id is null then null else to_jsonb(v_old) end,
    to_jsonb(v_admin),trim(p_reason),
    jsonb_build_object('email',v_email,'bootstrap',true)
  );

  return v_admin;
end;
$$;
revoke all on function public.service_bootstrap_admin_by_email(text,text) from public,anon,authenticated;
grant execute on function public.service_bootstrap_admin_by_email(text,text) to service_role;

create or replace function public.service_set_admin_user(
  p_user_id uuid,
  p_role text,
  p_active boolean,
  p_actor_user_id uuid,
  p_reason text
)
returns public.admin_user
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_actor public.admin_user;
  v_old public.admin_user;
  v_new public.admin_user;
  v_target_exists boolean:=false;
begin
  if p_role not in (
    'super_admin','platform_admin','economy_admin','competition_admin',
    'moderator','support_agent','finance_operator','read_only_analyst'
  ) then raise exception 'invalid_admin_role'; end if;
  if length(trim(coalesce(p_reason,'')))<5 then raise exception 'admin_change_reason_required'; end if;

  select * into v_actor from public.admin_user where user_id=p_actor_user_id and active for update;
  if not found or v_actor.role not in ('super_admin','platform_admin') then raise exception 'admin_management_forbidden'; end if;
  if p_role='super_admin' and v_actor.role<>'super_admin' then raise exception 'super_admin_assignment_forbidden'; end if;

  select exists(select 1 from auth.users where id=p_user_id) into v_target_exists;
  if not v_target_exists then raise exception 'auth_user_not_found'; end if;

  select * into v_old from public.admin_user where user_id=p_user_id for update;
  if found and v_old.role='super_admin' and v_actor.role<>'super_admin' then raise exception 'super_admin_management_forbidden'; end if;

  if found and v_old.active and v_old.role='super_admin' and (not p_active or p_role<>'super_admin') then
    if not exists(select 1 from public.admin_user where active and role='super_admin' and user_id<>p_user_id) then
      raise exception 'last_super_admin_protected';
    end if;
  end if;

  insert into public.admin_user(user_id,role,active,created_by,created_at,updated_at)
  values(p_user_id,p_role,p_active,p_actor_user_id,now(),now())
  on conflict(user_id) do update
    set role=excluded.role,active=excluded.active,updated_at=now()
  returning * into v_new;

  update auth.users
  set raw_app_meta_data=case
        when p_active then coalesce(raw_app_meta_data,'{}'::jsonb) || jsonb_build_object('role',p_role)
        else coalesce(raw_app_meta_data,'{}'::jsonb) - 'role'
      end,
      updated_at=now()
  where id=p_user_id;

  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason)
  values(
    p_actor_user_id,
    case when v_old.user_id is null then 'ADMIN_USER_CREATED' when p_active then 'ADMIN_USER_UPDATED' else 'ADMIN_USER_DISABLED' end,
    'ADMIN_USER',p_user_id::text,
    case when v_old.user_id is null then null else to_jsonb(v_old) end,
    to_jsonb(v_new),trim(p_reason)
  );

  return v_new;
end;
$$;
revoke all on function public.service_set_admin_user(uuid,text,boolean,uuid,text) from public,anon,authenticated;
grant execute on function public.service_set_admin_user(uuid,text,boolean,uuid,text) to service_role;
