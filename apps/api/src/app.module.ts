/**
 * @module app.module
 *
 * Root composition module. Every bounded-context module (jobs, reactions,
 * dictionaries, profiles, llm-admin, sources) is imported here — one module
 * per bounded context, providers depending on ports (abstract classes).
 */
import { Module } from '@nestjs/common';

import { HealthController } from './health/health.controller';

/**
 * Root application module wiring all feature modules and controllers.
 */
@Module({
  imports: [],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
