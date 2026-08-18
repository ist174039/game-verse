-- Clã das Sombras — PESDB/eFootball provider ingestion and universe materialisation
-- Apply after 00340_security_privilege_hardening.sql.
-- PESDB remains an external provider. The application stores canonical structured facts,
-- immutable snapshots and universe-scoped economic values; gameplay never depends on provider HTML.

create table if not exists public.player_provider_sync_run (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_version text,
  sync_type text not null check (sync_type in ('CATALOG_PAGE','DETAIL_BATCH')),
  page_number integer,
  requested_count integer not null default 0 check (requested_count >= 0),
  imported_count integer not null default 0 check (imported_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  status text not null check (status in ('COMPLETED','PARTIAL','FAILED')),
  actor_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);
create index if not exists player_provider_sync_run_provider_idx on public.player_provider_sync_run(provider,completed_at desc);
alter table public.player_provider_sync_run enable row level security;

insert into public.platform_config(key,category,value)
values
  ('players.provider','PLAYERS','{"provider":"PESDB_EFOOTBALL","base_url":"https://pesdb.net/efootball/","catalog_batch_pages":1,"detail_batch_size":6}'::jsonb),
  ('players.valuation.default','PLAYERS','{"price_per_overall_squared":4,"market_value_pct":100,"salary_per_overall":4,"min_platform_price":1000,"min_salary":100}'::jsonb),
  ('players.starter','PLAYERS','{"min_overall":55,"max_overall":70}'::jsonb)
on conflict(key) do nothing;

-- Merge provider facts instead of erasing richer detail data when a later catalog-only sync runs.
-- A snapshot is appended only when the canonical provider state actually changes.
create or replace function public.service_upsert_provider_player(
  p_provider text,
  p_external_id text,
  p_provider_version text,
  p_name text,
  p_position text,
  p_overall integer,
  p_nationality text,
  p_image_url text,
  p_attributes jsonb,
  p_popularity_index numeric,
  p_source_payload jsonb
)
returns public.player_master
language plpgsql security definer set search_path=public as $$
declare
  v_before public.player_master;
  v_player public.player_master;
  v_merged_attributes jsonb;
  v_changed boolean:=false;
begin
  if nullif(trim(coalesce(p_provider,'')),'') is null then raise exception 'provider_required'; end if;
  if nullif(trim(coalesce(p_external_id,'')),'') is null then raise exception 'external_id_required'; end if;
  if nullif(trim(coalesce(p_name,'')),'') is null then raise exception 'player_name_required'; end if;
  if nullif(trim(coalesce(p_position,'')),'') is null then raise exception 'player_position_required'; end if;
  if p_overall < 1 or p_overall > 100 then raise exception 'invalid_overall'; end if;

  select * into v_before from public.player_master where provider=p_provider and external_id=p_external_id for update;
  v_merged_attributes:=coalesce(v_before.attributes,'{}'::jsonb)||coalesce(p_attributes,'{}'::jsonb);

  if not found then
    insert into public.player_master(provider,external_id,provider_version,name,position,overall,nationality,image_url,attributes,popularity_index,updated_at)
    values(p_provider,p_external_id,p_provider_version,trim(p_name),trim(p_position),p_overall,nullif(trim(coalesce(p_nationality,'')),''),nullif(trim(coalesce(p_image_url,'')),''),coalesce(p_attributes,'{}'::jsonb),p_popularity_index,now())
    returning * into v_player;
    v_changed:=true;
  else
    v_changed := v_before.provider_version is distinct from p_provider_version
      or v_before.name is distinct from trim(p_name)
      or v_before.position is distinct from trim(p_position)
      or v_before.overall is distinct from p_overall
      or v_before.nationality is distinct from nullif(trim(coalesce(p_nationality,'')),'')
      or v_before.image_url is distinct from coalesce(nullif(trim(coalesce(p_image_url,'')),''),v_before.image_url)
      or v_before.attributes is distinct from v_merged_attributes
      or (p_popularity_index is not null and v_before.popularity_index is distinct from p_popularity_index);

    update public.player_master
    set provider_version=p_provider_version,
        name=trim(p_name),
        position=trim(p_position),
        overall=p_overall,
        nationality=nullif(trim(coalesce(p_nationality,'')),''),
        image_url=coalesce(nullif(trim(coalesce(p_image_url,'')),''),image_url),
        attributes=v_merged_attributes,
        popularity_index=coalesce(p_popularity_index,popularity_index),
        updated_at=case when v_changed then now() else updated_at end
    where id=v_before.id
    returning * into v_player;
  end if;

  if v_changed then
    insert into public.player_provider_snapshot(player_id,provider,external_id,provider_version,overall,attributes,source_payload)
    values(v_player.id,p_provider,p_external_id,p_provider_version,p_overall,v_player.attributes,coalesce(p_source_payload,'{}'::jsonb));
  end if;
  return v_player;
end;
$$;
revoke all on function public.service_upsert_provider_player(text,text,text,text,text,integer,text,text,jsonb,numeric,jsonb) from public,anon,authenticated;
grant execute on function public.service_upsert_provider_player(text,text,text,text,text,integer,text,text,jsonb,numeric,jsonb) to service_role;

create or replace function public.service_record_provider_sync(
  p_provider text,
  p_provider_version text,
  p_sync_type text,
  p_page_number integer,
  p_requested_count integer,
  p_imported_count integer,
  p_failed_count integer,
  p_status text,
  p_actor_user_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if p_sync_type not in ('CATALOG_PAGE','DETAIL_BATCH') then raise exception 'invalid_sync_type'; end if;
  if p_status not in ('COMPLETED','PARTIAL','FAILED') then raise exception 'invalid_sync_status'; end if;
  if least(p_requested_count,p_imported_count,p_failed_count)<0 then raise exception 'invalid_sync_counts'; end if;
  insert into public.player_provider_sync_run(provider,provider_version,sync_type,page_number,requested_count,imported_count,failed_count,status,actor_user_id,metadata)
  values(p_provider,p_provider_version,p_sync_type,p_page_number,p_requested_count,p_imported_count,p_failed_count,p_status,p_actor_user_id,coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,new_state,reason,metadata)
  values(p_actor_user_id,'PLAYER_PROVIDER_SYNC','PLAYER_PROVIDER',p_provider,jsonb_build_object('run_id',v_id,'provider_version',p_provider_version,'sync_type',p_sync_type,'status',p_status,'imported',p_imported_count,'failed',p_failed_count),'Provider catalogue synchronisation',coalesce(p_metadata,'{}'::jsonb));
  return v_id;
end;
$$;
revoke all on function public.service_record_provider_sync(text,text,text,integer,integer,integer,integer,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.service_record_provider_sync(text,text,text,integer,integer,integer,integer,text,uuid,jsonb) to service_role;

-- Starter squads deliberately exclude elite assets. The threshold is versioned configuration,
-- not a frontend constant, so platform governance can rebalance it without changing player ratings.
create or replace function public.service_assign_starter_squad(p_club_id uuid)
returns integer
language plpgsql security definer set search_path=public as $$
declare
  v_club public.club;
  v_universe public.universe;
  v_cfg jsonb;
  v_min_overall integer:=55;
  v_max_overall integer:=70;
  v_existing integer:=0;
  v_needed integer:=0;
  v_asset record;
  v_season uuid;
  v_assigned integer:=0;
begin
  select * into v_club from public.club where id=p_club_id for update;
  if not found then raise exception 'club_not_found'; end if;
  select * into v_universe from public.universe where id=v_club.universe_id;
  select value into v_cfg from public.platform_config where key='players.starter';
  v_min_overall:=coalesce((v_cfg->>'min_overall')::integer,55);
  v_max_overall:=coalesce((v_cfg->>'max_overall')::integer,70);
  if v_min_overall<1 or v_max_overall>100 or v_min_overall>v_max_overall then raise exception 'invalid_starter_rating_policy'; end if;

  select count(*) into v_existing from public.universe_player where owner_club_id=p_club_id and status in ('ACTIVE','RESERVE','UNAVAILABLE','LISTED','AUCTION');
  v_needed:=greatest(0,v_universe.min_squad_size-v_existing);
  if v_needed=0 then return 0; end if;

  select id into v_season from public.season
  where universe_id=v_club.universe_id and status in ('ACTIVE','REGISTRATION','SCHEDULED')
  order by case status when 'ACTIVE' then 0 when 'REGISTRATION' then 1 else 2 end,created_at desc
  limit 1;

  for v_asset in
    select up.id,up.salary_reference
    from public.universe_player up
    join public.player_master pm on pm.id=up.player_id
    where up.universe_id=v_club.universe_id
      and up.owner_club_id is null
      and up.status='AVAILABLE'
      and pm.overall between v_min_overall and v_max_overall
    order by up.market_reference_value asc,pm.overall asc,up.id
    for update of up skip locked
    limit v_needed
  loop
    update public.universe_player set owner_club_id=p_club_id,status='ACTIVE',acquired_at=now(),updated_at=now() where id=v_asset.id;
    insert into public.player_contract(universe_player_id,club_id,salary,start_season_id,status,clauses)
    values(v_asset.id,p_club_id,v_asset.salary_reference,v_season,'ACTIVE',jsonb_build_object('source','STARTER_SQUAD','granted_at',now()))
    on conflict do nothing;
    v_assigned:=v_assigned+1;
  end loop;
  return v_assigned;
end;
$$;
revoke all on function public.service_assign_starter_squad(uuid) from public,anon,authenticated;
grant execute on function public.service_assign_starter_squad(uuid) to service_role;

create or replace function public.service_materialize_provider_players(
  p_universe_id uuid,
  p_provider text,
  p_limit integer default 500,
  p_rebootstrap boolean default true,
  p_actor_user_id uuid default null
)
returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_universe public.universe;
  v_cfg jsonb;
  v_master public.player_master;
  v_asset public.universe_player;
  v_price_factor numeric;
  v_market_pct numeric;
  v_salary_factor numeric;
  v_min_price bigint;
  v_min_salary bigint;
  v_price bigint;
  v_market bigint;
  v_salary bigint;
  v_inserted integer:=0;
  v_updated integer:=0;
  v_starter integer:=0;
  v_before_price bigint;
  v_before_market bigint;
  v_before_salary bigint;
  v_club record;
begin
  if nullif(trim(coalesce(p_provider,'')),'') is null then raise exception 'provider_required'; end if;
  if p_limit<1 or p_limit>5000 then raise exception 'materialize_limit_out_of_range'; end if;
  select * into v_universe from public.universe where id=p_universe_id;
  if not found then raise exception 'universe_not_found'; end if;

  select value into v_cfg from public.platform_config where key='players.valuation.default';
  v_cfg:=coalesce(v_cfg,'{}'::jsonb);
  v_price_factor:=coalesce((v_cfg->>'price_per_overall_squared')::numeric,4);
  v_market_pct:=coalesce((v_cfg->>'market_value_pct')::numeric,100);
  v_salary_factor:=coalesce((v_cfg->>'salary_per_overall')::numeric,4);
  v_min_price:=coalesce((v_cfg->>'min_platform_price')::bigint,1000);
  v_min_salary:=coalesce((v_cfg->>'min_salary')::bigint,100);

  for v_master in
    select pm.*
    from public.player_master pm
    left join public.universe_player up on up.universe_id=p_universe_id and up.player_id=pm.id
    where pm.provider=p_provider
    order by (up.id is null) desc,pm.overall asc,pm.id
    limit p_limit
  loop
    v_price:=greatest(v_min_price,round(v_master.overall*v_master.overall*v_price_factor)::bigint);
    v_market:=greatest(0,round(v_price*v_market_pct/100.0)::bigint);
    v_salary:=greatest(v_min_salary,round(v_master.overall*v_salary_factor)::bigint);

    select * into v_asset from public.universe_player where universe_id=p_universe_id and player_id=v_master.id for update;
    if not found then
      insert into public.universe_player(universe_id,player_id,status,platform_price,market_reference_value,salary_reference)
      values(p_universe_id,v_master.id,'AVAILABLE',v_price,v_market,v_salary)
      returning * into v_asset;
      insert into public.universe_player_valuation(universe_player_id,overall,platform_price,market_reference_value,salary_reference,reason)
      values(v_asset.id,v_master.overall,v_price,v_market,v_salary,'PROVIDER_IMPORT');
      v_inserted:=v_inserted+1;
    else
      v_before_price:=v_asset.platform_price;v_before_market:=v_asset.market_reference_value;v_before_salary:=v_asset.salary_reference;
      if v_before_price is distinct from v_price or v_before_market is distinct from v_market or v_before_salary is distinct from v_salary then
        update public.universe_player set platform_price=v_price,market_reference_value=v_market,salary_reference=v_salary,updated_at=now() where id=v_asset.id returning * into v_asset;
        insert into public.universe_player_valuation(universe_player_id,overall,platform_price,market_reference_value,salary_reference,reason)
        values(v_asset.id,v_master.overall,v_price,v_market,v_salary,'PROVIDER_UPDATE');
        v_updated:=v_updated+1;
      end if;
    end if;
  end loop;

  if p_rebootstrap then
    for v_club in select id from public.club where universe_id=p_universe_id order by created_at loop
      begin
        v_starter:=v_starter+public.service_assign_starter_squad(v_club.id);
      exception when others then
        raise warning 'starter squad rebootstrap failed for %: %',v_club.id,sqlerrm;
      end;
    end loop;
  end if;

  if p_actor_user_id is not null then
    insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,new_state,reason,metadata)
    values(p_actor_user_id,'PLAYER_PROVIDER_MATERIALIZE','UNIVERSE',p_universe_id::text,jsonb_build_object('provider',p_provider,'inserted',v_inserted,'revalued',v_updated,'starter_players_assigned',v_starter),'Materialise provider players into universe',jsonb_build_object('limit',p_limit,'rebootstrap',p_rebootstrap));
  end if;

  return jsonb_build_object(
    'universe_id',p_universe_id,
    'provider',p_provider,
    'inserted',v_inserted,
    'revalued',v_updated,
    'starter_players_assigned',v_starter,
    'available_after',(select count(*) from public.universe_player where universe_id=p_universe_id and owner_club_id is null and status='AVAILABLE'),
    'starter_eligible_after',(select count(*) from public.universe_player up join public.player_master pm on pm.id=up.player_id cross join lateral (select value from public.platform_config where key='players.starter') cfg where up.universe_id=p_universe_id and up.owner_club_id is null and up.status='AVAILABLE' and pm.overall between coalesce((cfg.value->>'min_overall')::integer,55) and coalesce((cfg.value->>'max_overall')::integer,70))
  );
end;
$$;
revoke all on function public.service_materialize_provider_players(uuid,text,integer,boolean,uuid) from public,anon,authenticated;
grant execute on function public.service_materialize_provider_players(uuid,text,integer,boolean,uuid) to service_role;

-- 00340 removed implicit function execution. Keep the same invariant for objects introduced here.
revoke all privileges on public.player_provider_sync_run from anon;
revoke all privileges on all sequences in schema public from anon;
