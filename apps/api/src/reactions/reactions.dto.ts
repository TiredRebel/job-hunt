/**
 * @module reactions.dto
 *
 * Request DTOs for reaction endpoints.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

import type { JobReaction } from '../domain/job-reaction.model';

/** Allowed reaction values, shared by request and response schemas. */
const JOB_REACTION_VALUES = [
  'saved',
  'applied',
  'viewed_by_employer',
  'replied',
  'interview',
  'test_task',
  'offer',
  'rejected',
  'withdrawn',
  'note',
] as const;

/**
 * DTO for appending a single reaction.
 */
export class AppendReactionDto {
  /** Job id. */
  @ApiProperty({ type: String, description: 'Job id (bigint as string).', example: '42' })
  @IsString()
  public jobId!: string;

  /** Profile id. */
  @ApiProperty({ description: 'Profile id.', type: Number, example: 1 })
  @IsInt()
  @Type(() => Number)
  public profileId!: number;

  /** Reaction value. */
  @ApiProperty({
    description: 'Reaction value.',
    enum: JOB_REACTION_VALUES,
    enumName: 'JobReactionKind',
  })
  @IsEnum(JOB_REACTION_VALUES)
  public reaction!: JobReaction;

  /** Optional note. */
  @ApiPropertyOptional({ type: String, description: 'Optional note.' })
  @IsOptional()
  @IsString()
  public note?: string;

  /** Optional occurred timestamp. */
  @ApiPropertyOptional({
    description: 'Optional occurred timestamp (ISO 8601). Defaults to now.',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public occurredAt?: Date;
}

/**
 * DTO for bulk reaction updates.
 */
export class BulkReactionsDto {
  /** Job ids to update. */
  @ApiProperty({
    description: 'Job ids to update (bigints as strings).',
    type: String,
    isArray: true,
    example: ['42', '43'],
  })
  @IsArray()
  @IsString({ each: true })
  public jobIds!: string[];

  /** Profile id. */
  @ApiProperty({ description: 'Profile id.', type: Number, example: 1 })
  @IsInt()
  @Type(() => Number)
  public profileId!: number;

  /** Reaction value to set for all jobs. */
  @ApiProperty({
    description: 'Reaction value to set for all jobs.',
    enum: JOB_REACTION_VALUES,
    enumName: 'JobReactionKind',
  })
  @IsEnum(JOB_REACTION_VALUES)
  public reaction!: JobReaction;

  /** Optional note. */
  @ApiPropertyOptional({ type: String, description: 'Optional note.' })
  @IsOptional()
  @IsString()
  public note?: string;

  /** Optional occurred timestamp. */
  @ApiPropertyOptional({
    description: 'Optional occurred timestamp (ISO 8601). Defaults to now.',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public occurredAt?: Date;
}
