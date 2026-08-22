/**
 * @module profiles.dto
 *
 * Request DTOs for profile CRUD.
 */
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

import type { CvLanguage, CvMarkdownByLanguage, ProfilePreferences } from '../domain/profile.model';
import type { RemoteType, Seniority } from '../domain/job.model';

/**
 * Preferences JSONB payload shape. Documentation class mirroring the
 * `ProfilePreferences` domain interface; used for both request and response
 * schemas.
 */
export class ProfilePreferencesDto {
  /** Desired minimum salary in local currency. */
  @ApiPropertyOptional({ description: 'Desired minimum salary in local currency.', type: Number })
  public desiredSalaryMin?: number;

  /** Desired maximum salary in local currency. */
  @ApiPropertyOptional({ description: 'Desired maximum salary in local currency.', type: Number })
  public desiredSalaryMax?: number;

  /** Preferred remote arrangement. */
  @ApiPropertyOptional({
    description: 'Preferred remote arrangement.',
    enum: ['remote', 'hybrid', 'office', 'unknown'],
    enumName: 'RemoteType',
    isArray: true,
  })
  public remote?: RemoteType[];

  /** Preferred locations. */
  @ApiPropertyOptional({ description: 'Preferred locations.', type: String, isArray: true })
  public locations?: string[];

  /** Seniorities the user is open to. */
  @ApiPropertyOptional({
    description: 'Seniorities the user is open to.',
    enum: ['junior', 'middle', 'senior', 'lead', 'unknown'],
    enumName: 'Seniority',
    isArray: true,
  })
  public seniorities?: Seniority[];

  /** Stop-words for filtering. */
  @ApiPropertyOptional({ description: 'Stop-words for filtering.', type: String, isArray: true })
  public stopWords?: string[];
}

/** Localized CV markdown payload. */
export class CvMarkdownByLanguageDto implements Partial<Record<CvLanguage, string>> {
  /** English CV markdown. */
  @ApiPropertyOptional({ type: String, description: 'English CV markdown.' })
  @IsOptional()
  @IsString()
  public en?: string;

  /** Ukrainian CV markdown. */
  @ApiPropertyOptional({ type: String, description: 'Ukrainian CV markdown.' })
  @IsOptional()
  @IsString()
  public uk?: string;
}

/**
 * DTO for creating a profile.
 */
export class CreateProfileDto {
  /** Profile name (e.g. "default"). */
  @ApiProperty({ type: String, description: 'Profile name.', example: 'default' })
  @IsString()
  public name!: string;

  /** CV / resume in markdown. */
  @ApiPropertyOptional({ type: String, description: 'CV / resume in markdown.' })
  @IsOptional()
  @IsString()
  public cvMd?: string;

  /** CV language used by scoring and cover-letter generation. */
  @ApiPropertyOptional({ enum: ['en', 'uk'], enumName: 'CvLanguage' })
  @IsOptional()
  @IsIn(['en', 'uk'])
  public cvLanguage?: CvLanguage;

  /** Saved CV markdown variants keyed by language. */
  @ApiPropertyOptional({ type: CvMarkdownByLanguageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CvMarkdownByLanguageDto)
  public cvMdByLanguage?: CvMarkdownByLanguage;

  /** List of skills. */
  @ApiPropertyOptional({ description: 'List of skills.', type: String, isArray: true })
  @IsOptional()
  public skills?: string[];

  /** Preferences JSONB payload. */
  @ApiPropertyOptional({ description: 'Preferences JSONB payload.', type: ProfilePreferencesDto })
  @IsOptional()
  public preferences?: ProfilePreferences;

  /** Whether this profile should become the active one. */
  @ApiPropertyOptional({
    description: 'Whether this profile should become the active one.',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  public isActive?: boolean;
}

/**
 * DTO for updating a profile.
 */
export class UpdateProfileDto {
  /** Profile name. */
  @ApiPropertyOptional({ type: String, description: 'Profile name.' })
  @IsOptional()
  @IsString()
  public name?: string;

  /** CV / resume in markdown. */
  @ApiPropertyOptional({ type: String, description: 'CV / resume in markdown.' })
  @IsOptional()
  @IsString()
  public cvMd?: string;

  /** CV language used by scoring and cover-letter generation. */
  @ApiPropertyOptional({ enum: ['en', 'uk'], enumName: 'CvLanguage' })
  @IsOptional()
  @IsIn(['en', 'uk'])
  public cvLanguage?: CvLanguage;

  /** Saved CV markdown variants keyed by language. */
  @ApiPropertyOptional({ type: CvMarkdownByLanguageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CvMarkdownByLanguageDto)
  public cvMdByLanguage?: CvMarkdownByLanguage;

  /** List of skills. */
  @ApiPropertyOptional({ description: 'List of skills.', type: String, isArray: true })
  @IsOptional()
  public skills?: string[];

  /** Preferences JSONB payload. */
  @ApiPropertyOptional({ description: 'Preferences JSONB payload.', type: ProfilePreferencesDto })
  @IsOptional()
  public preferences?: ProfilePreferences;

  /** Whether this profile should become the active one. */
  @ApiPropertyOptional({
    description: 'Whether this profile should become the active one.',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  public isActive?: boolean;
}
