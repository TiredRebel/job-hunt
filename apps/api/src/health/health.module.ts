/**
 * @module health.module
 *
 * Liveness endpoint module. Extracted so the root app module imports a feature
 * module rather than a standalone controller.
 */
import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';

/**
 * Health check module.
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
