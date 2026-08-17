-- Official Clã das Sombras universe.
-- Economic values are initial defaults and remain versioned configuration, not UI constants.

insert into public.universe (
  kind,
  name,
  slug,
  description,
  owner_user_id,
  state,
  access_policy,
  economic_profile,
  financing_policy,
  starting_silver,
  external_financing_limit_pct,
  market_fee_pct,
  auction_fee_pct,
  min_squad_size,
  max_squad_size
)
values (
  'MAIN',
  'Universo Principal',
  'principal',
  'Universo competitivo oficial do Clã das Sombras, governado pela plataforma.',
  null,
  'OPEN_FOR_MEMBERS',
  'PUBLIC',
  'STANDARD',
  'LIMITED',
  25000,
  50,
  5,
  5,
  18,
  25
)
on conflict (slug) do nothing;

insert into public.universe_currency_account(universe_id,currency,balance)
select id,'SILVER',0
from public.universe
where slug = 'principal'
on conflict(universe_id,currency) do nothing;
