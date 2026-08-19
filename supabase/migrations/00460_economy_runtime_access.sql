-- Clã das Sombras — safe economy runtime access
-- Apply after 00450_platform_market_catalog.sql.
--
-- platform_config is intentionally private. Gameplay may read only the explicit
-- non-secret rule sets below through this narrow function.

create or replace function public.get_gameplay_config(p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare v_value jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_key not in ('economy.loan_defaults','economy.infrastructure_upgrade') then
    raise exception 'gameplay_config_not_public';
  end if;
  select value into v_value from public.platform_config where key=p_key;
  return coalesce(v_value,'{}'::jsonb);
end;
$$;
revoke all on function public.get_gameplay_config(text) from public,anon;
grant execute on function public.get_gameplay_config(text) to authenticated;

create or replace function public.request_sponsorship_offer(p_club_id uuid)
returns public.sponsorship_contract
language plpgsql
security definer
set search_path=public
as $$
declare v_club public.club;v_offer public.sponsorship_contract;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_club from public.club where id=p_club_id;
  if not found or v_club.user_id<>auth.uid() then raise exception 'club_not_owned'; end if;
  select * into v_offer from public.service_generate_sponsorship_offer(v_club.id);
  return v_offer;
end;
$$;
revoke all on function public.request_sponsorship_offer(uuid) from public,anon;
grant execute on function public.request_sponsorship_offer(uuid) to authenticated;

comment on function public.request_sponsorship_offer(uuid) is
  'Returns or creates the current sponsorship offer for the authenticated manager club.';
