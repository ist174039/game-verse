-- Clã das Sombras — playable club bootstrap and dashboard readiness
-- Apply after 00320_operational_economy.sql.

create or replace function public.service_assign_starter_squad(p_club_id uuid)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  v_club public.club;
  v_universe public.universe;
  v_existing integer:=0;
  v_needed integer:=0;
  v_asset record;
  v_season uuid;
  v_assigned integer:=0;
begin
  select * into v_club from public.club where id=p_club_id for update;
  if not found then raise exception 'club_not_found'; end if;
  select * into v_universe from public.universe where id=v_club.universe_id;
  select count(*) into v_existing from public.universe_player where owner_club_id=p_club_id and status in ('ACTIVE','RESERVE','UNAVAILABLE','LISTED','AUCTION');
  v_needed:=greatest(0,v_universe.min_squad_size-v_existing);
  if v_needed=0 then return 0; end if;

  select id into v_season from public.season
  where universe_id=v_club.universe_id and status in ('ACTIVE','REGISTRATION','SCHEDULED')
  order by case status when 'ACTIVE' then 0 when 'REGISTRATION' then 1 else 2 end, created_at desc
  limit 1;

  for v_asset in
    select up.id,up.salary_reference
    from public.universe_player up
    join public.player_master pm on pm.id=up.player_id
    where up.universe_id=v_club.universe_id and up.owner_club_id is null and up.status='AVAILABLE'
    order by up.market_reference_value asc,pm.overall asc,up.id
    for update of up skip locked
    limit v_needed
  loop
    update public.universe_player
    set owner_club_id=p_club_id,status='ACTIVE',acquired_at=now(),updated_at=now()
    where id=v_asset.id;
    insert into public.player_contract(universe_player_id,club_id,salary,start_season_id,status,clauses)
    values(v_asset.id,p_club_id,v_asset.salary_reference,v_season,'ACTIVE',jsonb_build_object('source','STARTER_SQUAD','granted_at',now()))
    on conflict do nothing;
    v_assigned:=v_assigned+1;
  end loop;
  return v_assigned;
end;
$$;
revoke all on function public.service_assign_starter_squad(uuid) from public;
grant execute on function public.service_assign_starter_squad(uuid) to service_role;

create or replace function public.service_bootstrap_club(p_club_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_club public.club;
  v_cfg jsonb;
  v_starter integer:=0;
  v_sponsor uuid;
begin
  select * into v_club from public.club where id=p_club_id;
  if not found then raise exception 'club_not_found'; end if;
  select value into v_cfg from public.platform_config where key='economy.infrastructure_upgrade';
  v_cfg:=coalesce(v_cfg,'{}'::jsonb);

  insert into public.club_infrastructure(club_id,infrastructure_type,level,maintenance_cost)
  values
    (p_club_id,'STADIUM',1,coalesce((v_cfg->'maintenance'->>'STADIUM')::bigint,1200)),
    (p_club_id,'ACADEMY',1,coalesce((v_cfg->'maintenance'->>'ACADEMY')::bigint,900)),
    (p_club_id,'TRAINING',1,coalesce((v_cfg->'maintenance'->>'TRAINING')::bigint,800)),
    (p_club_id,'MARKETING',1,coalesce((v_cfg->'maintenance'->>'MARKETING')::bigint,650)),
    (p_club_id,'FINANCE',1,coalesce((v_cfg->'maintenance'->>'FINANCE')::bigint,700))
  on conflict(club_id,infrastructure_type) do nothing;

  begin
    v_starter:=public.service_assign_starter_squad(p_club_id);
  exception when others then
    raise warning 'starter squad bootstrap failed for %: %',p_club_id,sqlerrm;
  end;

  begin
    select id into v_sponsor from public.service_generate_sponsorship_offer(p_club_id);
  exception when others then
    raise warning 'sponsorship bootstrap failed for %: %',p_club_id,sqlerrm;
  end;

  if not exists(select 1 from public.notification where user_id=v_club.user_id and type='CLUB_READY' and href=format('/dashboard?universe=%s',v_club.universe_id)) then
    insert into public.notification(user_id,type,title,body,href)
    values(v_club.user_id,'CLUB_READY','O teu clube está pronto',format('%s foi criado. Confirma o plantel, escolhe uma competição e prepara a primeira partida.',v_club.name),format('/dashboard?universe=%s',v_club.universe_id));
  end if;

  return jsonb_build_object('club_id',p_club_id,'starter_players_assigned',v_starter,'sponsorship_id',v_sponsor,'infrastructure_count',(select count(*) from public.club_infrastructure where club_id=p_club_id));
end;
$$;
revoke all on function public.service_bootstrap_club(uuid) from public;
grant execute on function public.service_bootstrap_club(uuid) to service_role;

create or replace function public.bootstrap_club_after_insert()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.service_bootstrap_club(new.id);
  return new;
end;
$$;
drop trigger if exists club_bootstrap_after_insert on public.club;
create trigger club_bootstrap_after_insert after insert on public.club for each row execute function public.bootstrap_club_after_insert();

-- Give the official universe a real first competitive destination.
insert into public.season(universe_id,name,status,registration_starts_at,rules_snapshot)
select u.id,'Temporada Principal','REGISTRATION',now(),jsonb_build_object('bootstrap',true)
from public.universe u
where u.slug='principal'
on conflict(universe_id,name) do nothing;

insert into public.competition(universe_id,season_id,type,name,status,rules,entry_fee,prize_pool)
select u.id,s.id,'LEAGUE','Liga Principal','REGISTRATION',jsonb_build_object('round_interval_days',7,'bootstrap',true),0,0
from public.universe u
join public.season s on s.universe_id=u.id and s.name='Temporada Principal'
where u.slug='principal'
  and not exists(select 1 from public.competition c where c.universe_id=u.id and c.name='Liga Principal' and c.status<>'CANCELLED');

-- Backfill clubs created before this migration.
do $$
declare v_club record;
begin
  for v_club in select id from public.club order by created_at loop
    begin
      perform public.service_bootstrap_club(v_club.id);
    exception when others then
      raise warning 'club bootstrap backfill failed for %: %',v_club.id,sqlerrm;
    end;
  end loop;
end;
$$;
