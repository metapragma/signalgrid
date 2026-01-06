# TESTING.md — SignalGrid

## Test Stack

- **API**: Jest + Supertest (Nest e2e)
- **Web**: Vitest (unit/component)
- **E2E**: Playwright

## Test Database Setup

### Local Development

- Use Docker Compose test profile: `docker compose --profile test up -d`
- Test DB runs on port 5433 (separate from dev DB on 5432)
- Connection: `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/signalgrid_test`

### Test Isolation

- Each test suite resets DB state before running
- Use Prisma migrations: `pnpm prisma migrate reset --force`
- Never share state between test files

## Running Tests

### API Tests

```bash
# All API tests
pnpm --filter api test

# Single file
pnpm --filter api test -- auth.e2e-spec.ts

# Watch mode
pnpm --filter api test:watch
```

**Expected output (passing):**

```
PASS  src/auth/auth.e2e-spec.ts
  AuthController
    ✓ POST /auth/register creates user (xxx ms)
    ✓ POST /auth/login returns JWT (xxx ms)

Test Suites: 1 passed, 1 total
```

### Web Tests

```bash
# All web tests
pnpm --filter web test

# Component tests only
pnpm --filter web test -- --dir src/components
```

**Expected output (passing):**

```
✓ src/stores/events.spec.ts (3 tests)
✓ src/components/EventFeed.spec.ts (2 tests)

Test Files  2 passed (2)
Tests       5 passed (5)
```

### E2E Tests

```bash
# Requires dev stack running
pnpm e2e

# Headed mode (see browser)
pnpm e2e -- --headed

# Single test
pnpm e2e -- --grep "login"
```

**Expected output (passing):**

```
Running 3 tests using 1 worker

  ✓ auth.spec.ts:5:1 › can register and login (xxxms)
  ✓ feed.spec.ts:5:1 › can view live feed (xxxms)

  2 passed (xxxs)
```

## Test Data Seeding

### Seed Script

```bash
pnpm --filter api seed
```

Creates:

- Test tenant: `test-tenant-id`
- Test user: `test@example.com` / `password123`
- Sample events (100)
- Sample incident (1)

### Seeding in Tests

```typescript
// Import from test utilities
import { seedTestTenant, seedTestUser, seedEvents } from '../test/seed';

beforeAll(async () => {
  await seedTestTenant();
  await seedTestUser();
});
```

## Mocking Conventions

### API

- Use Nest's testing module with real DB (not mocked)
- Only mock external services (email, etc.)

### Web

- Mock SDK responses using MSW or vi.mock
- Never mock Pinia stores in store tests
- Component tests may mock stores

## Test Naming

- API: `*.e2e-spec.ts`
- Web unit: `*.spec.ts`
- Web component: `*.spec.ts` (in components dir)
- E2E: `*.spec.ts` (in e2e dir)

## Coverage Requirements (V1)

- No hard coverage threshold
- Focus on: auth flows, event feed logic, tenant isolation
- Coverage report: `pnpm test:coverage`
