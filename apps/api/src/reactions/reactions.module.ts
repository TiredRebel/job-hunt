/**
 * @module reactions.module
 *
 * Bounded context: per-vacancy reaction tracking — single reactions, bulk
 * actions, and timeline reads.
 */
import { Module } from '@nestjs/common';

import { JOB_REACTION_REPOSITORY } from '../application/ports/job-reaction-repository.port';
import { BOARD_ORDER_REPOSITORY } from '../application/ports/board-order-repository.port';
import { PostgresJobReactionRepository } from '../infrastructure/repositories/postgres-job-reaction.repository';
import { PostgresBoardOrderRepository } from '../infrastructure/repositories/postgres-board-order.repository';
import { BoardController } from './board.controller';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';

/**
 * Reactions bounded-context module. Also owns board card ordering
 * (`BoardController`, `BOARD_ORDER_REPOSITORY`) — a related but distinct
 * concern served from the same context (design.md D3/D5 in
 * openspec/changes/notification-settings-and-board-reorder).
 */
@Module({
  controllers: [ReactionsController, BoardController],
  providers: [
    ReactionsService,
    {
      provide: JOB_REACTION_REPOSITORY,
      useClass: PostgresJobReactionRepository,
    },
    {
      provide: BOARD_ORDER_REPOSITORY,
      useClass: PostgresBoardOrderRepository,
    },
  ],
})
export class ReactionsModule {}
