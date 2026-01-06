# ARCHITECTURE.md — SignalGrid

## Monorepo layout (authoritative)

- `apps/api`: NestJS API (REST + WebSocket), Prisma, Postgres. Optional Redis for pub/sub later.
- `apps/web`: Vue 3 app (Vite), Pinia, uses `packages/sdk` for all network IO.
- `packages/contracts`: Zod schemas + TypeScript types; canonical contracts for REST + WS.
- `packages/sdk`: Typed REST client + WS client; validates using `packages/contracts`.

## Runtime topology (V1)

web (browser)
↕ HTTPS (REST)
↕ WS (ws)
api (NestJS)
↕ SQL
postgres

Optional (V2 or later): api ↔ redis pub/sub for multi-instance fanout.

## Trust boundaries (must validate with Zod)

1. Browser ↔ API (REST): validate request DTOs in API; validate response payloads in SDK.
2. Browser ↔ API (WS): validate inbound subscribe frames and outbound event frames with contracts.
3. API ↔ DB: enforce tenant scoping in queries.

## Data flow (events)

1. Seed generator inserts events into DB (or event ingestion endpoint).
2. REST `/events` returns paged events (cursor).
3. WS subscription pushes new events to clients subscribed to matching filters.
4. Client appends events to a virtualized list; filters are route-driven.

## Auth + tenancy

- JWT in Authorization header for REST.
- WS uses JWT via query param or subprotocol header (record exact method in CONTRACTS.md and implement consistently).
- Tenant context is derived from JWT claims and/or explicit tenantId in route; server must verify membership.

## Error model

- Canonical error shape defined in CONTRACTS.md and implemented in API + SDK.
- No ad-hoc error formats.

## Backpressure and cursor semantics

- Cursor semantics and resync rules are defined in CONTRACTS.md and ADR-0003.
- If client cannot keep up, server issues a `resync_required` frame; client switches to REST to catch up.
