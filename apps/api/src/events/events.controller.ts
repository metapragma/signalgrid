import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsQueryDto } from './dto/events-query.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Severity } from '@prisma/client';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  async list(@Query() query: EventsQueryDto, @CurrentUser() user: CurrentUserData) {
    return this.eventsService.list({
      tenantId: user.tenantId,
      cursor: query.cursor,
      limit: query.limit ?? 50,
      severity: query.severity as Severity | undefined,
      type: query.type,
    });
  }

  @Post()
  async create(@Body() dto: CreateEventDto, @CurrentUser() user: CurrentUserData) {
    return this.eventsService.create({
      tenantId: user.tenantId,
      type: dto.type,
      severity: dto.severity as Severity,
      fingerprint: dto.fingerprint,
      payload: dto.payload,
      ts: dto.ts ? new Date(dto.ts) : undefined,
    });
  }
}
