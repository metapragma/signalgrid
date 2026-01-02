import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @Get()
  async list(@CurrentUser() user: CurrentUserData) {
    return this.incidentsService.list(user.tenantId);
  }

  @Get(':id')
  async get(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.incidentsService.get(id, user.tenantId);
  }

  @Post()
  async create(@Body() dto: CreateIncidentDto, @CurrentUser() user: CurrentUserData) {
    return this.incidentsService.create({
      tenantId: user.tenantId,
      title: dto.title,
      description: dto.description,
      relatedEventIds: dto.relatedEventIds,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.incidentsService.update(id, user.tenantId, {
      title: dto.title,
      description: dto.description,
      status: dto.status,
    });
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.incidentsService.addComment(
      {
        incidentId: id,
        authorId: user.userId,
        body: dto.body,
      },
      user.tenantId,
    );
  }
}
