import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Incidents (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

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
    await prisma.comment.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.incident.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // Create test user via register endpoint
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'incidents-test@example.com', password: 'password123' })
      .expect(201);

    authToken = registerResponse.body.token;

    // Get user ID from /me
    const meResponse = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    userId = meResponse.body.user.id;
  });

  afterAll(async () => {
    await prisma.comment.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.incident.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});
    await app.close();
  });

  describe('POST /incidents', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/incidents')
        .send({ title: 'Test Incident' })
        .expect(401);
    });

    it('should create an incident', async () => {
      const response = await request(app.getHttpServer())
        .post('/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'API Gateway 5xx Spike',
          description: 'Elevated error rate on /api/v1/users',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe('API Gateway 5xx Spike');
      expect(response.body.description).toBe('Elevated error rate on /api/v1/users');
      expect(response.body.status).toBe('OPEN');
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.commentCount).toBe(0);
      expect(response.body.eventCount).toBe(0);
    });

    it('should create an incident with linked events', async () => {
      // Create some events first
      const event1 = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'api.error',
          severity: 'error',
          fingerprint: 'incident-event-1',
          payload: { message: 'Error 1' },
        })
        .expect(201);

      const event2 = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'api.error',
          severity: 'error',
          fingerprint: 'incident-event-2',
          payload: { message: 'Error 2' },
        })
        .expect(201);

      // Create incident with linked events
      const response = await request(app.getHttpServer())
        .post('/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Incident with Events',
          eventIds: [event1.body.id, event2.body.id],
        })
        .expect(201);

      expect(response.body.eventCount).toBe(2);
    });

    it('should reject invalid title', async () => {
      await request(app.getHttpServer())
        .post('/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /incidents', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/incidents').expect(401);
    });

    it('should return incidents list', async () => {
      const response = await request(app.getHttpServer())
        .get('/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.items).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBeGreaterThan(0);

      const incident = response.body.items[0];
      expect(incident.id).toBeDefined();
      expect(incident.title).toBeDefined();
      expect(incident.status).toBeDefined();
      expect(incident.createdAt).toBeDefined();
    });
  });

  describe('GET /incidents/:id', () => {
    let incidentId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Detail Test Incident' })
        .expect(201);

      incidentId = response.body.id;
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get(`/incidents/${incidentId}`).expect(401);
    });

    it('should return incident detail', async () => {
      const response = await request(app.getHttpServer())
        .get(`/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.incident).toBeDefined();
      expect(response.body.incident.id).toBe(incidentId);
      expect(response.body.incident.title).toBe('Detail Test Incident');
      expect(response.body.incident.status).toBe('OPEN');
      expect(response.body.incident.comments).toEqual([]);
      expect(response.body.incident.events).toEqual([]);
    });

    it('should return 404 for non-existent incident', async () => {
      await request(app.getHttpServer())
        .get('/incidents/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /incidents/:id', () => {
    let incidentId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Update Test Incident' })
        .expect(201);

      incidentId = response.body.id;
    });

    it('should update incident title', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
    });

    it('should update incident status to CLOSED', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'CLOSED' })
        .expect(200);

      expect(response.body.status).toBe('CLOSED');
    });

    it('should reject invalid status', async () => {
      await request(app.getHttpServer())
        .patch(`/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'INVALID' })
        .expect(400);
    });
  });

  describe('POST /incidents/:id/comments', () => {
    let incidentId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Comment Test Incident' })
        .expect(201);

      incidentId = response.body.id;
    });

    it('should add a comment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/incidents/${incidentId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ body: 'Investigating root cause' })
        .expect(201);

      expect(response.body.comment).toBeDefined();
      expect(response.body.comment.id).toBeDefined();
      expect(response.body.comment.body).toBe('Investigating root cause');
      expect(response.body.comment.createdAt).toBeDefined();
      expect(response.body.comment.author.id).toBe(userId);
      expect(response.body.comment.author.email).toBe('incidents-test@example.com');
    });

    it('should show comment in incident detail', async () => {
      const response = await request(app.getHttpServer())
        .get(`/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.incident.comments.length).toBeGreaterThan(0);
      expect(response.body.incident.comments[0].body).toBe('Investigating root cause');
    });

    it('should reject empty comment', async () => {
      await request(app.getHttpServer())
        .post(`/incidents/${incidentId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ body: '' })
        .expect(400);
    });
  });

  describe('Tenant isolation', () => {
    it('should not return incidents from other tenants', async () => {
      // Re-login to ensure fresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'incidents-test@example.com', password: 'password123' })
        .expect(200);
      const freshToken = loginResponse.body.token;

      // Create an incident as first user
      await request(app.getHttpServer())
        .post('/incidents')
        .set('Authorization', `Bearer ${freshToken}`)
        .send({ title: 'First User Incident' })
        .expect(201);

      // Create another user (new tenant)
      const otherUser = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'other-incidents@example.com', password: 'password123' })
        .expect(201);

      // List incidents with other user's token
      const response = await request(app.getHttpServer())
        .get('/incidents')
        .set('Authorization', `Bearer ${otherUser.body.token}`)
        .expect(200);

      // Should have no incidents (all incidents belong to first tenant)
      expect(response.body.items.length).toBe(0);
    });

    it('should not allow access to other tenant incidents', async () => {
      // Re-login to ensure fresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'incidents-test@example.com', password: 'password123' })
        .expect(200);
      const freshToken = loginResponse.body.token;

      // Create an incident specifically for this test
      const createResponse = await request(app.getHttpServer())
        .post('/incidents')
        .set('Authorization', `Bearer ${freshToken}`)
        .send({ title: 'Tenant Isolation Test' })
        .expect(201);

      const incidentId = createResponse.body.id;

      // Create another user (new tenant)
      const otherUser = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'other-incidents-2@example.com', password: 'password123' })
        .expect(201);

      // Try to access with other user's token
      await request(app.getHttpServer())
        .get(`/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${otherUser.body.token}`)
        .expect(403);
    });
  });
});
