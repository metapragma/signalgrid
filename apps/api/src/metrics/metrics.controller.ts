import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { MetricsService, OpsMetricsResponse } from './metrics.service';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get('ops')
  async getOpsMetrics(@CurrentUser() user: CurrentUserData): Promise<OpsMetricsResponse> {
    return this.metricsService.getOpsMetrics(user.tenantId);
  }
}
