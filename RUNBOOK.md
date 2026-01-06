# RUNBOOK.md — SignalGrid Operations

## Overview

SignalGrid is a real-time event monitoring and incident management platform. This runbook provides operational procedures for running, monitoring, and troubleshooting the system.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Web App   │────▶│   API       │────▶│  PostgreSQL │
│  (Vue 3)    │     │  (NestJS)   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │
      │              WebSocket
      └───────────────────┘
```

## Quick Reference

| Service     | Port | Health Check    |
| ----------- | ---- | --------------- |
| API         | 3000 | `GET /healthz`  |
| API (ready) | 3000 | `GET /readyz`   |
| Web         | 5173 | HTTP 200 on `/` |
| PostgreSQL  | 5432 | `pg_isready`    |

## Starting the Stack

### Development

```bash
# Start all services
pnpm dev

# Or start individually
docker compose up -d db          # Database only
pnpm --filter @signalgrid/api dev   # API only
pnpm --filter @signalgrid/web dev   # Web only
```

### Production

```bash
# Build all packages
pnpm build

# Start API in production mode
NODE_ENV=production pnpm --filter @signalgrid/api start:prod
```

## Environment Variables

### Required (API)

| Variable       | Description                           | Example                                            |
| -------------- | ------------------------------------- | -------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string          | `postgresql://user:pass@localhost:5432/signalgrid` |
| `JWT_SECRET`   | Secret for JWT signing (min 32 chars) | `your-secret-key-here`                             |

### Optional (API)

| Variable   | Default       | Description                               |
| ---------- | ------------- | ----------------------------------------- |
| `PORT`     | `3000`        | API server port                           |
| `NODE_ENV` | `development` | Environment (development/test/production) |

### Optional (Web)

| Variable       | Default                 | Description  |
| -------------- | ----------------------- | ------------ |
| `VITE_API_URL` | `http://localhost:3000` | API base URL |

## Health Checks

### Liveness (`/healthz`)

Returns `200 OK` if the API process is running.

```bash
curl http://localhost:3000/healthz
# {"status":"ok"}
```

### Readiness (`/readyz`)

Returns `200 OK` if the API can connect to the database.

```bash
curl http://localhost:3000/readyz
# {"status":"ok","db":"connected"}
```

If database is unreachable:

```json
{ "status": "error", "db": "disconnected" }
```

## Rate Limiting

The API enforces rate limits to prevent abuse:

| Window   | Limit         | Description      |
| -------- | ------------- | ---------------- |
| 1 second | 20 requests   | Burst protection |
| 1 minute | 200 requests  | Short-term limit |
| 1 hour   | 2000 requests | Long-term limit  |

Rate-limited requests receive `429 Too Many Requests`.

**Excluded endpoints:** `/healthz`, `/readyz`

## Security Headers

The API sets the following security headers via Helmet:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 0` (deprecated, CSP preferred)
- `Content-Security-Policy: default-src 'self'; ...`
- `Strict-Transport-Security: max-age=15552000; includeSubDomains`

## Database Operations

### Run Migrations

```bash
# Development (creates migration if schema changed)
pnpm --filter @signalgrid/api prisma migrate dev

# Production (applies pending migrations)
pnpm --filter @signalgrid/api prisma migrate deploy
```

### Reset Database

```bash
# WARNING: Destroys all data
pnpm --filter @signalgrid/api prisma migrate reset
```

### Check Migration Status

```bash
pnpm --filter @signalgrid/api prisma migrate status
```

## Monitoring

### Key Metrics to Watch

1. **Error Rate** (`/metrics/ops`)
   - Normal: < 1%
   - Warning: 1-5%
   - Critical: > 5%

2. **Response Times**
   - p50: < 50ms
   - p95: < 200ms
   - p99: < 500ms

3. **WebSocket Connections**
   - Monitor active connection count
   - Watch for CLIENT_LAG events (backpressure)

### Logging

API logs to stdout in JSON format (production) or pretty format (development).

Log levels:

- `error`: Unrecoverable errors
- `warn`: Recoverable issues, rate limiting hits
- `info`: Request lifecycle, connections
- `debug`: Detailed debugging (development only)

## Incident Response

### High Error Rate (> 5%)

1. Check `/readyz` for database connectivity
2. Review API logs for error patterns
3. Check database connection pool status
4. Verify external service dependencies

```bash
# Check recent errors
docker compose logs api --tail=100 | grep -i error
```

### WebSocket Disconnections

1. Check for CLIENT_LAG warnings (client too slow)
2. Verify network connectivity
3. Check memory usage (event buffer overflow)

```bash
# Monitor WebSocket activity
docker compose logs api | grep -i websocket
```

### Database Issues

1. Check PostgreSQL status

```bash
docker compose exec db pg_isready
```

2. Check connection pool

```bash
docker compose exec db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE datname='signalgrid';"
```

3. Check for long-running queries

```bash
docker compose exec db psql -U postgres -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state != 'idle' AND datname='signalgrid' ORDER BY duration DESC LIMIT 10;"
```

### Rate Limiting Issues

If legitimate traffic is being rate-limited:

1. Check client IP distribution (ensure not behind single proxy)
2. Review rate limit thresholds in `app.module.ts`
3. Consider implementing API keys for high-volume clients

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker compose exec db pg_dump -U postgres signalgrid > backup_$(date +%Y%m%d).sql

# Restore from backup
docker compose exec -T db psql -U postgres signalgrid < backup_20241230.sql
```

## Scaling Considerations

### Horizontal Scaling (API)

- API is stateless; run multiple instances behind load balancer
- Ensure sticky sessions for WebSocket connections
- Use Redis for rate limiting state sharing (not implemented in V1)

### Database Scaling

- Add read replicas for read-heavy workloads
- Consider partitioning events table by tenant or date
- Add indexes for common query patterns

## Troubleshooting Commands

```bash
# Check all services
docker compose ps

# View API logs
docker compose logs -f api

# Connect to database
docker compose exec db psql -U postgres signalgrid

# Test API connectivity
curl -v http://localhost:3000/healthz

# Test WebSocket
wscat -c "ws://localhost:3000/ws?token=YOUR_JWT_TOKEN"

# Check disk usage
docker system df

# Clean up Docker resources
docker system prune -f
```
