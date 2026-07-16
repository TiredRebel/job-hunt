/**
 * @module automation.dto
 *
 * Request DTOs for the automation endpoints (n8n → gateway). Kept lightly
 * validated — like the profile preferences payload — since these are
 * internal, token-guarded endpoints, not part of the public dashboard API.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Query DTO for the unprocessed-jobs feed.
 */
export class UnprocessedJobsQueryDto {
  /** Maximum rows to return. */
  @ApiPropertyOptional({
    description: 'Maximum rows to return.',
    type: Number,
    minimum: 1,
    maximum: 200,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  public limit = 20;
}

/**
 * Normalized job fields as produced by the LLM `normalize` pipeline.
 */
export class NormalizedJobDto {
  /** Job title. */
  @ApiProperty({ type: String })
  @IsString()
  public title!: string;

  /** Employer name. */
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  public company?: string | null;

  /** Location text. */
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  public location?: string | null;

  /** Whether the role is remote. */
  @ApiPropertyOptional({ type: Boolean, nullable: true })
  @IsOptional()
  public remote?: boolean | null;

  /** Seniority as guessed by the LLM (free text, mapped server-side). */
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  public seniority?: string | null;

  /** Minimum salary. */
  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  public salaryMin?: number | null;

  /** Maximum salary. */
  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  public salaryMax?: number | null;

  /** Salary currency. */
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  public salaryCurrency?: string | null;

  /** Faithful Markdown description. */
  @ApiProperty({ type: String })
  @IsString()
  public descriptionMd!: string;
}

/**
 * Match score fields as produced by the LLM `match` pipeline.
 */
export class MatchDto {
  /** Match score (0–100). */
  @ApiProperty({ type: Number, minimum: 0, maximum: 100 })
  public score!: number;

  /** Match explanation. */
  @ApiProperty({ type: String })
  @IsString()
  public explanation!: string;

  /** Provider/model used to produce this match. */
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  public modelUsed?: string | null;
}

/**
 * Cover-letter fields as produced by the LLM `cover_letter` pipeline.
 */
export class CoverLetterDto {
  /** Draft body in Markdown. */
  @ApiProperty({ type: String })
  @IsString()
  public bodyMd!: string;

  /** Provider/model used to produce this draft. */
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  public modelUsed?: string | null;
}

/**
 * Body for `POST /v1/automation/jobs/{rawJobId}/results`.
 */
export class JobResultDto {
  /** Outcome of this processing attempt. */
  @ApiProperty({ enum: ['processed', 'failed'], enumName: 'JobResultStatus' })
  @IsIn(['processed', 'failed'])
  public status!: 'processed' | 'failed';

  /** Source id the raw job belongs to (required when `status` is `processed`). */
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  public sourceId?: number;

  /** External posting id on the source site (required when `processed`). */
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  public externalId?: string;

  /** Canonical posting URL (required when `processed`). */
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  public url?: string;

  /** Normalized job (required when `processed`). */
  @ApiPropertyOptional({ type: NormalizedJobDto })
  @IsOptional()
  public normalized?: NormalizedJobDto;

  /** Match result, when the profile matched. */
  @ApiPropertyOptional({ type: MatchDto, nullable: true })
  @IsOptional()
  public match?: MatchDto | null;

  /** Cover-letter draft, when the score cleared the threshold. */
  @ApiPropertyOptional({ type: CoverLetterDto, nullable: true })
  @IsOptional()
  public coverLetter?: CoverLetterDto | null;
}

/** Notification channel values, shared by request and response schemas. */
const NOTIFICATION_CHANNEL_VALUES = ['telegram', 'email'] as const;

/**
 * Query DTO for the unnotified-matches feed.
 */
export class UnnotifiedMatchesQueryDto {
  /** Notification channel. */
  @ApiProperty({ enum: NOTIFICATION_CHANNEL_VALUES, enumName: 'NotificationChannel' })
  @IsEnum(NOTIFICATION_CHANNEL_VALUES)
  public channel!: 'telegram' | 'email';
}

/**
 * Body for `POST /v1/automation/notifications`.
 */
export class RecordNotificationDto {
  /** `core.job_matches.id` (bigint as string). */
  @ApiProperty({ type: String, description: 'Job match id (bigint as string).', example: '17' })
  @IsString()
  public jobMatchId!: string;

  /** Notification channel. */
  @ApiProperty({ enum: NOTIFICATION_CHANNEL_VALUES, enumName: 'NotificationChannel' })
  @IsEnum(NOTIFICATION_CHANNEL_VALUES)
  public channel!: 'telegram' | 'email';
}
