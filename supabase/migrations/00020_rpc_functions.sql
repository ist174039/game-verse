-- RETIRED LEGACY MIGRATION
--
-- This repository previously defined GameVerse/GameCoins RPCs here
-- (credit_gc, deduct_balance, buy_market_listing and related operations).
-- Those functions conflict with the Clã das Sombras domain model and are
-- intentionally NOT created on new environments.
--
-- Historical databases that already contain them must be migrated through an
-- explicit data migration/reconciliation process. Do not recreate them.
--
-- New schema starts at 00100_clan_core.sql.

DO $$
BEGIN
  RAISE NOTICE 'Legacy GameCoins RPC migration retired. Using Clã das Sombras ledger-first schema.';
END
$$;
