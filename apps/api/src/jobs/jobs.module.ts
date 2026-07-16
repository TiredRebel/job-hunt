/**
 * @module jobs.module
 *
 * Bounded context: normalized job postings. Provides list/filter/search/detail
 * endpoints. Reads from `core.jobs`; writes are performed by downstream
 * scraper/LLM services.
 */
import { Module } from '@nestjs/common';

import { JOB_REPOSITORY } from '../application/ports/job-repository.port';
import { PostgresJobRepository } from '../infrastructure/repositories/postgres-job.repository';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

/**
 * Jobs bounded-context module.
 */
@Module({
  controllers: [JobsController],
  providers: [
    JobsService,
    {
      provide: JOB_REPOSITORY,
      useClass: PostgresJobRepository,
    },
  ],
})
export class JobsModule {}
