/**
 * @module sources.dto
 *
 * Request DTOs for source administration and scrape run history.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

import type { FetchStrategy } from '../domain/source.model';

const FETCH_STRATEGIES: readonly FetchStrategy[] = ['api', 'crawl4ai', 'agent-browser'];

/**
 * DTO for enabling/disabling a source.
 */
export class SetSourceEnabledDto {
  /** New enabled state. */
  @ApiProperty({ description: 'New enabled state.', type: Boolean })
  @IsBoolean()
  public enabled!: boolean;
}

/**
 * DTO for creating a source.
 */
export class CreateSourceDto {
  /** Source slug — the adapter-registry key, immutable after creation. */
  @ApiProperty({
    description: 'Source slug (adapter-registry key; immutable after creation).',
    type: String,
    example: 'djinni',
  })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, digits, and hyphens',
  })
  public slug!: string;

  /** Display name. */
  @ApiProperty({ description: 'Display name.', type: String, example: 'Djinni' })
  @IsString()
  @IsNotEmpty()
  public name!: string;

  /** Base URL of the source site. */
  @ApiProperty({
    description: 'Base URL of the source site.',
    type: String,
    example: 'https://djinni.co',
  })
  @IsUrl()
  public baseUrl!: string;

  /** Fetch strategy. */
  @ApiProperty({
    description: 'Fetch strategy.',
    enum: FETCH_STRATEGIES,
    enumName: 'FetchStrategy',
  })
  @IsIn(FETCH_STRATEGIES)
  public fetchStrategy!: FetchStrategy;

  /** Source-specific configuration. */
  @ApiPropertyOptional({
    description: 'Source-specific configuration (search queries, subreddits, rate limits).',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  public config?: Record<string, unknown>;

  /** Whether the source is enabled for scraping. */
  @ApiPropertyOptional({
    description: 'Whether the source is enabled for scraping. Defaults to true.',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  public enabled?: boolean;
}

/**
 * DTO for editing a source. Slug is intentionally absent — it is immutable.
 */
export class UpdateSourceDto {
  /** Display name. */
  @ApiPropertyOptional({ description: 'Display name.', type: String })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public name?: string;

  /** Base URL of the source site. */
  @ApiPropertyOptional({ description: 'Base URL of the source site.', type: String })
  @IsOptional()
  @IsUrl()
  public baseUrl?: string;

  /** Fetch strategy. */
  @ApiPropertyOptional({
    description: 'Fetch strategy.',
    enum: FETCH_STRATEGIES,
    enumName: 'FetchStrategy',
  })
  @IsOptional()
  @IsIn(FETCH_STRATEGIES)
  public fetchStrategy?: FetchStrategy;

  /** Source-specific configuration. */
  @ApiPropertyOptional({
    description: 'Source-specific configuration (search queries, subreddits, rate limits).',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  public config?: Record<string, unknown>;

  /** Whether the source is enabled for scraping. */
  @ApiPropertyOptional({
    description: 'Whether the source is enabled for scraping.',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  public enabled?: boolean;
}

/**
 * DTO for paginating scrape runs.
 */
export class ListRunsQueryDto {
  /** Page size. */
  @ApiPropertyOptional({
    description: 'Page size.',
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  public limit = 20;

  /** Page offset. */
  @ApiPropertyOptional({ description: 'Page offset.', type: Number, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  public offset = 0;
}
