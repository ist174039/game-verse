-- Clã das Sombras — initial purchasable Gold catalogue
-- Apply after 00460_economy_runtime_access.sql.
--
-- Packages may exceed the 500 Gold per-operation financing ceiling; that ceiling
-- limits each conversion, not the user's balance. Prices are stored in cents and
-- are always revalidated server-side before Stripe Checkout.

insert into public.gold_package as current_package(
  slug,name,gold_amount,price_cents,fiat_currency,active,sort_order,metadata
)
values
  (
    'gold-faisca','Faísca',30,199,'eur',true,10,
    '{"base_gold":30,"bonus_gold":0,"badge":"15 Gold/€","featured":false,"description":"Uma reserva inicial para experimentar a economia Gold."}'::jsonb
  ),
  (
    'gold-reforco','Reforço',125,499,'eur',true,20,
    '{"base_gold":75,"bonus_gold":50,"badge":"25 Gold/€","featured":false,"description":"125 Gold para reforçar o clube e acelerar a progressão."}'::jsonb
  ),
  (
    'gold-manager','Manager',350,999,'eur',true,30,
    '{"base_gold":150,"bonus_gold":200,"badge":"35 Gold/€","featured":true,"description":"Mais flexibilidade para reforços e decisões estratégicas."}'::jsonb
  ),
  (
    'gold-elite','Elite',900,1999,'eur',true,40,
    '{"base_gold":300,"bonus_gold":600,"badge":"45 Gold/€","featured":false,"description":"Uma reserva ampla para gerir vários objetivos competitivos."}'::jsonb
  ),
  (
    'gold-lenda','Lenda',2750,4999,'eur',true,50,
    '{"base_gold":750,"bonus_gold":2000,"badge":"55 Gold/€","featured":false,"description":"A maior reserva e o melhor valor por Gold do catálogo."}'::jsonb
  )
on conflict(slug) do update
set
  name=excluded.name,
  gold_amount=excluded.gold_amount,
  price_cents=excluded.price_cents,
  fiat_currency=excluded.fiat_currency,
  stripe_price_id=case
    when current_package.gold_amount<>excluded.gold_amount
      or current_package.price_cents<>excluded.price_cents
      or current_package.fiat_currency<>excluded.fiat_currency
    then null
    else current_package.stripe_price_id
  end,
  active=excluded.active,
  sort_order=excluded.sort_order,
  metadata=excluded.metadata,
  updated_at=now();

comment on table public.gold_package is
  'Server-validated Gold package catalogue. Stripe price IDs are optional; inline Checkout prices use the immutable payment-order snapshot.';
