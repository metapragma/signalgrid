import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentStatus } from '@prisma/client';

export interface CreateIncidentParams {
  tenantId: string;
  title: string;
  description?: string;
  relatedEventIds?: string[];
}

export interface UpdateIncidentParams {
  title?: string;
  description?: string;
  status?: IncidentStatus;
}

export interface CreateCommentParams {
  incidentId: string;
  authorId: string;
  body: string;
}

@Injectable()
export class IncidentsService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string) {
    const incidents = await this.prisma.incident.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            comments: true,
            events: true,
          },
        },
      },
    });

    return {
      items: incidents.map((incident) => ({
        id: incident.id,
        status: incident.status,
        title: incident.title,
        createdAt: incident.createdAt.toISOString(),
        updatedAt: incident.updatedAt.toISOString(),
        commentCount: incident._count.comments,
        eventCount: incident._count.events,
      })),
    };
  }

  async get(id: string, tenantId: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, email: true },
            },
          },
        },
        events: {
          orderBy: { seq: 'desc' },
          take: 100,
        },
      },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    if (incident.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      incident: {
        id: incident.id,
        status: incident.status,
        title: incident.title,
        description: incident.description,
        createdAt: incident.createdAt.toISOString(),
        updatedAt: incident.updatedAt.toISOString(),
        comments: incident.comments.map((comment) => ({
          id: comment.id,
          body: comment.body,
          createdAt: comment.createdAt.toISOString(),
          author: {
            id: comment.author.id,
            email: comment.author.email,
          },
        })),
        events: incident.events.map((event) => ({
          id: event.id,
          ts: event.ts.toISOString(),
          type: event.type,
          severity: event.severity,
          fingerprint: event.fingerprint,
          payload: event.payload,
          cursor: event.seq.toString(),
        })),
      },
    };
  }

  async create(params: CreateIncidentParams) {
    const { tenantId, title, description, relatedEventIds } = params;

    // If relatedEventIds provided, verify they belong to this tenant
    if (relatedEventIds && relatedEventIds.length > 0) {
      const events = await this.prisma.event.findMany({
        where: {
          id: { in: relatedEventIds },
          tenantId,
        },
        select: { id: true },
      });

      if (events.length !== relatedEventIds.length) {
        throw new ForbiddenException('Some events not found or access denied');
      }
    }

    const incident = await this.prisma.incident.create({
      data: {
        tenantId,
        title,
        description,
        events: relatedEventIds?.length
          ? { connect: relatedEventIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        _count: {
          select: {
            comments: true,
            events: true,
          },
        },
      },
    });

    return {
      incident: {
        id: incident.id,
        status: incident.status,
        title: incident.title,
        createdAt: incident.createdAt.toISOString(),
      },
    };
  }

  async update(id: string, tenantId: string, params: UpdateIncidentParams) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      select: { tenantId: true },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    if (incident.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.prisma.incident.update({
      where: { id },
      data: {
        title: params.title,
        description: params.description,
        status: params.status,
      },
      include: {
        _count: {
          select: {
            comments: true,
            events: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      title: updated.title,
      description: updated.description,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      commentCount: updated._count.comments,
      eventCount: updated._count.events,
    };
  }

  async addComment(params: CreateCommentParams, tenantId: string) {
    const { incidentId, authorId, body } = params;

    // Verify incident belongs to tenant
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      select: { tenantId: true },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    if (incident.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    const comment = await this.prisma.comment.create({
      data: {
        incidentId,
        authorId,
        body,
      },
      include: {
        author: {
          select: { id: true, email: true },
        },
      },
    });

    return {
      comment: {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        author: {
          id: comment.author.id,
          email: comment.author.email,
        },
      },
    };
  }

  async linkEvents(incidentId: string, eventIds: string[], tenantId: string) {
    // Verify incident belongs to tenant
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      select: { tenantId: true },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    if (incident.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    // Verify events belong to tenant
    const events = await this.prisma.event.findMany({
      where: {
        id: { in: eventIds },
        tenantId,
      },
      select: { id: true },
    });

    if (events.length !== eventIds.length) {
      throw new ForbiddenException('Some events not found or access denied');
    }

    // Link events to incident
    await this.prisma.event.updateMany({
      where: { id: { in: eventIds } },
      data: { incidentId },
    });

    return { linked: eventIds.length };
  }
}
