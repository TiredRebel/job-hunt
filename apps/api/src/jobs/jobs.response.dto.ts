/**
 * @module jobs.response.dto
 *
 * Response DTOs for the jobs endpoints. These classes mirror the runtime
 * shapes returned by the jobs service (the `Job` domain model and the
 * `PaginatedJobs` wrapper) for OpenAPI documentation only; controllers keep
 * returning domain objects unchanged. `bigint` domain ids are serialized as
 * strings in JSON and are therefore typed as `string` here.
 */
import { ApiProperty } from '@nestjs/swagger';

import type { JobStatus, RemoteType, Seniority } from '../domain/job.model';

/**
 * Normalized job posting as returned by the API.
 */
export class JobResponse {
  /** Primary key (bigint serialized as a string in JSON). */
  @ApiProperty({
    description: 'Primary key (bigint serialized as a string).',
    type: String,
    example: '42',
  })
  public id!: string;

  /** Source identifier. */
  @ApiProperty({ description: 'Source identifier.', type: Number })
  public sourceId!: number;

  /** Source slug (denormalized for display). */
  @ApiProperty({
    type: String,
    description: 'Source slug (denormalized for display).',
    example: 'hh',
  })
  public sourceSlug!: string;

  /** External posting id on the source site. */
  @ApiProperty({ type: String, description: 'External posting id on the source site.' })
  public externalId!: string;

  /** Canonical URL. */
  @ApiProperty({ type: String, description: 'Canonical URL.' })
  public url!: string;

  /** Job title. */
  @ApiProperty({ type: String, description: 'Job title.' })
  public title!: string;

  /** Company name, when known. */
  @ApiProperty({ description: 'Company name, when known.', type: String, nullable: true })
  public company!: string | null;

  /** Job description in markdown. */
  @ApiProperty({ description: 'Job description in markdown.', type: String, nullable: true })
  public descriptionMd!: string | null;

  /** LLM-generated summary. */
  @ApiProperty({ description: 'LLM-generated summary.', type: String, nullable: true })
  public summary!: string | null;

  /** Extracted tags. */
  @ApiProperty({ description: 'Extracted tags.', type: String, isArray: true })
  public tags!: string[];

  /** Detected red flags. */
  @ApiProperty({ description: 'Detected red flags.', type: String, isArray: true })
  public redFlags!: string[];

  /** Minimum salary, when posted. */
  @ApiProperty({ description: 'Minimum salary, when posted.', type: Number, nullable: true })
  public salaryMin!: number | null;

  /** Maximum salary, when posted. */
  @ApiProperty({ description: 'Maximum salary, when posted.', type: Number, nullable: true })
  public salaryMax!: number | null;

  /** Salary currency code. */
  @ApiProperty({ description: 'Salary currency code.', type: String, nullable: true })
  public salaryCurrency!: string | null;

  /** Seniority level. */
  @ApiProperty({
    description: 'Seniority level.',
    enum: ['junior', 'middle', 'senior', 'lead', 'unknown'],
    enumName: 'Seniority',
  })
  public seniority!: Seniority;

  /** Remote arrangement. */
  @ApiProperty({
    description: 'Remote arrangement.',
    enum: ['remote', 'hybrid', 'office', 'unknown'],
    enumName: 'RemoteType',
  })
  public remote!: RemoteType;

  /** Location, when known. */
  @ApiProperty({ description: 'Location, when known.', type: String, nullable: true })
  public location!: string | null;

  /** Posting date on the source site (ISO 8601). */
  @ApiProperty({
    description: 'Posting date on the source site (ISO 8601).',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  public postedAt!: string | null;

  /** When the job was first seen by a scraper (ISO 8601). */
  @ApiProperty({
    description: 'When the job was first seen by a scraper (ISO 8601).',
    type: String,
    format: 'date-time',
  })
  public firstSeenAt!: string;

  /** When the job was last seen by a scraper (ISO 8601). */
  @ApiProperty({
    description: 'When the job was last seen by a scraper (ISO 8601).',
    type: String,
    format: 'date-time',
  })
  public lastSeenAt!: string;

  /** Job status. */
  @ApiProperty({
    description: 'Job status.',
    enum: ['new', 'processed', 'archived', 'hidden'],
    enumName: 'JobStatus',
  })
  public status!: JobStatus;

  /** Latest match score for the active profile, if any. */
  @ApiProperty({
    description: 'Latest match score for the active profile, if any.',
    type: Number,
    nullable: true,
  })
  public matchScore!: number | null;

  /** Current reaction stage for the active profile, if any. */
  @ApiProperty({
    description: 'Current reaction stage for the active profile, if any.',
    type: String,
    nullable: true,
  })
  public currentReaction!: string | null;
}

/**
 * Paginated job list as returned by `GET /v1/jobs`.
 */
export class PaginatedJobsResponse {
  /** Jobs on the current page. */
  @ApiProperty({ description: 'Jobs on the current page.', type: JobResponse, isArray: true })
  public items!: JobResponse[];

  /** Total number of jobs matching the filter. */
  @ApiProperty({ description: 'Total number of jobs matching the filter.', type: Number })
  public total!: number;
}
