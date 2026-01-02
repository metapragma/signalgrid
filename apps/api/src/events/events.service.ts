import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Severity, Prisma } from '@prisma/client';
import { EventsGateway } from './events.gateway';

export interface EventsQueryParams {
  tenantId: string;
  cursor?: string;
  limit: number;
  severity?: Severity;
  type?: string;
}

export interface CreateEventParams {
  tenantId: string;
  type: string;
  severity: Severity;
  fingerprint: string;
  payload: Record<string, unknown>;
  ts?: Date;
}

export interface EventResult {
  id: string;
  ts: string;
  type: string;
  severity: string;
  fingerprint: string;
  payload: Record<string, unknown>;
  cursor: string;
}

export interface EventsListResult {
  items: EventResult[];
  nextCursor: string | null;
}

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
  ) {}

  async list(params: EventsQueryParams): Promise<EventsListResult> {
    const { tenantId, cursor, limit, severity, type } = params;

    // Build where clause
    const where: {
      tenantId: string;
      seq?: { lt: bigint };
      severity?: Severity;
      type?: string;
    } = { tenantId };

    // Cursor is the seq value encoded as string
    if (cursor) {
      where.seq = { lt: BigInt(cursor) };
    }

    if (severity) {
      where.severity = severity;
    }

    if (type) {
      where.type = type;
    }

    // Fetch one extra to determine if there's a next page
    const events = await this.prisma.event.findMany({
      where,
      orderBy: { seq: 'desc' },
      take: limit + 1,
    });

    // Check if there are more results
    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, limit) : events;

    // Map to response format
    const mappedItems: EventResult[] = items.map((event) => ({
      id: event.id,
      ts: event.ts.toISOString(),
      type: event.type,
      severity: event.severity,
      fingerprint: event.fingerprint,
      payload: event.payload as Record<string, unknown>,
      cursor: event.seq.toString(),
    }));

    // Next cursor is the seq of the last item
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].seq.toString() : null;

    return {
      items: mappedItems,
      nextCursor,
    };
  }

  async create(params: CreateEventParams): Promise<EventResult> {
    const event = await this.prisma.event.create({
      data: {
        tenantId: params.tenantId,
        type: params.type,
        severity: params.severity,
        fingerprint: params.fingerprint,
        payload: params.payload as Prisma.InputJsonValue,
        ts: params.ts ?? new Date(),
      },
    });

    // Broadcast to WebSocket clients
    await this.eventsGateway.broadcastEvent(event);

    return {
      id: event.id,
      ts: event.ts.toISOString(),
      type: event.type,
      severity: event.severity,
      fingerprint: event.fingerprint,
      payload: event.payload as Record<string, unknown>,
      cursor: event.seq.toString(),
    };
  }
}
