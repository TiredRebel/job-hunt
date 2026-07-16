/**
 * @module job-reaction.model
 *
 * Append-only reaction event from `core.job_reactions` and the current-stage
 * view `core.job_reaction_current`.
 */

/** Allowed reaction values. */
export type JobReaction =
  | 'saved'
  | 'applied'
  | 'viewed_by_employer'
  | 'replied'
  | 'interview'
  | 'test_task'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'note';

/**
 * Single reaction event.
 */
export interface JobReactionEvent {
  readonly id: bigint;
  readonly jobId: bigint;
  readonly profileId: number;
  readonly reaction: JobReaction;
  readonly note: string | null;
  readonly occurredAt: Date;
  readonly createdAt: Date;
}

/**
 * Current non-note stage for a job/profile pair.
 */
export interface CurrentReaction {
  readonly jobId: bigint;
  readonly profileId: number;
  readonly reaction: JobReaction;
  readonly occurredAt: Date;
}
