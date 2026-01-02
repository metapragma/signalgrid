import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Events (e2e)', () => {
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

    // Clean up test data
    await prisma.event.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // Create test user via register endpoint
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201);

    authToken = registerResponse.body.token;

    // Get tenant ID from /me
    const meResponse = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    tenantId = meResponse.body.tenant.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.event.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});
    await app.close();
  });

  describe('GET /events', () => {
    beforeAll(async () => {
      // Create test events
      const events = [];
      for (let i = 0; i < 10; i++) {
        events.push({
          tenantId,
          type: i % 2 === 0 ? 'error.logged' : 'request.failed',
          severity: i % 4 === 0 ? 'error' : i % 3 === 0 ? 'warn' : 'info',
          fingerprint: `fp-${i}`,
          payload: { index: i, message: `Test event ${i}` },
        });
      }
      await prisma.event.createMany({ data: events as never });
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/events').expect(401);
    });

    it('should return events for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.items).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBe(10);
      expect(response.body.nextCursor).toBeNull();

      // Verify event structure
      const event = response.body.items[0];
      expect(event.id).toBeDefined();
      expect(event.ts).toBeDefined();
      expect(event.type).toBeDefined();
      expect(event.severity).toBeDefined();
      expect(event.fingerprint).toBeDefined();
      expect(event.payload).toBeDefined();
      expect(event.cursor).toBeDefined();
    });

    it('should respect limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/events?limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.items.length).toBe(3);
      expect(response.body.nextCursor).not.toBeNull();
    });

    it('should support cursor pagination', async () => {
      // Get first page
      const page1 = await request(app.getHttpServer())
        .get('/events?limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(page1.body.items.length).toBe(5);
      expect(page1.body.nextCursor).not.toBeNull();

      // Get second page using cursor
      const page2 = await request(app.getHttpServer())
        .get(`/events?limit=5&cursor=${page1.body.nextCursor}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(page2.body.items.length).toBe(5);
      expect(page2.body.nextCursor).toBeNull();

      // Verify no overlap between pages
      const page1Ids = page1.body.items.map((e: { id: string }) => e.id);
      const page2Ids = page2.body.items.map((e: { id: string }) => e.id);
      const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(overlap.length).toBe(0);
    });

    it('should filter by severity', async () => {
      const response = await request(app.getHttpServer())
        .get('/events?severity=error')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);
      response.body.items.forEach((event: { severity: string }) => {
        expect(event.severity).toBe('error');
      });
    });

    it('should filter by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/events?type=error.logged')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);
      response.body.items.forEach((event: { type: string }) => {
        expect(event.type).toBe('error.logged');
      });
    });

    it('should combine filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/events?severity=info&type=request.failed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.items.forEach((event: { severity: string; type: string }) => {
        expect(event.severity).toBe('info');
        expect(event.type).toBe('request.failed');
      });
    });

    it('should reject invalid limit', async () => {
      await request(app.getHttpServer())
        .get('/events?limit=500')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should reject invalid severity', async () => {
      await request(app.getHttpServer())
        .get('/events?severity=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('Tenant isolation', () => {
    it('should not return events from other tenants', async () => {
      // Create another user (new tenant)
      const otherUser = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'other@example.com', password: 'password123' })
        .expect(201);

      // Get events with other user's token
      const response = await request(app.getHttpServer())
        .get('/events')
        .set('Authorization', `Bearer ${otherUser.body.token}`)
        .expect(200);

      // Should have no events (all events belong to first tenant)
      expect(response.body.items.length).toBe(0);
    });
  });
});
