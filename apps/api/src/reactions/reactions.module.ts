/**
 * @module reactions.module
 *
 * Bounded context: per-vacancy reaction tracking — single reactions, bulk
 * actions, and timeline reads.
 */
import { Module } from '@nestjs/common';

import { JOB_REACTION_REPOSITORY } from '../application/ports/job-reaction-repository.port';
import { PostgresJobReactionRepository } from '../infrastructure/repositories/postgres-job-reaction.repository';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';

/**
 * Reactions bounded-context module.
 */
@Module({
  controllers: [ReactionsController],
  providers: [
    ReactionsService,
    {
      provide: JOB_REACTION_REPOSITORY,
      useClass: PostgresJobReactionRepository,
    },
  ],
})
export class ReactionsModule {}
