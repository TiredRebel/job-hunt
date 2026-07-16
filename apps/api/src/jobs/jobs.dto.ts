/**
 * @module jobs.dto
 *
 * Request DTOs for the jobs endpoints. Validated by the global ValidationPipe.
 */
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import type { DateField, JobFilter } from '../application/ports/job-repository.port';

/**
 * Query DTO for listing jobs.
 */
export class ListJobsQueryDto {
  /** Comma-separated source ids. */
  @IsOptional()
  @IsString()
  public sources?: string;

  /** Comma-separated tags. */
  @IsOptional()
  @IsString()
  public tags?: string;

  /** Comma-separated remote values. */
  @IsOptional()
  @IsString()
  public remote?: string;

  /** Comma-separated seniority values. */
  @IsOptional()
  @IsString()
  public seniority?: string;

  /** Comma-separated status values. */
  @IsOptional()
  @IsString()
  public status?: string;

  /** Comma-separated reaction stage values. */
  @IsOptional()
  @IsString()
  public reaction?: string;

  /** Minimum match score (0–100). */
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  public scoreMin?: number;

  /** Maximum match score (0–100). */
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  public scoreMax?: number;

  /** Minimum salary. */
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  public salaryMin?: number;

  /** Maximum salary. */
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  public salaryMax?: number;

  /** Date field for interval filtering. */
  @IsOptional()
  @IsEnum(['posted', 'first_seen'])
  public dateField?: DateField;

  /** Start of date interval (ISO 8601). */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public dateFrom?: Date;

  /** End of date interval (ISO 8601). */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public dateTo?: Date;

  /** Full-text query over title + company + description. */
  @IsOptional()
  @IsString()
  public query?: string;

  /** Page size. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  public limit = 20;

  /** Page offset. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  public offset = 0;

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
  @IsEnum(['new', 'processed', 'archived', 'hidden'])
  public status!: 'new' | 'processed' | 'archived' | 'hidden';
}
