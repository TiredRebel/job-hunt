/**
 * @module reactions.dto
 *
 * Request DTOs for reaction endpoints.
 */
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

import type { JobReaction } from '../domain/job-reaction.model';

/**
 * DTO for appending a single reaction.
 */
export class AppendReactionDto {
  /** Job id. */
  @IsString()
  public jobId!: string;

  /** Profile id. */
  @IsInt()
  @Type(() => Number)
  public profileId!: number;

  /** Reaction value. */
  @IsEnum([
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
  ])
  public reaction!: JobReaction;

  /** Optional note. */
  @IsOptional()
  @IsString()
  public note?: string;

  /** Optional occurred timestamp. */
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
  @IsArray()
  @IsString({ each: true })
  public jobIds!: string[];

  /** Profile id. */
  @IsInt()
  @Type(() => Number)
  public profileId!: number;

  /** Reaction value to set for all jobs. */
  @IsEnum([
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
  ])
  public reaction!: JobReaction;

  /** Optional note. */
  @IsOptional()
  @IsString()
  public note?: string;

  /** Optional occurred timestamp. */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public occurredAt?: Date;
}
