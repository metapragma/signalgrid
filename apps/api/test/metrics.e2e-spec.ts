import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('MetricsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useWebSocketAdapter(new WsAdapter(app));
    await app.init();

    prisma = app.get(PrismaService);

    // Clean up existing test data
    await prisma.event.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.incident.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // Create a test user
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'metrics@test.com', password: 'password123' })
      .expect(201);

    authToken = registerRes.body.token;

    // Get tenant ID from /me
    const meRes = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    tenantId = meRes.body.tenant.id;
  });

  afterAll(async () => {
    await prisma.event.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.incident.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});
    await app.close();
  });

  describe('GET /metrics/ops', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/metrics/ops').expect(401);
    });

    it('should return metrics with empty data', async () => {
      const res = await request(app.getHttpServer())
        .get('/metrics/ops')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('latencyMs');
      expect(res.body).toHaveProperty('errorRate');
      expect(res.body).toHaveProperty('topFingerprints');
      expect(res.body.latencyMs).toHaveProperty('p50');
      expect(res.body.latencyMs).toHaveProperty('p95');
      expect(res.body.latencyMs).toHaveProperty('p99');
      expect(res.body.errorRate).toBe(0);
      expect(res.body.topFingerprints).toEqual([]);
    });

    it('should compute error rate correctly', async () => {
      // Create some test events
      const now = new Date();
      await prisma.event.createMany({
        data: [
          {
            tenantId,
            type: 'api.request',
            severity: 'info',
            fingerprint: 'fp-info-1',
            payload: {},
            ts: now,
          },
          {
            tenantId,
            type: 'api.request',
            severity: 'info',
            fingerprint: 'fp-info-2',
            payload: {},
            ts: now,
          },
          {
            tenantId,
            type: 'api.error',
            severity: 'error',
            fingerprint: 'fp-error-1',
            payload: {},
            ts: now,
          },
          {
            tenantId,
            type: 'api.error',
            severity: 'error',
            fingerprint: 'fp-error-1',
            payload: {},
            ts: now,
          },
        ],
      });

      const res = await request(app.getHttpServer())
        .get('/metrics/ops')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 2 errors out of 4 events = 0.5
      expect(res.body.errorRate).toBe(0.5);
    });

    it('should return top fingerprints sorted by count', async () => {
      const res = await request(app.getHttpServer())
        .get('/metrics/ops')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.topFingerprints.length).toBeGreaterThan(0);

      // fp-error-1 should be first (2 occurrences)
      const topFingerprint = res.body.topFingerprints[0];
      expect(topFingerprint.fingerprint).toBe('fp-error-1');
      expect(topFingerprint.count).toBe(2);
    });

    it('should compute latency percentiles from inter-arrival times', async () => {
      // Create events with varied timestamps
      const now = new Date();
      await prisma.event.createMany({
        data: Array.from({ length: 10 }, (_, i) => ({
          tenantId,
          type: 'latency.test',
          severity: 'info' as const,
          fingerprint: 'fp-latency',
          payload: {},
          ts: new Date(now.getTime() - i * 100), // 100ms apart
        })),
      });

      const res = await request(app.getHttpServer())
        .get('/metrics/ops')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(typeof res.body.latencyMs.p50).toBe('number');
      expect(typeof res.body.latencyMs.p95).toBe('number');
      expect(typeof res.body.latencyMs.p99).toBe('number');
    });

    it('should respect tenant isolation', async () => {
      // Create a second user in a different tenant
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'metrics2@test.com', password: 'password123' })
        .expect(201);

      const otherToken = registerRes.body.token;

      // The other user should see empty metrics (no events in their tenant)
      const res = await request(app.getHttpServer())
        .get('/metrics/ops')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(res.body.errorRate).toBe(0);
      expect(res.body.topFingerprints).toEqual([]);
    });
  });
});
