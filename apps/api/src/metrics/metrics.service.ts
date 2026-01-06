import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  TimeSeriesInterval,
  TimeSeriesDuration,
} from './dto/timeseries-query.dto';

export interface LatencyPercentiles {
  p50: number;
  p95: number;
  p99: number;
}

export interface FingerprintCount {
  fingerprint: string;
  count: number;
}

export interface OpsMetricsResponse {
  latencyMs: LatencyPercentiles;
  errorRate: number;
  topFingerprints: FingerprintCount[];
  openIncidentCount: number;
}

export interface TimeSeriesBucket {
  ts: string;
  total: number;
  error: number;
  warn: number;
  info: number;
  debug: number;
}

export interface TimeSeriesResponse {
  buckets: TimeSeriesBucket[];
  interval: string;
  duration: string;
}

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async getOpsMetrics(tenantId: string): Promise<OpsMetricsResponse> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get event counts for error rate calculation + open incident count
    const [totalCount, errorCount, openIncidentCount] = await Promise.all([
      this.prisma.event.count({
        where: {
          tenantId,
          ts: { gte: oneHourAgo },
        },
      }),
      this.prisma.event.count({
        where: {
          tenantId,
          ts: { gte: oneHourAgo },
          severity: 'error',
        },
      }),
      this.prisma.incident.count({
        where: {
          tenantId,
          status: 'OPEN',
        },
      }),
    ]);

    // Calculate error rate (0-1)
    const errorRate = totalCount > 0 ? errorCount / totalCount : 0;

    // Get top fingerprints
    const fingerprintCounts = await this.prisma.event.groupBy({
      by: ['fingerprint'],
      where: {
        tenantId,
        ts: { gte: oneHourAgo },
      },
      _count: {
        fingerprint: true,
      },
      orderBy: {
        _count: {
          fingerprint: 'desc',
        },
      },
      take: 10,
    });

    const topFingerprints = fingerprintCounts.map((item) => ({
      fingerprint: item.fingerprint,
      count: item._count.fingerprint,
    }));

    // Compute latency percentiles from event inter-arrival times
    // This is a proxy for system activity/responsiveness
    const latencyMs = await this.computeLatencyPercentiles(tenantId, oneHourAgo);

    return {
      latencyMs,
      errorRate: Math.round(errorRate * 10000) / 10000, // Round to 4 decimal places
      topFingerprints,
      openIncidentCount,
    };
  }

  async getTimeSeries(
    tenantId: string,
    interval: TimeSeriesInterval,
    duration: TimeSeriesDuration,
  ): Promise<TimeSeriesResponse> {
    // Convert interval to PostgreSQL interval format
    const intervalMap: Record<TimeSeriesInterval, string> = {
      [TimeSeriesInterval.ONE_MINUTE]: 'minute',
      [TimeSeriesInterval.FIVE_MINUTES]: '5 minutes',
      [TimeSeriesInterval.FIFTEEN_MINUTES]: '15 minutes',
    };

    // Convert duration to milliseconds
    const durationMsMap: Record<TimeSeriesDuration, number> = {
      [TimeSeriesDuration.FIFTEEN_MINUTES]: 15 * 60 * 1000,
      [TimeSeriesDuration.ONE_HOUR]: 60 * 60 * 1000,
      [TimeSeriesDuration.SIX_HOURS]: 6 * 60 * 60 * 1000,
      [TimeSeriesDuration.TWENTY_FOUR_HOURS]: 24 * 60 * 60 * 1000,
    };

    const pgInterval = intervalMap[interval];
    const durationMs = durationMsMap[duration];
    const since = new Date(Date.now() - durationMs);

    // Use raw SQL with date_trunc for efficient bucketing
    const buckets = await this.prisma.$queryRaw<
      Array<{
        bucket: Date;
        total: bigint;
        error: bigint;
        warn: bigint;
        info: bigint;
        debug: bigint;
      }>
    >`
      SELECT
        date_trunc(${pgInterval}, ts) as bucket,
        COUNT(*)::bigint as total,
        COUNT(*) FILTER (WHERE severity = 'error')::bigint as error,
        COUNT(*) FILTER (WHERE severity = 'warn')::bigint as warn,
        COUNT(*) FILTER (WHERE severity = 'info')::bigint as info,
        COUNT(*) FILTER (WHERE severity = 'debug')::bigint as debug
      FROM "Event"
      WHERE "tenantId" = ${tenantId} AND ts >= ${since}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    return {
      buckets: buckets.map((b) => ({
        ts: b.bucket.toISOString(),
        total: Number(b.total),
        error: Number(b.error),
        warn: Number(b.warn),
        info: Number(b.info),
        debug: Number(b.debug),
      })),
      interval,
      duration,
    };
  }

  private async computeLatencyPercentiles(
    tenantId: string,
    since: Date,
  ): Promise<{ p50: number; p95: number; p99: number }> {
    // Get recent events ordered by timestamp to compute inter-arrival times
    const events = await this.prisma.event.findMany({
      where: {
        tenantId,
        ts: { gte: since },
      },
      select: { ts: true },
      orderBy: { ts: 'asc' },
      take: 1000, // Limit for performance
    });

    if (events.length < 2) {
      return { p50: 0, p95: 0, p99: 0 };
    }

    // Compute inter-arrival times in milliseconds
    const intervals: number[] = [];
    for (let i = 1; i < events.length; i++) {
      const diff = events[i].ts.getTime() - events[i - 1].ts.getTime();
      intervals.push(diff);
    }

    // Sort for percentile calculation
    intervals.sort((a, b) => a - b);

    const percentile = (arr: number[], p: number): number => {
      const index = Math.ceil((p / 100) * arr.length) - 1;
      return arr[Math.max(0, index)] || 0;
    };

    return {
      p50: Math.round(percentile(intervals, 50)),
      p95: Math.round(percentile(intervals, 95)),
      p99: Math.round(percentile(intervals, 99)),
    };
  }
}
