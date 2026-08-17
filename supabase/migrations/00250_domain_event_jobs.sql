-- Clã das Sombras — domain event production and asynchronous processing
-- Designed for a server-side scheduled worker. All processors are idempotent.

create table if not exists public.internal_job_run (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  idempotency_key text not null unique,
  status text not null default 'RUNNING' check (status in ('RUNNING','SUCCEEDED','FAILED')),
  processed_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create or replace function public.emit_domain_event_from_match_settlement()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare v_match public.match;
begin
  if new.status <> 'APPLIED' then return new; end if;
  select * into v_match from public.match where id=new.match_id;
  insert into public.domain_event(universe_id,type,aggregate_type,aggregate_id,payload)
  values(v_match.universe_id,'MATCH_SETTLED','MATCH',new.match_id,
    jsonb_build_object('match_id',new.match_id,'home_club_id',v_match.home_club_id,'away_club_id',v_match.away_club_id,'home_score',v_match.home_score,'away_score',v_match.away_score,'settlement_version',new.settlement_version))
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists emit_match_settlement_event on public.match_settlement;
create trigger emit_match_settlement_event after insert on public.match_settlement
for each row execute function public.emit_domain_event_from_match_settlement();

create or replace function public.emit_domain_event_from_market_sale()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare v_player public.universe_player;
begin
  if old.status is distinct from new.status and new.status='SOLD' then
    select * into v_player from public.universe_player where id=new.universe_player_id;
    insert into public.domain_event(universe_id,club_id,type,aggregate_type,aggregate_id,payload)
    values(new.universe_id,v_player.owner_club_id,'TRANSFER_COMPLETED','MARKET_LISTING',new.id,
      jsonb_build_object('listing_id',new.id,'universe_player_id',new.universe_player_id,'seller_club_id',new.seller_club_id,'buyer_club_id',v_player.owner_club_id,'listing_type',new.listing_type,'price',coalesce(new.asking_price,new.buy_now_price)))
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists emit_market_sale_event on public.market_listing;
create trigger emit_market_sale_event after update of status on public.market_listing
for each row execute function public.emit_domain_event_from_market_sale();

create or replace function public.emit_domain_event_from_player_update()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if old.overall is distinct from new.overall or old.provider_version is distinct from new.provider_version then
    insert into public.domain_event(type,aggregate_type,aggregate_id,payload)
    values('PLAYER_DATA_UPDATED','PLAYER_MASTER',new.id,
      jsonb_build_object('player_id',new.id,'name',new.name,'old_overall',old.overall,'new_overall',new.overall,'provider',new.provider,'provider_version',new.provider_version));
  end if;
  return new;
end;
$$;

drop trigger if exists emit_player_update_event on public.player_master;
create trigger emit_player_update_event after update on public.player_master
for each row execute function public.emit_domain_event_from_player_update();

create or replace function public.service_process_domain_events(
  p_limit integer default 100,
  p_job_key text default null
)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  v_event public.domain_event;
  v_count integer := 0;
  v_title text;
  v_summary text;
  v_category text;
  v_target_user uuid;
  v_job public.internal_job_run;
begin
  if p_limit < 1 or p_limit > 1000 then raise exception 'invalid_processing_limit'; end if;
  if p_job_key is not null then
    select * into v_job from public.internal_job_run where idempotency_key=p_job_key;
    if found and v_job.status='SUCCEEDED' then return v_job.processed_count; end if;
    insert into public.internal_job_run(job_type,idempotency_key,status)
    values('DOMAIN_EVENTS',p_job_key,'RUNNING')
    on conflict(idempotency_key) do update set status='RUNNING',started_at=now(),finished_at=null
    returning * into v_job;
  end if;

  for v_event in
    select * from public.domain_event where processed_at is null order by occurred_at asc for update skip locked limit p_limit
  loop
    v_title := null; v_summary := null; v_category := 'SYSTEM'; v_target_user := v_event.user_id;

    if v_event.type='MATCH_SETTLED' then
      v_category:='MATCH';
      v_title:='Resultado confirmado';
      v_summary:=format('Resultado final: %s — %s',coalesce(v_event.payload->>'home_score','0'),coalesce(v_event.payload->>'away_score','0'));
    elsif v_event.type='TRANSFER_COMPLETED' then
      v_category:='MARKET';
      v_title:='Transferência concluída';
      v_summary:='Uma transferência foi concluída no mercado do universo.';
    elsif v_event.type='PLAYER_DATA_UPDATED' then
      v_category:='PLAYER';
      v_title:=coalesce(v_event.payload->>'name','Jogador') || ' atualizado';
      v_summary:=format('Rating atualizado de %s para %s pela fonte externa.',coalesce(v_event.payload->>'old_overall','—'),coalesce(v_event.payload->>'new_overall','—'));
    elsif v_event.type='ACHIEVEMENT_UNLOCKED' then
      v_category:='ACHIEVEMENT';
      v_title:=coalesce(v_event.payload->>'title','Conquista desbloqueada');
      v_summary:=coalesce(v_event.payload->>'summary','Nova conquista desbloqueada.');
    elsif v_event.type='PAYMENT_COMPLETED' then
      v_category:='PAYMENT';
      v_title:='Pagamento confirmado';
      v_summary:='O pagamento foi confirmado e o Gold foi creditado.';
    end if;

    if v_event.universe_id is not null and v_title is not null then
      insert into public.journal_article(universe_id,event_id,category,title,summary,importance)
      values(v_event.universe_id,v_event.id,v_category,v_title,v_summary,case when v_event.type in ('MATCH_SETTLED','TRANSFER_COMPLETED') then 2 else 1 end)
      on conflict do nothing;
    end if;

    if v_target_user is null and v_event.club_id is not null then
      select user_id into v_target_user from public.club where id=v_event.club_id;
    end if;
    if v_target_user is not null and v_title is not null then
      insert into public.notification(user_id,type,title,body,href)
      values(v_target_user,v_event.type,v_title,v_summary,
        case when v_event.type='MATCH_SETTLED' then '/partidas'
             when v_event.type='TRANSFER_COMPLETED' then '/market'
             when v_event.type='PLAYER_DATA_UPDATED' then '/team'
             else null end);
    end if;

    update public.domain_event set processed_at=now() where id=v_event.id;
    v_count:=v_count+1;
  end loop;

  if p_job_key is not null then
    update public.internal_job_run set status='SUCCEEDED',processed_count=v_count,finished_at=now() where idempotency_key=p_job_key;
  end if;
  return v_count;
exception when others then
  if p_job_key is not null then
    update public.internal_job_run set status='FAILED',metadata=jsonb_build_object('error',sqlerrm),finished_at=now() where idempotency_key=p_job_key;
  end if;
  raise;
end;
$$;

revoke all on function public.service_process_domain_events(integer,text) from public;
grant execute on function public.service_process_domain_events(integer,text) to service_role;

create or replace function public.service_expire_stale_direct_listings(p_limit integer default 200)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare v_listing public.market_listing; v_count integer:=0;
begin
  for v_listing in
    select * from public.market_listing
    where status='ACTIVE' and listing_type='DIRECT' and ends_at is not null and ends_at<=now()
    order by ends_at asc for update skip locked limit p_limit
  loop
    update public.market_listing set status='EXPIRED',updated_at=now() where id=v_listing.id;
    update public.universe_player set status=case when owner_club_id is null then 'AVAILABLE' else 'ACTIVE' end,updated_at=now() where id=v_listing.universe_player_id and status='LISTED';
    v_count:=v_count+1;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.service_expire_stale_direct_listings(integer) from public;
grant execute on function public.service_expire_stale_direct_listings(integer) to service_role;

alter table public.internal_job_run enable row level security;
-- Internal job metadata is server-only by design.
