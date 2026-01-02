import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

interface HealthResponse {
  status: 'ok';
}

interface ReadyResponse {
  status: 'ok';
  db: 'connected';
}

interface NotReadyResponse {
  status: 'error';
  db: 'disconnected';
}

@Controller()
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('healthz')
  health(): HealthResponse {
    return { status: 'ok' };
  }

  @Get('readyz')
  async ready(): Promise<ReadyResponse | NotReadyResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'connected' };
    } catch {
      return { status: 'error', db: 'disconnected' };
    }
  }
}
