/**
 * @module jobs.dto
 *
 * Request DTOs for the jobs endpoints. Validated by the global ValidationPipe.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import type {
  DateField,
  JobFilter,
  JobSortBy,
  SortDir,
} from '../application/ports/job-repository.port';

/**
 * Query DTO for listing jobs.
 */
export class ListJobsQueryDto {
  /** Comma-separated source ids. */
  @ApiPropertyOptional({ type: String, description: 'Comma-separated source ids.', example: '1,3' })
  @IsOptional()
  @IsString()
  public sources?: string;

  /** Comma-separated tags. */
  @ApiPropertyOptional({
    type: String,
    description: 'Comma-separated tags.',
    example: 'typescript,node',
  })
  @IsOptional()
  @IsString()
  public tags?: string;

  /** Comma-separated remote values. */
  @ApiPropertyOptional({
    type: String,
    description: 'Comma-separated remote values.',
    example: 'remote,hybrid',
  })
  @IsOptional()
  @IsString()
  public remote?: string;

  /** Comma-separated seniority values. */
  @ApiPropertyOptional({
    type: String,
    description: 'Comma-separated seniority values.',
    example: 'senior,lead',
  })
  @IsOptional()
  @IsString()
  public seniority?: string;

  /** Comma-separated status values. */
  @ApiPropertyOptional({
    type: String,
    description: 'Comma-separated status values.',
    example: 'new,processed',
  })
  @IsOptional()
  @IsString()
  public status?: string;

  /** Comma-separated reaction stage values. */
  @ApiPropertyOptional({
    type: String,
    description: 'Comma-separated reaction stage values.',
    example: 'saved,applied',
  })
  @IsOptional()
  @IsString()
  public reaction?: string;

  /** Minimum match score (0–100). */
  @ApiPropertyOptional({
    description: 'Minimum match score (0–100).',
    type: Number,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  public scoreMin?: number;

  /** Maximum match score (0–100). */
  @ApiPropertyOptional({
    description: 'Maximum match score (0–100).',
    type: Number,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  public scoreMax?: number;

  /** Minimum salary. */
  @ApiPropertyOptional({ description: 'Minimum salary.', type: Number, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  public salaryMin?: number;

  /** Maximum salary. */
  @ApiPropertyOptional({ description: 'Maximum salary.', type: Number, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  public salaryMax?: number;

  /** Date field for interval filtering. */
  @ApiPropertyOptional({
    description: 'Date field for interval filtering.',
    enum: ['posted', 'first_seen'],
    enumName: 'DateField',
  })
  @IsOptional()
  @IsEnum(['posted', 'first_seen'])
  public dateField?: DateField;

  /** Start of date interval (ISO 8601). */
  @ApiPropertyOptional({
    description: 'Start of date interval (ISO 8601).',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public dateFrom?: Date;

  /** End of date interval (ISO 8601). */
  @ApiPropertyOptional({
    description: 'End of date interval (ISO 8601).',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public dateTo?: Date;

  /** Full-text query over title + company + description. */
  @ApiPropertyOptional({
    type: String,
    description: 'Full-text query over title + company + description.',
  })
  @IsOptional()
  @IsString()
  public query?: string;

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

  /** Sort column. */
  @ApiPropertyOptional({
    description: 'Sort column.',
    enum: ['score', 'posted', 'salary', 'lastSeen'],
    enumName: 'JobSortBy',
    default: 'lastSeen',
  })
  @IsOptional()
  @IsEnum(['score', 'posted', 'salary', 'lastSeen'])
  public sortBy?: JobSortBy;

  /** Sort direction. */
  @ApiPropertyOptional({
    description: 'Sort direction.',
    enum: ['asc', 'desc'],
    enumName: 'SortDir',
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  public sortDir?: SortDir;

  /**
   * Convert the query DTO into the repository filter shape.
   *
   * @returns Domain filter object.
   */
  public toFilter(): JobFilter {
    const split = (value: string | undefined): readonly string[] | undefined =>
      value
        ? value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined;

    const parseIds = (value: string | undefined): readonly number[] | undefined =>
      value
        ? value
            .split(',')
            .map((item) => Number.parseInt(item.trim(), 10))
            .filter((num) => !Number.isNaN(num))
        : undefined;

    return {
      sourceIds: parseIds(this.sources),
      tags: split(this.tags),
      remote: split(this.remote),
      seniority: split(this.seniority),
      status: split(this.status),
      reaction: split(this.reaction),
      scoreMin: this.scoreMin,
      scoreMax: this.scoreMax,
      salaryMin: this.salaryMin,
      salaryMax: this.salaryMax,
      dateField: this.dateField,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      query: this.query,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
      limit: this.limit,
      offset: this.offset,
    };
  }
}

/**
 * DTO for updating a job status.
 */
export class SetJobStatusDto {
  /** New job status. */
  @ApiProperty({
    description: 'New job status.',
    enum: ['new', 'processed', 'archived', 'hidden'],
    enumName: 'JobStatus',
  })
  @IsEnum(['new', 'processed', 'archived', 'hidden'])
  public status!: 'new' | 'processed' | 'archived' | 'hidden';
}
