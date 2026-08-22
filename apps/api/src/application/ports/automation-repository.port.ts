/**
 * @module automation-repository.port
 *
 * Port for the Phase 6 automation surface: persisting LLM-processed job
 * results into `core.*`, the notification dedup ledger, and the digest
 * watermark. Unlike {@link JobRepository}, this port intentionally writes —
 * it backs the n8n processing chain, which is the one caller allowed to
 * create/update `core.jobs`, `core.job_matches` and `core.cover_letters`
 * outside manual dashboard edits (see design.md D1 in
 * openspec/changes/phase-6-n8n-workflows).
 */

/** Notification delivery channel. */
export type NotificationChannel = 'telegram' | 'email';

/** Normalized job fields as produced by the LLM `normalize` pipeline. */
export interface NormalizedJobInput {
  readonly title: string;
  readonly company: string | null;
  readonly location: string | null;
  readonly remote: boolean | null;
  readonly employmentType: string | null;
  readonly seniority: string | null;
  readonly salaryMin: number | null;
  readonly salaryMax: number | null;
  readonly salaryCurrency: string | null;
  readonly descriptionMd: string;
}

/** Match score fields as produced by the LLM `match` pipeline. */
export interface MatchInput {
  readonly score: number;
  readonly explanation: string;
  readonly modelUsed: string | null;
  readonly matchedSkills: readonly string[];
  readonly missingSkills: readonly string[];
}

/** Cover-letter fields as produced by the LLM `cover_letter` pipeline. */
export interface CoverLetterInput {
  readonly bodyMd: string;
  readonly modelUsed: string | null;
}

/** Input to {@link AutomationRepository.persistJobResult}. */
export interface PersistJobResultInput {
  readonly sourceId: number;
  readonly externalId: string;
  readonly url: string;
  readonly rawJobId: number;
  readonly profileId: number;
  readonly postedAt: Date | null;
  readonly normalized: NormalizedJobInput;
  readonly match: MatchInput | null;
  readonly coverLetter: CoverLetterInput | null;
  readonly status?: 'processed' | 'hidden';
}

/** Result of a successful {@link AutomationRepository.persistJobResult} call. */
export interface PersistJobResultOutput {
  readonly jobId: bigint;
}

/** A match awaiting notification on one channel. */
export interface UnnotifiedMatch {
  readonly jobMatchId: bigint;
  readonly jobId: bigint;
  readonly jobTitle: string;
  readonly company: string | null;
  readonly url: string;
  readonly score: number;
  readonly explanation: string | null;
}

/** One new job in the digest window. */
export interface DigestJobSummary {
  readonly jobId: bigint;
  readonly title: string;
  readonly sourceSlug: string;
  readonly firstSeenAt: Date;
}

/** One new match in the digest window. */
export interface DigestMatchSummary {
  readonly jobId: bigint;
  readonly title: string;
  readonly score: number;
  readonly url: string;
}

/** Digest window content, read against the `last_digest_at` watermark. */
export interface DigestPayload {
  readonly since: Date | null;
  readonly newJobs: readonly DigestJobSummary[];
  readonly newMatches: readonly DigestMatchSummary[];
}

/**
 * Repository contract for the automation surface.
 */
export interface AutomationRepository {
  /**
   * Upsert a job/match/cover-letter triple from one processing-chain result.
   * Never overwrites a cover letter the user has already edited.
   *
   * @param input - Normalized job plus optional match/cover-letter.
   * @returns The persisted job's id.
   */
  persistJobResult(input: PersistJobResultInput): Promise<PersistJobResultOutput>;

  /**
   * Matches at or above `app_settings.match_threshold` with no notification
   * recorded yet for `channel`.
   *
   * @param channel - Notification channel.
   */
  findUnnotifiedMatches(channel: NotificationChannel): Promise<readonly UnnotifiedMatch[]>;

  /**
   * Record a sent notification.
   *
   * @param jobMatchId - `core.job_matches.id`.
   * @param channel - Notification channel.
   * @returns `false` when `(jobMatchId, channel)` was already recorded.
   */
  recordNotification(jobMatchId: bigint, channel: NotificationChannel): Promise<boolean>;

  /**
   * Jobs and matches first seen since `app_settings.last_digest_at`
   * (24h fallback when the watermark has never been set).
   */
  digest(): Promise<DigestPayload>;

  /**
   * Advance `app_settings.last_digest_at` to now.
   *
   * @returns The new watermark value.
   */
  markDigestSent(): Promise<Date>;
}

/**
 * Injection token for the automation repository port.
 */
export const AUTOMATION_REPOSITORY = Symbol('AUTOMATION_REPOSITORY');
