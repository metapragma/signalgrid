import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'ws';
import type { WebSocket as WsWebSocket } from 'ws';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Severity } from '@prisma/client';
import { IncomingMessage } from 'http';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
}

interface Subscription {
  requestId: string;
  filters: {
    severity: Severity | null;
    type: string | null;
  };
  cursor: string | null;
}

interface AuthenticatedClient {
  socket: WsWebSocket;
  tenantId: string;
  userId: string;
  subscriptions: Map<string, Subscription>;
  lastEventTime: number;
}

// Extend WebSocket to store client data
interface ExtendedWebSocket extends WsWebSocket {
  clientData?: AuthenticatedClient;
}

@WebSocketGateway({ path: '/ws' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private clients = new Map<WsWebSocket, AuthenticatedClient>();

  // Backpressure: max events a client can fall behind before resync
  private readonly MAX_LAG_EVENTS = 1000;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: ExtendedWebSocket, request: IncomingMessage): Promise<void> {
    try {
      // Extract token from query string
      const url = new URL(request.url || '', 'http://localhost');
      const token = url.searchParams.get('token');

      if (!token) {
        this.sendError(client, 'AUTH_REQUIRED', 'Token required');
        client.close(4001, 'Authentication required');
        return;
      }

      // Verify JWT
      const secret = this.configService.get<string>('JWT_SECRET');
      let payload: JwtPayload;

      try {
        payload = this.jwtService.verify(token, { secret }) as JwtPayload;
      } catch {
        this.sendError(client, 'AUTH_INVALID', 'Invalid token');
        client.close(4002, 'Invalid token');
        return;
      }

      // Store authenticated client
      const clientData: AuthenticatedClient = {
        socket: client,
        tenantId: payload.tenantId,
        userId: payload.sub,
        subscriptions: new Map(),
        lastEventTime: Date.now(),
      };

      client.clientData = clientData;
      this.clients.set(client, clientData);

      // Set up message handler for this client
      client.on('message', (data) => {
        this.handleMessage(client, data.toString());
      });

      this.logger.log(`Client connected: ${payload.sub} (tenant: ${payload.tenantId})`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.close(4000, 'Connection error');
    }
  }

  handleDisconnect(client: ExtendedWebSocket): void {
    const clientData = this.clients.get(client);
    if (clientData) {
      this.logger.log(`Client disconnected: ${clientData.userId}`);
      this.clients.delete(client);
    }
  }

  private handleMessage(client: ExtendedWebSocket, rawData: string): void {
    const clientData = this.clients.get(client);
    if (!clientData) {
      this.sendError(client, 'NOT_AUTHENTICATED', 'Not authenticated');
      return;
    }

    try {
      const message = JSON.parse(rawData);

      switch (message.type) {
        case 'subscribe_events':
          this.handleSubscribe(client, clientData, message);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(clientData, message);
          break;
        case 'ping':
          this.handlePing(client, message);
          break;
        default:
          this.sendError(client, 'UNKNOWN_MESSAGE', `Unknown message type: ${message.type}`);
      }
    } catch {
      this.sendError(client, 'PARSE_ERROR', 'Invalid JSON message');
    }
  }

  private handleSubscribe(
    client: ExtendedWebSocket,
    clientData: AuthenticatedClient,
    data: {
      requestId: string;
      filters: { severity: string | null; type: string | null };
      cursor: string | null;
    },
  ): void {
    const subscription: Subscription = {
      requestId: data.requestId,
      filters: {
        severity: data.filters?.severity as Severity | null,
        type: data.filters?.type || null,
      },
      cursor: data.cursor || null,
    };

    clientData.subscriptions.set(data.requestId, subscription);

    // Send subscribed confirmation
    this.send(client, {
      type: 'subscribed',
      requestId: data.requestId,
    });

    this.logger.debug(`Client ${clientData.userId} subscribed: ${data.requestId}`);

    // If cursor provided, send events from that point
    if (data.cursor) {
      this.sendEventsFromCursor(client, clientData, subscription);
    }
  }

  private handleUnsubscribe(clientData: AuthenticatedClient, data: { requestId: string }): void {
    clientData.subscriptions.delete(data.requestId);
    this.logger.debug(`Client ${clientData.userId} unsubscribed: ${data.requestId}`);
  }

  private handlePing(client: ExtendedWebSocket, data: { ts: string }): void {
    this.send(client, {
      type: 'pong',
      ts: data.ts,
    });
  }

  /**
   * Broadcast a new event to all subscribed clients
   */
  async broadcastEvent(event: {
    id: string;
    ts: Date;
    type: string;
    severity: Severity;
    fingerprint: string;
    payload: unknown;
    tenantId: string;
    seq: bigint;
  }): Promise<void> {
    const cursor = event.seq.toString();

    for (const [socket, clientData] of this.clients) {
      // Only send to clients in the same tenant
      if (clientData.tenantId !== event.tenantId) {
        continue;
      }

      // Check each subscription
      for (const subscription of clientData.subscriptions.values()) {
        if (this.matchesFilters(event, subscription.filters)) {
          this.send(socket, {
            type: 'event',
            event: {
              id: event.id,
              ts: event.ts.toISOString(),
              type: event.type,
              severity: event.severity,
              fingerprint: event.fingerprint,
              payload: event.payload,
            },
            cursor,
          });

          // Update subscription cursor
          subscription.cursor = cursor;
        }
      }

      // Update last event time for backpressure tracking
      clientData.lastEventTime = Date.now();
    }
  }

  /**
   * Check if a client has fallen too far behind (backpressure)
   */
  async checkBackpressure(client: ExtendedWebSocket): Promise<void> {
    const clientData = this.clients.get(client);
    if (!clientData) return;

    for (const subscription of clientData.subscriptions.values()) {
      if (!subscription.cursor) continue;

      // Check how many events behind the client is
      const behindCount = await this.prisma.event.count({
        where: {
          tenantId: clientData.tenantId,
          seq: { gt: BigInt(subscription.cursor) },
        },
      });

      if (behindCount > this.MAX_LAG_EVENTS) {
        this.send(client, {
          type: 'resync_required',
          reason: 'CLIENT_LAG',
        });

        // Clear the subscription cursor to force re-fetch
        subscription.cursor = null;

        this.logger.warn(
          `Client ${clientData.userId} triggered backpressure resync (${behindCount} events behind)`,
        );
      }
    }
  }

  private async sendEventsFromCursor(
    client: WsWebSocket,
    clientData: AuthenticatedClient,
    subscription: Subscription,
  ): Promise<void> {
    if (!subscription.cursor) return;

    try {
      // Fetch events after the cursor
      const events = await this.prisma.event.findMany({
        where: {
          tenantId: clientData.tenantId,
          seq: { gt: BigInt(subscription.cursor) },
          ...(subscription.filters.severity && { severity: subscription.filters.severity }),
          ...(subscription.filters.type && { type: subscription.filters.type }),
        },
        orderBy: { seq: 'asc' },
        take: 100, // Batch size for catch-up
      });

      // Check for backpressure
      if (events.length === 100) {
        const totalBehind = await this.prisma.event.count({
          where: {
            tenantId: clientData.tenantId,
            seq: { gt: BigInt(subscription.cursor) },
          },
        });

        if (totalBehind > this.MAX_LAG_EVENTS) {
          this.send(client, {
            type: 'resync_required',
            reason: 'CLIENT_LAG',
          });
          return;
        }
      }

      // Send each event
      for (const event of events) {
        this.send(client, {
          type: 'event',
          event: {
            id: event.id,
            ts: event.ts.toISOString(),
            type: event.type,
            severity: event.severity,
            fingerprint: event.fingerprint,
            payload: event.payload,
          },
          cursor: event.seq.toString(),
        });

        subscription.cursor = event.seq.toString();
      }
    } catch (error) {
      this.logger.error('Error sending events from cursor:', error);
    }
  }

  private matchesFilters(
    event: { severity: Severity; type: string },
    filters: { severity: Severity | null; type: string | null },
  ): boolean {
    if (filters.severity && event.severity !== filters.severity) {
      return false;
    }
    if (filters.type && event.type !== filters.type) {
      return false;
    }
    return true;
  }

  private send(client: WsWebSocket, data: unknown): void {
    if (client.readyState === 1) {
      // WebSocket.OPEN = 1
      client.send(JSON.stringify(data));
    }
  }

  private sendError(client: WsWebSocket, code: string, message: string): void {
    this.send(client, {
      type: 'error',
      error: { code, message },
    });
  }
}
