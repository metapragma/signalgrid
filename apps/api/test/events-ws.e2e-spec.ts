/* global setTimeout, clearTimeout */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import request from 'supertest';
import WebSocket from 'ws';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Events WebSocket (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let wsUrl: string;

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
    await app.listen(0); // Random port

    const address = app.getHttpServer().address();
    const port = typeof address === 'object' ? address?.port : 3000;
    wsUrl = `ws://localhost:${port}/ws`;

    prisma = app.get(PrismaService);

    // Clean up test data
    await prisma.event.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // Create test user via register endpoint
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'wstest@example.com', password: 'password123' })
      .expect(201);

    authToken = registerResponse.body.token;

    // Verify user creation by fetching /me
    await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });

  afterAll(async () => {
    await prisma.event.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});
    await app.close();
  });

  function connectWebSocket(token?: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const url = token ? `${wsUrl}?token=${token}` : wsUrl;
      const ws = new WebSocket(url);

      ws.on('open', () => resolve(ws));
      ws.on('error', reject);

      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
  }

  function waitForMessage(ws: WebSocket, timeout = 5000): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Message timeout')), timeout);

      ws.once('message', (data) => {
        clearTimeout(timer);
        resolve(JSON.parse(data.toString()));
      });
    });
  }

  describe('Authentication', () => {
    it('should reject connection without token', async () => {
      const ws = new WebSocket(wsUrl);

      const closePromise = new Promise<{ code: number; reason: string }>((resolve) => {
        ws.on('close', (code, reason) => {
          resolve({ code, reason: reason.toString() });
        });
      });

      const result = await closePromise;
      expect(result.code).toBe(4001);
    });

    it('should reject connection with invalid token', async () => {
      const ws = new WebSocket(`${wsUrl}?token=invalid-token`);

      const closePromise = new Promise<{ code: number }>((resolve) => {
        ws.on('close', (code) => {
          resolve({ code });
        });
      });

      const result = await closePromise;
      expect(result.code).toBe(4002);
    });

    it('should accept connection with valid token', async () => {
      const ws = await connectWebSocket(authToken);
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
    });
  });

  describe('Subscribe/Unsubscribe', () => {
    it('should confirm subscription', async () => {
      const ws = await connectWebSocket(authToken);

      ws.send(
        JSON.stringify({
          type: 'subscribe_events',
          requestId: 'test-sub-1',
          filters: { severity: null, type: null },
          cursor: null,
        }),
      );

      const response = await waitForMessage(ws);
      expect(response).toEqual({
        type: 'subscribed',
        requestId: 'test-sub-1',
      });

      ws.close();
    });
  });

  describe('Ping/Pong', () => {
    it('should respond to ping with pong', async () => {
      const ws = await connectWebSocket(authToken);

      const ts = new Date().toISOString();
      ws.send(
        JSON.stringify({
          type: 'ping',
          ts,
        }),
      );

      const response = await waitForMessage(ws);
      expect(response).toEqual({
        type: 'pong',
        ts,
      });

      ws.close();
    });
  });

  describe('Event Broadcasting', () => {
    it('should receive events when subscribed', async () => {
      const ws = await connectWebSocket(authToken);

      // Subscribe
      ws.send(
        JSON.stringify({
          type: 'subscribe_events',
          requestId: 'broadcast-test',
          filters: { severity: null, type: null },
          cursor: null,
        }),
      );

      // Wait for subscription confirmation
      await waitForMessage(ws);

      // Set up listener BEFORE making POST (message is sent synchronously during create)
      const eventPromise = waitForMessage(ws);

      // Create an event via REST API
      const createResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'test.event',
          severity: 'info',
          fingerprint: 'test-fp',
          payload: { message: 'Hello WebSocket!' },
        })
        .expect(201);

      // Wait for the event via WebSocket
      const eventMessage = (await eventPromise) as {
        type: string;
        event: { id: string; type: string };
        cursor: string;
      };

      expect(eventMessage.type).toBe('event');
      expect(eventMessage.event.id).toBe(createResponse.body.id);
      expect(eventMessage.event.type).toBe('test.event');
      expect(eventMessage.cursor).toBeDefined();

      ws.close();
    });

    it('should filter events by severity', async () => {
      const ws = await connectWebSocket(authToken);

      // Subscribe to only error events
      ws.send(
        JSON.stringify({
          type: 'subscribe_events',
          requestId: 'filter-test',
          filters: { severity: 'error', type: null },
          cursor: null,
        }),
      );

      await waitForMessage(ws); // subscription confirmation

      // Set up listener BEFORE making any events
      const eventPromise = waitForMessage(ws);

      // Create an info event (should NOT be received due to filter)
      await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'filtered.event',
          severity: 'info',
          fingerprint: 'filter-test-info',
          payload: { should: 'not receive' },
        })
        .expect(201);

      // Create an error event (should be received)
      const errorEvent = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'filtered.event',
          severity: 'error',
          fingerprint: 'filter-test-error',
          payload: { should: 'receive' },
        })
        .expect(201);

      // The listener should only receive the error event (info is filtered out)
      const eventMessage = (await eventPromise) as {
        type: string;
        event: { id: string; severity: string };
      };

      expect(eventMessage.type).toBe('event');
      expect(eventMessage.event.id).toBe(errorEvent.body.id);
      expect(eventMessage.event.severity).toBe('error');

      ws.close();
    });
  });

  describe('Tenant Isolation', () => {
    it('should not receive events from other tenants', async () => {
      // Create another user (new tenant)
      const otherUser = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'other-ws@example.com', password: 'password123' })
        .expect(201);

      // Connect first user and subscribe
      const ws1 = await connectWebSocket(authToken);
      ws1.send(
        JSON.stringify({
          type: 'subscribe_events',
          requestId: 'isolation-test',
          filters: { severity: null, type: null },
          cursor: null,
        }),
      );
      await waitForMessage(ws1); // subscription confirmation

      // Create an event as the OTHER user
      await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${otherUser.body.token}`)
        .send({
          type: 'other.tenant.event',
          severity: 'info',
          fingerprint: 'other-tenant',
          payload: { secret: 'data' },
        })
        .expect(201);

      // First user should NOT receive this event
      // Wait a short time and verify no message received
      const messagePromise = waitForMessage(ws1, 1000).catch(() => null);
      const result = await messagePromise;

      expect(result).toBeNull(); // No message received

      ws1.close();
    });
  });
});
