/**
 * @module sources.dto
 *
 * Request DTOs for source administration and scrape run history.
 */
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for enabling/disabling a source.
 */
export class SetSourceEnabledDto {
  /** New enabled state. */
  @IsBoolean()
  public enabled!: boolean;
}

/**
 * DTO for paginating scrape runs.
 */
export class ListRunsQueryDto {
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
}
