# SignalGrid

A real-time operations console for streaming event monitoring and incident management. Built with Vue 3, NestJS, and PostgreSQL.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Vue](https://img.shields.io/badge/Vue-3.5-green)
![NestJS](https://img.shields.io/badge/NestJS-10-red)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Overview

SignalGrid provides real-time visibility into system events with live streaming, incident tracking, and operational dashboards. It demonstrates production-grade architecture patterns including:

- **Real-time streaming** via WebSocket with cursor-based resume
- **End-to-end type safety** with Zod validation at trust boundaries
- **Multi-tenant isolation** with RBAC (Owner/Member roles)
- **Virtualized UI** handling 10k+ events without performance degradation

## Features

### Live Events Feed
- REST API with cursor-based pagination
- WebSocket subscriptions with automatic reconnection
- Filter by severity (debug, info, warn, error) and event type
- Backpressure handling for high-volume streams

### Incident Management
- Create and track incidents linked to related events
- Comment threads with author attribution
- Status workflow

### Operations Dashboard
- Real-time error rate monitoring
- Latency percentiles (p50/p95/p99)
- Top error fingerprints visualization
- System health indicators

### Security
- JWT authentication with token refresh
- Refresh tokens in httpOnly cookies
- Rate limiting (20/s, 200/min, 2000/hr)
- Security headers via Helmet

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3, Vite, Pinia, Vue Router, Tailwind CSS 4 |
| Backend | NestJS 10, Prisma 6, PostgreSQL 16 |
| Real-time | WebSocket with cursor semantics |
| Validation | Zod schemas (shared contracts) |
| Auth | JWT + httpOnly refresh cookies |
| Testing | Vitest, Jest, Playwright |
| Build | pnpm workspaces, Turborepo |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/signalgrid.git
cd signalgrid

# Start PostgreSQL
docker compose up -d db

# Install dependencies
pnpm install

# Set up environment
cp apps/api/.env.example apps/api/.env
# Edit .env with your JWT_SECRET

# Run database migrations
pnpm --filter @signalgrid/api prisma migrate dev

# Seed sample data
pnpm --filter @signalgrid/api seed

# Start development servers
pnpm dev
```

The application will be available at:
- **Frontend**: http://localhost:5180
- **API**: http://localhost:3000

### Environment Variables

Create `apps/api/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/signalgrid
JWT_SECRET=your-secret-key-minimum-32-characters
```

## Development

### Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm build                  # Build all packages

# Testing
pnpm test                   # Run unit tests
pnpm e2e                    # Run Playwright tests

# Code Quality
pnpm typecheck              # Type checking
pnpm lint                   # Linting
pnpm format                 # Format code
```

### Package-specific Commands

```bash
# API
pnpm --filter @signalgrid/api dev
pnpm --filter @signalgrid/api test:e2e
pnpm --filter @signalgrid/api prisma studio

# Web
pnpm --filter @signalgrid/web dev
pnpm --filter @signalgrid/web build
pnpm --filter @signalgrid/web preview
```

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Create account |
| `/auth/login` | POST | Sign in |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/logout` | POST | Sign out |
| `/me` | GET | Current user context |

### Events

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/events` | GET | List events (paginated) |
| `/events` | POST | Create event |
| `/ws` | WS | Real-time event stream |

### Incidents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/incidents` | GET | List incidents |
| `/incidents` | POST | Create incident |
| `/incidents/:id` | GET | Incident detail |
| `/incidents/:id` | PATCH | Update incident |
| `/incidents/:id/comments` | POST | Add comment |

### Metrics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/metrics/ops` | GET | Operational metrics |
| `/metrics/timeseries` | GET | Event volume over time |

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/healthz` | GET | Liveness probe |
| `/readyz` | GET | Readiness probe |

## WebSocket Protocol

Connect to `/ws?token=<jwt>` for real-time events.

**Subscribe to events:**
```json
{
  "type": "subscribe_events",
  "requestId": "uuid",
  "filters": { "severity": "error", "type": null },
  "cursor": null
}
```

**Receive events:**
```json
{
  "type": "event",
  "event": { "id": "...", "severity": "error", ... },
  "cursor": "12345"
}
```

## Architecture

### Trust Boundaries

- All API inputs validated with Zod schemas
- All API responses validated by SDK
- Tenant isolation enforced server-side
- JWT required for all protected routes

## Testing

```bash
# Unit & integration tests
pnpm test

# API E2E tests
pnpm --filter @signalgrid/api test:e2e

# Browser E2E tests
pnpm e2e                    # Headless
pnpm e2e -- --headed        # With browser
pnpm e2e -- --ui            # Interactive mode
```

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design and data flow |
| [CONTRACTS.md](./CONTRACTS.md) | API contract specifications |
| [TESTING.md](./TESTING.md) | Testing strategy and setup |
| [RUNBOOK.md](./RUNBOOK.md) | Operations guide |
| [docs/ADR/](./docs/ADR/) | Architecture decision records |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- TypeScript strict mode (no `any`)
- Zod validation at trust boundaries
- Tests for new functionality
- Lint and typecheck must pass

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with Vue, NestJS, and PostgreSQL
