/**
 * @module reconciliation.module
 *
 * Bounded context: jobs reconciliation. Read-only endpoints explaining the
 * numerical gap between `scraper.jobs_raw` and `core.jobs`. Also exposes a
 * public, dashboard-facing dead-letter listing (the automation module's
 * equivalent is internal-token-guarded). No writes.
 */
import { Module } from '@nestjs/common';

import { JOBS_RECONCILIATION_REPOSITORY } from '../application/ports/jobs-reconciliation.port';
import { SCRAPER_CLIENT } from '../application/ports/scraper-client.port';
import { HttpScraperClient } from '../infrastructure/clients/http-scraper.client';
import { PostgresJobsReconciliationRepository } from '../infrastructure/repositories/postgres-jobs-reconciliation.repository';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';

/**
 * Reconciliation bounded-context module.
 */
@Module({
  controllers: [ReconciliationController],
  providers: [
    ReconciliationService,
    {
      provide: JOBS_RECONCILIATION_REPOSITORY,
      useClass: PostgresJobsReconciliationRepository,
    },
    {
      provide: SCRAPER_CLIENT,
      useClass: HttpScraperClient,
    },
  ],
})
export class ReconciliationModule {}
