/**
 * @module sources.response.dto
 *
 * Response DTOs for the source endpoints. Mirror the `Source` and `ScrapeRun`
 * domain models for OpenAPI documentation only; controllers keep returning
 * domain objects unchanged. `bigint` domain ids are serialized as strings in
 * JSON and are therefore typed as `string` here.
 */
import { ApiProperty } from '@nestjs/swagger';

import type { FetchStrategy } from '../domain/source.model';
import type { ScrapeRunStatus } from '../domain/scrape-run.model';
import type { SourceTestStatus } from '../application/ports/scraper-client.port';

const SOURCE_TEST_STATUSES: readonly SourceTestStatus[] = [
  'ok',
  'no_adapter',
  'unsupported_strategy',
  'blocked',
  'failed',
];

/**
 * Job source as returned by the API.
 */
export class SourceResponse {
  /** Primary key. */
  @ApiProperty({ description: 'Primary key.', type: Number, example: 1 })
  public id!: number;

  /** Source slug. */
  @ApiProperty({ type: String, description: 'Source slug.', example: 'hh' })
  public slug!: string;

  /** Display name. */
  @ApiProperty({ type: String, description: 'Display name.', example: 'HeadHunter' })
  public name!: string;

  /** Base URL of the source site. */
  @ApiProperty({ type: String, description: 'Base URL of the source site.' })
  public baseUrl!: string;

  /** Whether the source is enabled for scraping. */
  @ApiProperty({ description: 'Whether the source is enabled for scraping.', type: Boolean })
  public enabled!: boolean;

  /** Fetch strategy. */
  @ApiProperty({
    description: 'Fetch strategy.',
    enum: ['api', 'crawl4ai', 'agent-browser'],
    enumName: 'FetchStrategy',
  })
  public fetchStrategy!: FetchStrategy;

  /** Source-specific configuration (search queries, subreddits, rate limits). */
  @ApiProperty({
    description: 'Source-specific configuration (search queries, subreddits, rate limits).',
    type: 'object',
    additionalProperties: true,
  })
  public config!: Record<string, unknown>;

  /** Creation timestamp (ISO 8601). */
  @ApiProperty({
    description: 'Creation timestamp (ISO 8601).',
    type: String,
    format: 'date-time',
  })
  public createdAt!: string;

  /** Last update timestamp (ISO 8601). */
  @ApiProperty({
    description: 'Last update timestamp (ISO 8601).',
    type: String,
    format: 'date-time',
  })
  public updatedAt!: string;
}

/**
 * Scrape run summary as returned by the API.
 */
export class ScrapeRunResponse {
  /** Run id (bigint serialized as a string in JSON). */
  @ApiProperty({
    description: 'Run id (bigint serialized as a string).',
    type: String,
    example: '17',
  })
  public id!: string;

  /** Source identifier. */
  @ApiProperty({ description: 'Source identifier.', type: Number, example: 1 })
  public sourceId!: number;

  /** Source slug. */
  @ApiProperty({ type: String, description: 'Source slug.', example: 'hh' })
  public sourceSlug!: string;

  /** When the run started (ISO 8601). */
  @ApiProperty({
    description: 'When the run started (ISO 8601).',
    type: String,
    format: 'date-time',
  })
  public startedAt!: string;

  /** When the run finished (ISO 8601), if it has. */
  @ApiProperty({
    description: 'When the run finished (ISO 8601), if it has.',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  public finishedAt!: string | null;

  /** Run status. */
  @ApiProperty({
    description: 'Run status.',
    enum: ['running', 'success', 'partial', 'failed'],
    enumName: 'ScrapeRunStatus',
  })
  public status!: ScrapeRunStatus;

  /** Run statistics: found, new, updated, errors. */
  @ApiProperty({
    description: 'Run statistics: found, new, updated, errors.',
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  public stats!: Record<string, number>;

  /** Error message when the run failed. */
  @ApiProperty({
    description: 'Error message when the run failed.',
    type: String,
    nullable: true,
  })
  public error!: string | null;
}

/**
 * Registered scraper-adapter slugs, as returned by the API.
 */
export class AdapterListResponse {
  /** Slugs with a registered scraper adapter. */
  @ApiProperty({ description: 'Slugs with a registered scraper adapter.', type: [String] })
  public slugs!: string[];
}

/**
 * Source connectivity test outcome, as returned by the API.
 */
export class SourceTestResponse {
  /** Test outcome. */
  @ApiProperty({
    description: 'Test outcome.',
    enum: SOURCE_TEST_STATUSES,
    enumName: 'SourceTestStatus',
  })
  public status!: SourceTestStatus;

  /** Human-readable detail (reason, fetched URL, or error message). */
  @ApiProperty({ description: 'Human-readable detail.', type: String })
  public detail!: string;

  /** HTTP status from the probe fetch, when the transport has one. */
  @ApiProperty({
    description: 'HTTP status from the probe fetch, when available.',
    type: Number,
    nullable: true,
  })
  public httpStatus!: number | null;

  /** Elapsed time for the probe, in milliseconds. */
  @ApiProperty({
    description: 'Elapsed time for the probe, in milliseconds.',
    type: Number,
    nullable: true,
  })
  public elapsedMs!: number | null;
}
