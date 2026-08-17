-- Clã das Sombras — retention lifecycle, missions, achievements and Bronze entitlements
-- Apply after 00300_social_operations.sql.

create table if not exists public.user_engagement_stat (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_claims bigint not null default 0 check (daily_claims >= 0),
  matches_played bigint not null default 0 check (matches_played >= 0),
  wins bigint not null default 0 check (wins >= 0),
  transfers bigint not null default 0 check (transfers >= 0),
  community_posts bigint not null default 0 check (community_posts >= 0),
  best_daily_streak integer not null default 0 check (best_daily_streak >= 0),
  updated_at timestamptz not null default now()
);

create unique index if not exists bronze_purchase_unique_entitlement_idx on public.bronze_purchase(user_id,item_id);

alter table public.user_engagement_stat enable row level security;
drop policy if exists user_engagement_stat_own_read on public.user_engagement_stat;
create policy user_engagement_stat_own_read on public.user_engagement_stat for select to authenticated using (user_id=auth.uid());

insert into public.mission_definition(code,title,description,cadence,target,reward_bronze,reward_manager_xp,active,criteria)
values
  ('DAILY_CHECKIN','Presença diária','Recolhe a recompensa diária.','DAILY',1,15,5,true,'{"event":"DAILY_CLAIM"}'::jsonb),
  ('WEEKLY_MATCHES','Ritmo competitivo','Conclui 3 partidas durante a semana.','WEEKLY',3,50,25,true,'{"event":"MATCH_PLAYED"}'::jsonb),
  ('MARKET_ACTIVITY','Movimento no mercado','Participa em 2 transferências durante a semana.','WEEKLY',2,40,20,true,'{"event":"TRANSFER"}'::jsonb),
  ('COMMUNITY_VOICE','Voz do Clã','Publica 2 vezes numa comunidade durante a semana.','WEEKLY',2,30,15,true,'{"event":"COMMUNITY_POST"}'::jsonb),
  ('FIRST_WIN','Primeira vitória','Conquista a primeira vitória competitiva.','ONE_TIME',1,50,30,true,'{"event":"MATCH_WIN"}'::jsonb)
on conflict(code) do update set title=excluded.title,description=excluded.description,cadence=excluded.cadence,target=excluded.target,reward_bronze=excluded.reward_bronze,reward_manager_xp=excluded.reward_manager_xp,active=true,criteria=excluded.criteria;

insert into public.achievement_definition(code,title,description,tier,reward_bronze,reward_manager_xp,criteria)
values
  ('FIRST_STEPS','Primeiros passos','Conclui a primeira partida.','BRONZE',25,15,'{"metric":"matches_played","target":1}'::jsonb),
  ('FIRST_VICTORY','Primeira conquista','Vence a primeira partida.','BRONZE',50,25,'{"metric":"wins","target":1}'::jsonb),
  ('TRADER','Negociador','Participa na primeira transferência concluída.','BRONZE',35,20,'{"metric":"transfers","target":1}'::jsonb),
  ('VOICE','Voz das Sombras','Faz a primeira publicação numa comunidade.','BRONZE',25,15,'{"metric":"community_posts","target":1}'::jsonb),
  ('STREAK_7','Disciplina de sete dias','Mantém uma sequência diária de 7 dias.','SILVER',100,50,'{"metric":"best_daily_streak","target":7}'::jsonb)
on conflict(code) do update set title=excluded.title,description=excluded.description,tier=excluded.tier,reward_bronze=excluded.reward_bronze,reward_manager_xp=excluded.reward_manager_xp,criteria=excluded.criteria;

insert into public.bronze_store_item(code,name,category,price_bronze,active,metadata)
values
  ('BADGE_SHADOW_ROOKIE','Insígnia Iniciado das Sombras','BADGE',150,true,'{"rarity":"COMMON"}'::jsonb),
  ('FRAME_GOLD_TRACE','Moldura Traço Dourado','FRAME',300,true,'{"rarity":"RARE"}'::jsonb),
  ('CLUB_SHADOW_BANNER','Estandarte do Clã','CLUB_CUSTOMIZATION',250,true,'{"rarity":"RARE"}'::jsonb),
  ('LION_MARK_COLLECTIBLE','Marca do Leão','COLLECTIBLE',500,true,'{"rarity":"EPIC"}'::jsonb)
on conflict(code) do update set name=excluded.name,category=excluded.category,price_bronze=excluded.price_bronze,active=true,metadata=excluded.metadata;

create or replace function public.retention_period_key(p_cadence text)
returns text language sql stable set search_path=public as $$
  select case p_cadence
    when 'DAILY' then to_char(current_date,'YYYY-MM-DD')
    when 'WEEKLY' then to_char(current_date,'IYYY-"W"IW')
    when 'ONE_TIME' then 'all-time'
    else 'seasonal'
  end;
$$;

create or replace function public.service_increment_user_mission(p_user_id uuid,p_code text,p_delta integer default 1)
returns void language plpgsql security definer set search_path=public as $$
declare v_def public.mission_definition;v_period text;v_progress integer;
begin
  if p_delta<=0 then return;end if;
  select * into v_def from public.mission_definition where code=p_code and active=true;
  if not found then return;end if;
  v_period:=public.retention_period_key(v_def.cadence);
  insert into public.user_mission(user_id,mission_id,period_key,progress,state,completed_at)
  values(p_user_id,v_def.id,v_period,least(p_delta,v_def.target),case when p_delta>=v_def.target then 'COMPLETED' else 'ACTIVE' end,case when p_delta>=v_def.target then now() else null end)
  on conflict(user_id,mission_id,period_key) do update set
    progress=least(v_def.target,public.user_mission.progress+p_delta),
    state=case when public.user_mission.state='CLAIMED' then 'CLAIMED' when public.user_mission.progress+p_delta>=v_def.target then 'COMPLETED' else public.user_mission.state end,
    completed_at=case when public.user_mission.completed_at is null and public.user_mission.progress+p_delta>=v_def.target then now() else public.user_mission.completed_at end;
end;
$$;
revoke all on function public.service_increment_user_mission(uuid,text,integer) from public;
grant execute on function public.service_increment_user_mission(uuid,text,integer) to service_role;

create or replace function public.service_evaluate_user_achievements(p_user_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare v_def public.achievement_definition;v_stat public.user_engagement_stat;v_metric bigint;v_target bigint;v_unlock public.user_achievement;v_count integer:=0;v_tx uuid;
begin
  select * into v_stat from public.user_engagement_stat where user_id=p_user_id;
  if not found then return 0;end if;
  for v_def in select * from public.achievement_definition loop
    v_target:=coalesce((v_def.criteria->>'target')::bigint,1);
    v_metric:=case v_def.criteria->>'metric'
      when 'daily_claims' then v_stat.daily_claims
      when 'matches_played' then v_stat.matches_played
      when 'wins' then v_stat.wins
      when 'transfers' then v_stat.transfers
      when 'community_posts' then v_stat.community_posts
      when 'best_daily_streak' then v_stat.best_daily_streak
      else 0 end;
    if v_metric>=v_target then
      insert into public.user_achievement(user_id,achievement_id) values(p_user_id,v_def.id)
      on conflict(user_id,achievement_id) do nothing returning * into v_unlock;
      if found then
        if v_def.reward_bronze>0 then
          select public.service_grant_user_currency(p_user_id,'BRONZE',v_def.reward_bronze,'ACHIEVEMENT_REWARD','Achievement unlocked',format('achievement:%s:%s',p_user_id,v_def.id)) into v_tx;
        end if;
        if v_def.reward_manager_xp>0 then update public.user_profile set manager_xp=manager_xp+v_def.reward_manager_xp,updated_at=now() where id=p_user_id;end if;
        insert into public.domain_event(user_id,type,aggregate_type,aggregate_id,payload)
        values(p_user_id,'ACHIEVEMENT_UNLOCKED','ACHIEVEMENT',v_def.id,jsonb_build_object('title',v_def.title,'summary',v_def.description,'tier',v_def.tier));
        v_count:=v_count+1;
      end if;
    end if;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.service_evaluate_user_achievements(uuid) from public;
grant execute on function public.service_evaluate_user_achievements(uuid) to service_role;

create or replace function public.service_record_engagement_event(p_user_id uuid,p_event text,p_value integer default 1)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_user_id is null then return;end if;
  insert into public.user_engagement_stat(user_id) values(p_user_id) on conflict(user_id) do nothing;
  if p_event='DAILY_CLAIM' then
    update public.user_engagement_stat set daily_claims=daily_claims+1,best_daily_streak=greatest(best_daily_streak,p_value),updated_at=now() where user_id=p_user_id;
    perform public.service_increment_user_mission(p_user_id,'DAILY_CHECKIN',1);
  elsif p_event='MATCH_PLAYED' then
    update public.user_engagement_stat set matches_played=matches_played+1,updated_at=now() where user_id=p_user_id;
    perform public.service_increment_user_mission(p_user_id,'WEEKLY_MATCHES',1);
  elsif p_event='MATCH_WIN' then
    update public.user_engagement_stat set wins=wins+1,updated_at=now() where user_id=p_user_id;
    perform public.service_increment_user_mission(p_user_id,'FIRST_WIN',1);
  elsif p_event='TRANSFER' then
    update public.user_engagement_stat set transfers=transfers+1,updated_at=now() where user_id=p_user_id;
    perform public.service_increment_user_mission(p_user_id,'MARKET_ACTIVITY',1);
  elsif p_event='COMMUNITY_POST' then
    update public.user_engagement_stat set community_posts=community_posts+1,updated_at=now() where user_id=p_user_id;
    perform public.service_increment_user_mission(p_user_id,'COMMUNITY_VOICE',1);
  end if;
  perform public.service_evaluate_user_achievements(p_user_id);
end;
$$;
revoke all on function public.service_record_engagement_event(uuid,text,integer) from public;
grant execute on function public.service_record_engagement_event(uuid,text,integer) to service_role;

create or replace function public.claim_daily_reward(p_idempotency_key text)
returns public.daily_reward_claim language plpgsql security definer set search_path=public as $$
declare v_last public.daily_reward_claim;v_claim public.daily_reward_claim;v_streak integer:=1;v_bronze bigint;v_xp bigint;v_tx uuid;v_key text;
begin
  if auth.uid() is null then raise exception 'authentication_required';end if;
  select * into v_claim from public.daily_reward_claim where user_id=auth.uid() and claim_date=current_date;
  if found then return v_claim;end if;
  select * into v_last from public.daily_reward_claim where user_id=auth.uid() order by claim_date desc limit 1;
  if found and v_last.claim_date=current_date-1 then v_streak:=least(v_last.streak+1,30);end if;
  v_bronze:=25+least(v_streak,7)*5;v_xp:=10+least(v_streak,7)*2;
  v_key:=format('daily:%s:%s',auth.uid(),current_date);
  select public.service_grant_user_currency(auth.uid(),'BRONZE',v_bronze,'DAILY_REWARD','Daily engagement reward',v_key) into v_tx;
  update public.user_profile set manager_xp=manager_xp+v_xp,updated_at=now() where id=auth.uid();
  insert into public.daily_reward_claim(user_id,claim_date,streak,reward_bronze,reward_manager_xp) values(auth.uid(),current_date,v_streak,v_bronze,v_xp) returning * into v_claim;
  perform public.service_record_engagement_event(auth.uid(),'DAILY_CLAIM',v_streak);
  return v_claim;
end;
$$;
revoke all on function public.claim_daily_reward(text) from public;
grant execute on function public.claim_daily_reward(text) to authenticated;

create or replace function public.claim_mission_reward(p_user_mission_id uuid,p_idempotency_key text)
returns public.user_mission language plpgsql security definer set search_path=public as $$
declare v_mission public.user_mission;v_def public.mission_definition;v_tx uuid;v_key text;
begin
  if auth.uid() is null then raise exception 'authentication_required';end if;
  select * into v_mission from public.user_mission where id=p_user_mission_id for update;
  if not found or v_mission.user_id<>auth.uid() then raise exception 'mission_not_found';end if;
  if v_mission.state='CLAIMED' then return v_mission;end if;
  if v_mission.state<>'COMPLETED' then raise exception 'mission_not_completed';end if;
  select * into v_def from public.mission_definition where id=v_mission.mission_id;
  v_key:=format('mission:%s:%s',auth.uid(),v_mission.id);
  if v_def.reward_bronze>0 then select public.service_grant_user_currency(auth.uid(),'BRONZE',v_def.reward_bronze,'MISSION_REWARD','Mission reward',v_key) into v_tx;end if;
  if v_def.reward_manager_xp>0 then update public.user_profile set manager_xp=manager_xp+v_def.reward_manager_xp,updated_at=now() where id=auth.uid();end if;
  update public.user_mission set state='CLAIMED',claimed_at=now() where id=v_mission.id returning * into v_mission;
  return v_mission;
end;
$$;
revoke all on function public.claim_mission_reward(uuid,text) from public;
grant execute on function public.claim_mission_reward(uuid,text) to authenticated;

create or replace function public.buy_bronze_item(p_item_id uuid,p_idempotency_key text)
returns public.bronze_purchase language plpgsql security definer set search_path=public as $$
declare v_item public.bronze_store_item;v_purchase public.bronze_purchase;v_tx uuid;v_key text;
begin
  if auth.uid() is null then raise exception 'authentication_required';end if;
  select * into v_purchase from public.bronze_purchase where user_id=auth.uid() and item_id=p_item_id order by purchased_at limit 1;
  if found then return v_purchase;end if;
  select * into v_item from public.bronze_store_item where id=p_item_id and active=true for update;
  if not found then raise exception 'store_item_not_available';end if;
  v_key:=format('bronze:%s:%s',auth.uid(),coalesce(nullif(p_idempotency_key,''),gen_random_uuid()::text));
  select public.service_debit_user_currency(auth.uid(),'BRONZE',v_item.price_bronze,'BRONZE_STORE_PURCHASE','Bronze store entitlement',v_key) into v_tx;
  insert into public.bronze_purchase(user_id,item_id,price_bronze,ledger_transaction_id) values(auth.uid(),v_item.id,v_item.price_bronze,v_tx) returning * into v_purchase;
  return v_purchase;
end;
$$;
revoke all on function public.buy_bronze_item(uuid,text) from public;
grant execute on function public.buy_bronze_item(uuid,text) to authenticated;

create or replace function public.retention_after_match_settlement()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_match public.match;v_home_user uuid;v_away_user uuid;
begin
  if new.status<>'APPLIED' then return new;end if;
  if exists(select 1 from public.match_settlement s where s.match_id=new.match_id and s.id<>new.id) then return new;end if;
  select * into v_match from public.match where id=new.match_id;
  select user_id into v_home_user from public.club where id=v_match.home_club_id;
  select user_id into v_away_user from public.club where id=v_match.away_club_id;
  perform public.service_record_engagement_event(v_home_user,'MATCH_PLAYED',1);
  perform public.service_record_engagement_event(v_away_user,'MATCH_PLAYED',1);
  if v_match.home_score>v_match.away_score then perform public.service_record_engagement_event(v_home_user,'MATCH_WIN',1);
  elsif v_match.away_score>v_match.home_score then perform public.service_record_engagement_event(v_away_user,'MATCH_WIN',1);end if;
  return new;
end;
$$;
drop trigger if exists retention_match_settlement on public.match_settlement;
create trigger retention_match_settlement after insert on public.match_settlement for each row execute function public.retention_after_match_settlement();

create or replace function public.retention_after_market_sale()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_buyer uuid;v_seller uuid;v_asset public.universe_player;
begin
  if old.status is distinct from new.status and new.status='SOLD' then
    select * into v_asset from public.universe_player where id=new.universe_player_id;
    select user_id into v_buyer from public.club where id=v_asset.owner_club_id;
    select user_id into v_seller from public.club where id=new.seller_club_id;
    perform public.service_record_engagement_event(v_buyer,'TRANSFER',1);
    if v_seller is distinct from v_buyer then perform public.service_record_engagement_event(v_seller,'TRANSFER',1);end if;
  end if;
  return new;
end;
$$;
drop trigger if exists retention_market_sale on public.market_listing;
create trigger retention_market_sale after update of status on public.market_listing for each row execute function public.retention_after_market_sale();

create or replace function public.retention_after_community_post()
returns trigger language plpgsql security definer set search_path=public as $$
begin perform public.service_record_engagement_event(new.author_user_id,'COMMUNITY_POST',1);return new;end;
$$;
drop trigger if exists retention_community_post on public.community_post;
create trigger retention_community_post after insert on public.community_post for each row execute function public.retention_after_community_post();
