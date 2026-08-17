# Clã das Sombras — Domain Model

## Architectural rule
UI → Application Use Cases → Domain → Repository contracts → Supabase adapters → PostgreSQL/RPC/Storage.

React components must not implement economic, competitive or governance invariants through direct multi-step table updates.

## Bounded contexts

### Identity
Global user identity. One account across the platform. Owns manager progression, Gold, Bronze and social identity. It does not own a global football club.

### Universe
Competitive/economic boundary. The Main Universe is platform-governed; community universes are separately governed. Each universe defines admission, season rules and economic policy.

### Club
A manager may own at most one club in a given universe. A club owns Silver, squad contracts, infrastructure, Elo, fans and prestige within that universe.

### Economy
Gold = global premium/financing currency. Bronze = global engagement currency. Silver = club/universe economy. All value movement is ledger-first and idempotent. No direct balance edits.

### Player
PLAYER_MASTER is canonical external-source data. UNIVERSE_PLAYER is the tradable asset inside a universe. Player attributes do not evolve internally; external provider updates can change rating and cause price recalculation.

### Competition
Season → Competition → Match. League, Cup, Tournament and Friendly Event share the same Match lifecycle. A result has no economic/ranking side effect before SETTLED.

### Market
Listings are universe-scoped and operate on UNIVERSE_PLAYER. Direct sale and auction settlement must be atomic and update Silver ledger + ownership + contract state together.

### Social
Communities are social containers and can reference multiple universes. They are not economic or competitive boundaries.

### Governance
Admin operations are commands with RBAC, reason, audit and, where relevant, idempotency. Refund, grant, settlement reversal and economic freeze are never raw record edits.

## Core invariants
1. A user is unique globally.
2. A user has at most one club per universe.
3. Silver never belongs to the global user wallet.
4. Gold/Bronze never belong to a club.
5. A PLAYER_MASTER exists once per provider/external ID.
6. A player has at most one UNIVERSE_PLAYER per universe.
7. A UNIVERSE_PLAYER has at most one current owner club.
8. Player attributes come from external data; no training-based attribute evolution.
9. Settled matches are immutable; corrections require reversal + new settlement.
10. Economic operations are atomic, ledger-first and idempotent.
11. Community and Universe are separate entities.
12. Main Universe governance belongs to the platform.

## Migration strategy
`lib/types.ts` is legacy compatibility only. New work must import from `lib/domain/*`. Pages still using legacy tables are migration targets and must not gain new business logic.
