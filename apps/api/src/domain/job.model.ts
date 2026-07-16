/**
 * @module job.model
 *
 * Normalized job entity as stored in `core.jobs`. Read-only in the gateway;
 * writes are performed by downstream scraper/LLM services.
 */

/** Allowed job status values. */
export type JobStatus = 'new' | 'processed' | 'archived' | 'hidden';

/** Allowed remote arrangement values. */
export type RemoteType = 'remote' | 'hybrid' | 'office' | 'unknown';

/** Allowed seniority values. */
export type Seniority = 'junior' | 'middle' | 'senior' | 'lead' | 'unknown';

/**
 * Normalized job posting read model.
 */
export interface Job {
  /** Primary key. */
  readonly id: bigint;
  /** Source identifier. */
  readonly sourceId: number;
  /** Source slug (denormalized for display). */
  readonly sourceSlug: string;
  /** External posting id on the source site. */
  readonly externalId: string;
  /** Canonical URL. */
  readonly url: string;
  readonly title: string;
  readonly company: string | null;
  readonly descriptionMd: string | null;
  readonly summary: string | null;
  readonly tags: readonly string[];
  readonly redFlags: readonly string[];
  readonly salaryMin: number | null;
  readonly salaryMax: number | null;
  readonly salaryCurrency: string | null;
  readonly seniority: Seniority;
  readonly remote: RemoteType;
  readonly location: string | null;
  readonly postedAt: Date | null;
  readonly firstSeenAt: Date;
  readonly lastSeenAt: Date;
  readonly status: JobStatus;
  /** Latest match score for the active profile, if any. */
  readonly matchScore: number | null;
  /** Current reaction stage for the active profile, if any. */
  readonly currentReaction: string | null;
}
