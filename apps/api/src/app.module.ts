/**
 * @module app.module
 *
 * Root composition module. Every bounded-context module (jobs, reactions,
 * dictionaries, profiles, llm-admin, sources) is imported here — one module
 * per bounded context, providers bound to ports (abstract classes/interfaces).
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { apiConfig } from './config/api-config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { ProfilesModule } from './profiles/profiles.module';
import { KeywordDictionariesModule } from './keyword-dictionaries/keyword-dictionaries.module';
import { ReactionsModule } from './reactions/reactions.module';
import { LlmAdminModule } from './llm-admin/llm-admin.module';
import { SourcesModule } from './sources/sources.module';

/**
 * Root application module wiring all feature modules and shared infrastructure.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [apiConfig] }),
    LoggerModule,
    DatabaseModule,
    HealthModule,
    JobsModule,
    ProfilesModule,
    KeywordDictionariesModule,
    ReactionsModule,
    LlmAdminModule,
    SourcesModule,
  ],
})
export class AppModule {}
