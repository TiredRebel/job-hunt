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
