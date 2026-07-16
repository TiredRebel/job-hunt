/**
 * @module sources.dto
 *
 * Request DTOs for source administration and scrape run history.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

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
