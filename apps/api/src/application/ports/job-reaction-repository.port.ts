/**
 * @module job-reaction-repository.port
 *
 * Port for reading reaction timelines and appending new reaction events.
 */
import type {
  CurrentReaction,
  JobReaction,
  JobReactionEvent,
} from '../../domain/job-reaction.model';

/**
 * Data required to append a reaction event.
 */
export interface AppendReactionInput {
  readonly jobId: bigint;
  readonly profileId: number;
  readonly reaction: JobReaction;
  readonly note?: string | null;
  readonly occurredAt?: Date;
}

/**
 * Repository contract for job reactions.
 */
export interface JobReactionRepository {
  /**
   * Append a reaction event. Also allowed for `note` entries.
   *
   * @param input - Reaction data.
   * @returns Created event.
   */
  append(input: AppendReactionInput): Promise<JobReactionEvent>;

  /**
   * Append the same reaction to many jobs (bulk action).
   *
   * @param jobIds - Target job ids.
   * @param profileId - Active profile id.
   * @param reaction - Stage to set.
   * @param note - Optional note.
   * @param occurredAt - Optional timestamp.
   * @returns Number of rows inserted.
   */
  appendBulk(
    jobIds: readonly bigint[],
    profileId: number,
    reaction: JobReaction,
    note?: string | null,
    occurredAt?: Date,
  ): Promise<number>;

  /**
   * Timeline for a single job/profile pair.
   *
   * @param jobId - Job id.
   * @param profileId - Profile id.
   * @returns Reaction events, newest first.
   */
  timeline(jobId: bigint, profileId: number): Promise<readonly JobReactionEvent[]>;

  /**
   * Latest non-note reaction for a job/profile pair.
   *
   * @param jobId - Job id.
   * @param profileId - Profile id.
   * @returns Current stage or `null`.
   */
  findCurrent(jobId: bigint, profileId: number): Promise<CurrentReaction | null>;

  /**
   * Current stages for a batch of jobs, keyed by job id.
   *
   * @param jobIds - Job ids.
   * @param profileId - Profile id.
   * @returns Map of job id to current reaction.
   */
  findCurrentMany(
    jobIds: readonly bigint[],
    profileId: number,
  ): Promise<ReadonlyMap<bigint, CurrentReaction>>;
}

/**
 * Injection token for the job reaction repository port.
 */
export const JOB_REACTION_REPOSITORY = Symbol('JOB_REACTION_REPOSITORY');
