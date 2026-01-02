import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { EventsModule } from './events/events.module';
import { IncidentsModule } from './incidents/incidents.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isTest = config.get('NODE_ENV') === 'test';
        // Higher limits for testing, stricter for production
        return [
          {
            name: 'short',
            ttl: 1000, // 1 second
            limit: isTest ? 1000 : 20, // 20 requests per second
          },
          {
            name: 'medium',
            ttl: 60000, // 1 minute
            limit: isTest ? 10000 : 200, // 200 requests per minute
          },
          {
            name: 'long',
            ttl: 3600000, // 1 hour
            limit: isTest ? 100000 : 2000, // 2000 requests per hour
          },
        ];
      },
    }),
    PrismaModule,
    AuthModule,
    MeModule,
    EventsModule,
    IncidentsModule,
    MetricsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
