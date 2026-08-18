-- Clã das Sombras — security privilege and RLS hardening
-- Dedicated remediation for Supabase advisor findings.
-- Goals:
--   1) anon has no access to application tables/sequences/functions in public;
--   2) PUBLIC cannot inherit EXECUTE on public functions;
--   3) service_* commands remain service-role only;
--   4) ledger and other previously implicit surfaces are protected by RLS;
--   5) migration fails if any SECURITY DEFINER function remains executable by anon.

-- The application is authenticated-first. Public landing/auth flows use Auth/static content,
-- not direct anonymous access to application tables.
revoke create on schema public from public;
revoke create on schema public from anon;
revoke create on schema public from authenticated;

grant usage on schema public to authenticated, service_role;

revoke all privileges on all tables in schema public from anon;
revoke all privileges on all sequences in schema public from anon;
revoke all privileges on all functions in schema public from anon;
revoke execute on all functions in schema public from public;

-- New objects must be explicitly exposed. PostgreSQL otherwise grants function EXECUTE
-- to PUBLIC by default, which is the root cause of the advisor finding.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;

-- service_* is an explicit server-only naming contract. Existing service_role grants are
-- preserved; this block also protects functions that were created without an explicit ACL.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.prokind='f'
      and p.proname like 'service\_%' escape '\'
  loop
    execute format('revoke all on function %s from public', r.signature);
    execute format('revoke all on function %s from anon', r.signature);
    execute format('revoke all on function %s from authenticated', r.signature);
    execute format('grant execute on function %s to service_role', r.signature);
  end loop;
end $$;

-- Ledger was intentionally write-protected but historically did not have an explicit
-- read RLS boundary. Users may read only entries affecting their own global accounts or
-- clubs they own. Platform/universe-side balancing entries stay private.
alter table public.ledger_entry enable row level security;
alter table public.ledger_transaction enable row level security;

drop policy if exists ledger_entry_owner_read on public.ledger_entry;
create policy ledger_entry_owner_read on public.ledger_entry
for select to authenticated
using (
  (user_account_id is not null and exists(
    select 1 from public.user_currency_account ua
    where ua.id=ledger_entry.user_account_id and ua.user_id=auth.uid()
  ))
  or
  (club_account_id is not null and exists(
    select 1
    from public.club_currency_account ca
    join public.club c on c.id=ca.club_id
    where ca.id=ledger_entry.club_account_id and c.user_id=auth.uid()
  ))
);

drop policy if exists ledger_transaction_owner_read on public.ledger_transaction;
create policy ledger_transaction_owner_read on public.ledger_transaction
for select to authenticated
using (
  exists(
    select 1
    from public.ledger_entry e
    where e.transaction_id=ledger_transaction.id
      and (
        (e.user_account_id is not null and exists(
          select 1 from public.user_currency_account ua
          where ua.id=e.user_account_id and ua.user_id=auth.uid()
        ))
        or
        (e.club_account_id is not null and exists(
          select 1
          from public.club_currency_account ca
          join public.club c on c.id=ca.club_id
          where ca.id=e.club_account_id and c.user_id=auth.uid()
        ))
      )
  )
);

-- Match settlements are visible only to the two participating managers. Administration
-- continues to use service_role and therefore is not coupled to end-user policies.
alter table public.match_settlement enable row level security;
drop policy if exists match_settlement_participant_read on public.match_settlement;
create policy match_settlement_participant_read on public.match_settlement
for select to authenticated
using (
  exists(
    select 1
    from public.match m
    join public.club c on c.id in (m.home_club_id,m.away_club_id)
    where m.id=match_settlement.match_id and c.user_id=auth.uid()
  )
);

-- Community/universe association was the remaining core association table without a
-- dedicated RLS baseline. Visibility follows the community itself.
alter table public.community_universe enable row level security;
drop policy if exists community_universe_visible_read on public.community_universe;
create policy community_universe_visible_read on public.community_universe
for select to authenticated
using (
  exists(
    select 1 from public.community c
    where c.id=community_universe.community_id
      and (
        c.visibility='PUBLIC'
        or c.owner_user_id=auth.uid()
        or exists(
          select 1 from public.community_membership cm
          where cm.community_id=c.id and cm.user_id=auth.uid()
        )
      )
  )
);

-- Auction bid visibility is required by the real market read model. Bids are readable to
-- authenticated users while all bid writes remain RPC-only.
alter table public.auction_bid enable row level security;
drop policy if exists auction_bid_authenticated_read on public.auction_bid;
create policy auction_bid_authenticated_read on public.auction_bid
for select to authenticated
using (
  exists(select 1 from public.market_listing l where l.id=auction_bid.listing_id)
);

-- Evidence metadata stays private to match participants. Direct DB inserts are limited to
-- the uploader who is also one of the two match managers; file access remains governed by
-- Storage policies on the private match-evidence bucket.
alter table public.match_evidence enable row level security;
drop policy if exists match_evidence_participant_read on public.match_evidence;
create policy match_evidence_participant_read on public.match_evidence
for select to authenticated
using (
  exists(
    select 1
    from public.match m
    join public.club c on c.id in (m.home_club_id,m.away_club_id)
    where m.id=match_evidence.match_id and c.user_id=auth.uid()
  )
);

drop policy if exists match_evidence_participant_insert on public.match_evidence;
create policy match_evidence_participant_insert on public.match_evidence
for insert to authenticated
with check (
  uploaded_by=auth.uid()
  and exists(
    select 1
    from public.match m
    join public.club c on c.id in (m.home_club_id,m.away_club_id)
    where m.id=match_evidence.match_id and c.user_id=auth.uid()
  )
);

-- Hard assertion: applying this migration must leave zero SECURITY DEFINER functions
-- callable by anon, either directly or through PUBLIC privileges.
do $$
declare
  v_exposed integer;
begin
  select count(*) into v_exposed
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.prosecdef
    and has_function_privilege('anon',p.oid,'EXECUTE');

  if v_exposed <> 0 then
    raise exception 'security_hardening_failed: % SECURITY DEFINER function(s) still executable by anon', v_exposed;
  end if;
end $$;

-- Password leak protection is an Auth service configuration, not a database migration.
-- For self-hosted Supabase it must be configured in the Auth/GoTrue deployment settings.
