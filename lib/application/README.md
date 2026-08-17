# Application layer

This layer orchestrates Clã das Sombras use cases and depends on domain types/contracts, never on React components.

Rules:
- Economic and settlement commands require an idempotency key.
- Browser code never writes balances directly.
- Multi-entity operations are implemented by transactional Supabase RPC/server workflows.
- `lib/types.ts` is legacy compatibility only.
- New code uses `lib/domain/*` and `lib/application/*`.
