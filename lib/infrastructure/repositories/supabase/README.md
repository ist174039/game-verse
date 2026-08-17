# Supabase repository adapters

This directory is the infrastructure boundary between the Clã das Sombras application/domain layers and Supabase.

## Rules

- React components MUST NOT implement domain mutations with direct `.from(...).insert/update/delete` calls.
- Application use cases depend on repository interfaces from `lib/application/contracts.ts`.
- Supabase adapters implement those interfaces.
- Critical economic, market and match operations MUST call atomic PostgreSQL functions/RPCs rather than coordinating multiple writes in TypeScript.
- `service_role` is server-only and may never be exposed to client components.
- Reads may use RLS-protected browser/server clients where appropriate.
- Domain types are mapped explicitly; database row shapes must not leak into the UI.

## Planned adapters

- `SupabaseIdentityRepository`
- `SupabaseUniverseRepository`
- `SupabaseClubRepository`
- `SupabasePlayerRepository`
- `SupabaseCompetitionRepository`
- `SupabaseMarketRepository`
- `SupabaseLedgerRepository`

These adapters are activated when the definitive Supabase project is connected and migrations are applied.
