/**
 * @module app.module
 *
 * Root composition module. Every bounded-context module (jobs, reactions,
 * dictionaries, profiles, llm-admin, sources) is imported here — one module
 * per bounded context, providers bound to ports (abstract classes/interfaces).
 */
import type { IncomingMessage } from 'node:http';

import { Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ClsModule } from 'nestjs-cls';

import { BigIntSerializerInterceptor } from './common/bigint-serializer.interceptor';
import type { ApiConfig } from './config/api-config';
import { apiConfig } from './config/api-config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { resolveCorrelationId } from './infrastructure/logger/correlation-id';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { resolveClientTracker } from './infrastructure/rate-limit/tracker';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { ProfilesModule } from './profiles/profiles.module';
import { KeywordDictionariesModule } from './keyword-dictionaries/keyword-dictionaries.module';
import { ReactionsModule } from './reactions/reactions.module';
import { LlmAdminModule } from './llm-admin/llm-admin.module';
import { SourcesModule } from './sources/sources.module';
import { CoverLettersModule } from './cover-letters/cover-letters.module';
import { AutomationModule } from './automation/automation.module';
import { SettingsModule } from './settings/settings.module';

/**
 * Root application module wiring all feature modules and shared infrastructure.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [apiConfig] }),
    LoggerModule,
    // Interceptor mode (not middleware) so this always runs after pino-http's
    // Express-level middleware has already resolved/minted `req.id` —
    // ordering-independent, unlike middleware-vs-middleware mount order.
    ClsModule.forRoot({
      global: true,
      interceptor: {
        mount: true,
        setup: (cls, context) => {
          const req = context.switchToHttp().getRequest<IncomingMessage & { id?: string }>();
          cls.set('correlationId', req.id ?? resolveCorrelationId(req));
        },
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<ApiConfig['RATE_LIMIT_TTL']>('api.RATE_LIMIT_TTL') ?? 60000,
            limit: config.get<ApiConfig['RATE_LIMIT_LIMIT']>('api.RATE_LIMIT_LIMIT') ?? 120,
          },
        ],
        // The throttler's tracker type is a loose `Record<string, any>` to
        // stay Express/Fastify-agnostic; this app is Express-only, so the
        // request genuinely is an `IncomingMessage` at runtime.
        getTracker: (req: Record<string, unknown>) =>
          resolveClientTracker(
            req as unknown as IncomingMessage,
            config.get<ApiConfig['TRUST_PROXY_HEADERS']>('api.TRUST_PROXY_HEADERS') ?? false,
          ),
      }),
    }),
    DatabaseModule,
    HealthModule,
    JobsModule,
    ProfilesModule,
    KeywordDictionariesModule,
    ReactionsModule,
    LlmAdminModule,
    SourcesModule,
    CoverLettersModule,
    SettingsModule,
    AutomationModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: BigIntSerializerInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
