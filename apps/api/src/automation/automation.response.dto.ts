/**
 * @module automation.response.dto
 *
 * Response DTOs for the automation endpoints. Mirror the service/repository
 * output shapes for OpenAPI documentation only; controllers keep returning
 * plain objects unchanged. `bigint` fields are serialized as strings in JSON
 * (global {@link BigIntSerializerInterceptor}) and are therefore typed as
 * `string` here.
 */
import { ApiProperty } from '@nestjs/swagger';

/**
 * The active profile, shaped exactly as the LLM service's `ProfileInput`
 * expects — n8n forwards this verbatim to `POST /process/job`.
 */
export class LlmProfileInputResponse {
  /** Profile summary (the active profile's CV markdown). */
  @ApiProperty({ type: String })
  public summary!: string;

  /** Skills list. */
  @ApiProperty({ type: String, isArray: true })
  public skills!: string[];

  /** Free-text preferences, when the profile has any. */
  @ApiProperty({ type: String, nullable: true })
  public preferences!: string | null;
}

/**
 * One raw job awaiting LLM processing.
 */
export class UnprocessedJobResponse {
  /** `scraper.jobs_raw.id`. */
  @ApiProperty({ type: Number, example: 42 })
  public rawJobId!: number;

  /** Source id (`core.sources.id`). */
  @ApiProperty({ type: Number, example: 1 })
  public sourceId!: number;

  /** External posting id on the source site. */
  @ApiProperty({ type: String })
  public externalId!: string;

  /** Canonical posting URL. */
  @ApiProperty({ type: String })
  public url!: string;

  /** Listing title. */
  @ApiProperty({ type: String })
  public title!: string;

  /** Raw fetched detail payload (HTML/JSON/RSS text). */
  @ApiProperty({ type: String })
  public body!: string;
}

/**
 * Response for `GET /v1/automation/jobs/unprocessed`.
 */
export class UnprocessedJobsResponse {
  /** The active profile, LLM-ready. */
  @ApiProperty({ type: LlmProfileInputResponse })
  public profile!: LlmProfileInputResponse;

  /** Raw jobs awaiting processing. */
  @ApiProperty({ type: UnprocessedJobResponse, isArray: true })
  public jobs!: UnprocessedJobResponse[];
}

/**
 * Response for `POST /v1/automation/jobs/{rawJobId}/results`.
 */
export class JobResultAckResponse {
  /** Outcome recorded. */
  @ApiProperty({ enum: ['processed', 'failed'], enumName: 'JobResultStatus' })
  public status!: 'processed' | 'failed';

  /** Persisted job id (bigint as string), when `status` is `processed`. */
  @ApiProperty({ type: String, nullable: true, example: '123' })
  public jobId!: string | null;
}

/**
 * One match awaiting notification.
 */
export class UnnotifiedMatchResponse {
  /** `core.job_matches.id` (bigint as string). */
  @ApiProperty({ type: String, example: '17' })
  public jobMatchId!: string;

  /** `core.jobs.id` (bigint as string). */
  @ApiProperty({ type: String, example: '42' })
  public jobId!: string;

  /** Job title. */
  @ApiProperty({ type: String })
  public jobTitle!: string;

  /** Employer name. */
  @ApiProperty({ type: String, nullable: true })
  public company!: string | null;

  /** Canonical posting URL. */
  @ApiProperty({ type: String })
  public url!: string;

  /** Match score (0–100). */
  @ApiProperty({ type: Number })
  public score!: number;

  /** Match explanation. */
  @ApiProperty({ type: String, nullable: true })
  public explanation!: string | null;
}

/**
 * Response for `POST /v1/automation/notifications`.
 */
export class NotificationRecordedResponse {
  /** `core.job_matches.id` (bigint as string). */
  @ApiProperty({ type: String, example: '17' })
  public jobMatchId!: string;

  /** Notification channel. */
  @ApiProperty({ enum: ['telegram', 'email'], enumName: 'NotificationChannel' })
  public channel!: 'telegram' | 'email';
}

/**
 * One new job in the digest window.
 */
export class DigestJobSummaryResponse {
  /** `core.jobs.id` (bigint as string). */
  @ApiProperty({ type: String, example: '42' })
  public jobId!: string;

  /** Job title. */
  @ApiProperty({ type: String })
  public title!: string;

  /** Source slug. */
  @ApiProperty({ type: String })
  public sourceSlug!: string;

  /** When the job was first seen (ISO 8601). */
  @ApiProperty({ type: String, format: 'date-time' })
  public firstSeenAt!: string;
}

/**
 * One new match in the digest window.
 */
export class DigestMatchSummaryResponse {
  /** `core.jobs.id` (bigint as string). */
  @ApiProperty({ type: String, example: '42' })
  public jobId!: string;

  /** Job title. */
  @ApiProperty({ type: String })
  public title!: string;

  /** Match score (0–100). */
  @ApiProperty({ type: Number })
  public score!: number;

  /** Canonical posting URL. */
  @ApiProperty({ type: String })
  public url!: string;
}

/**
 * Response for `GET /v1/automation/digest`.
 */
export class DigestResponse {
  /** Watermark the digest window started from, `null` before the first send. */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  public since!: string | null;

  /** New jobs in the window. */
  @ApiProperty({ type: DigestJobSummaryResponse, isArray: true })
  public newJobs!: DigestJobSummaryResponse[];

  /** New matches in the window. */
  @ApiProperty({ type: DigestMatchSummaryResponse, isArray: true })
  public newMatches!: DigestMatchSummaryResponse[];
}

/**
 * Response for `POST /v1/automation/digest/sent`.
 */
export class DigestSentResponse {
  /** New watermark value (ISO 8601). */
  @ApiProperty({ type: String, format: 'date-time' })
  public lastDigestAt!: string;
}

/**
 * One raw job that gave up after repeated processing failures.
 */
export class DeadLetterJobResponse {
  /** `scraper.jobs_raw.id`. */
  @ApiProperty({ type: Number, example: 42 })
  public id!: number;

  /** Source id (`core.sources.id`). */
  @ApiProperty({ type: Number, example: 1 })
  public sourceId!: number;

  /** Source slug. */
  @ApiProperty({ type: String })
  public sourceSlug!: string;

  /** External posting id on the source site. */
  @ApiProperty({ type: String })
  public externalId!: string;

  /** Canonical posting URL. */
  @ApiProperty({ type: String })
  public url!: string;

  /** Listing title. */
  @ApiProperty({ type: String })
  public title!: string;

  /** Failed processing attempts recorded before giving up. */
  @ApiProperty({ type: Number, example: 3 })
  public processAttempts!: number;

  /** When the row was last processed (ISO 8601), `null` if never recorded. */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  public processedAt!: string | null;
}
