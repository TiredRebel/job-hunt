/**
 * @module profiles.response.dto
 *
 * Response DTOs for the profile endpoints. Mirror the `Profile` domain model
 * for OpenAPI documentation only; controllers keep returning domain objects
 * unchanged.
 */
import { ApiProperty } from '@nestjs/swagger';

import { CvMarkdownByLanguageDto, ProfilePreferencesDto } from './profiles.dto';

/**
 * User profile as returned by the API.
 */
export class ProfileResponse {
  /** Primary key. */
  @ApiProperty({ description: 'Primary key.', type: Number, example: 1 })
  public id!: number;

  /** Profile name. */
  @ApiProperty({ type: String, description: 'Profile name.', example: 'default' })
  public name!: string;

  /** CV / resume in markdown. */
  @ApiProperty({ description: 'CV / resume in markdown.', type: String, nullable: true })
  public cvMd!: string | null;

  /** CV language used by scoring and cover-letter generation. */
  @ApiProperty({ enum: ['en', 'uk'], enumName: 'CvLanguage', example: 'en' })
  public cvLanguage!: 'en' | 'uk';

  /** Saved CV markdown variants keyed by language. */
  @ApiProperty({ type: CvMarkdownByLanguageDto })
  public cvMdByLanguage!: CvMarkdownByLanguageDto;

  /** List of skills. */
  @ApiProperty({ description: 'List of skills.', type: String, isArray: true })
  public skills!: string[];

  /** Preferences JSONB payload. */
  @ApiProperty({ description: 'Preferences JSONB payload.', type: ProfilePreferencesDto })
  public preferences!: ProfilePreferencesDto;

  /** Whether this profile is the active one. */
  @ApiProperty({ description: 'Whether this profile is the active one.', type: Boolean })
  public isActive!: boolean;

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
