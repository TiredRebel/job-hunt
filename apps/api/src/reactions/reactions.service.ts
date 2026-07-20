/**
 * @module reactions.service
 *
 * Application service for reaction tracking: single reactions, bulk actions,
 * and timelines.
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { JobReactionEvent } from '../domain/job-reaction.model';
import {
  JOB_REACTION_REPOSITORY,
  type AppendReactionInput,
  type JobReactionRepository,
} from '../application/ports/job-reaction-repository.port';
import {
  BOARD_ORDER_REPOSITORY,
  type BoardOrderRepository,
} from '../application/ports/board-order-repository.port';

/**
 * Application service for job reactions.
 */
@Injectable()
export class ReactionsService {
  /**
   * Application service for job reactions.
   *
   * @param repository - Job reaction repository port.
   * @param boardOrder - Board card order repository port.
   */
  public constructor(
    @Inject(JOB_REACTION_REPOSITORY)
    private readonly repository: JobReactionRepository,
    @Inject(BOARD_ORDER_REPOSITORY)
    private readonly boardOrder: BoardOrderRepository,
  ) {}

  /**
   * Append a reaction to a job.
   *
   * @param input - Reaction data.
   */
  public async add(input: AppendReactionInput): Promise<JobReactionEvent> {
    return this.repository.append(input);
  }

  /**
   * Append the same reaction to many jobs.
   *
   * @param jobIds - Target job ids.
   * @param profileId - Active profile id.
   * @param reaction - Reaction to set.
   * @param note - Optional note.
   * @param occurredAt - Optional timestamp.
   * @returns Number of rows inserted.
   */
  public async addBulk(
    jobIds: readonly bigint[],
    profileId: number,
    reaction: JobReactionEvent['reaction'],
    note?: string,
    occurredAt?: Date,
  ): Promise<number> {
    if (jobIds.length === 0) {
      return 0;
    }
    return this.repository.appendBulk(jobIds, profileId, reaction, note ?? null, occurredAt);
  }

  /**
   * Get the reaction timeline for a job/profile pair.
   *
   * @param jobId - Job id.
   * @param profileId - Profile id.
   */
  public async timeline(jobId: bigint, profileId: number): Promise<readonly JobReactionEvent[]> {
    const events = await this.repository.timeline(jobId, profileId);
    if (events.length === 0) {
      throw new NotFoundException('No reactions found for this job/profile pair');
    }
    return events;
  }

  /**
   * Rewrite a board column's manual card order. Ordering is cosmetic and
   * self-heals on the next reorder — no reaction event is created (see the
   * stage-board spec's "Reordering does not change stage" scenario).
   *
   * @param profileId - Active profile id.
   * @param stage - The board column being reordered.
   * @param jobIds - Job ids in their new order.
   */
  public async setBoardOrder(
    profileId: number,
    stage: string,
    jobIds: readonly bigint[],
  ): Promise<void> {
    await this.boardOrder.setStageOrder(profileId, stage, jobIds);
  }
}
