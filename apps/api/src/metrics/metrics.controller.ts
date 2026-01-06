import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { MetricsService, OpsMetricsResponse, TimeSeriesResponse } from './metrics.service';
import { TimeSeriesQueryDto } from './dto/timeseries-query.dto';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get('ops')
  async getOpsMetrics(@CurrentUser() user: CurrentUserData): Promise<OpsMetricsResponse> {
    return this.metricsService.getOpsMetrics(user.tenantId);
  }

  @Get('timeseries')
  async getTimeSeries(
    @CurrentUser() user: CurrentUserData,
    @Query() query: TimeSeriesQueryDto,
  ): Promise<TimeSeriesResponse> {
    return this.metricsService.getTimeSeries(user.tenantId, query.interval, query.duration);
  }
}
