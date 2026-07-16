/**
 * @module profiles.dto
 *
 * Request DTOs for profile CRUD.
 */
import { IsBoolean, IsOptional, IsString } from 'class-validator';

import type { ProfilePreferences } from '../domain/profile.model';

/**
 * DTO for creating a profile.
 */
export class CreateProfileDto {
  /** Profile name (e.g. "default"). */
  @IsString()
  public name!: string;

  /** CV / resume in markdown. */
  @IsOptional()
  @IsString()
  public cvMd?: string;

  /** List of skills. */
  @IsOptional()
  public skills?: string[];

  /** Preferences JSONB payload. */
  @IsOptional()
  public preferences?: ProfilePreferences;

  /** Whether this profile should become the active one. */
  @IsOptional()
  @IsBoolean()
  public isActive?: boolean;
}

/**
 * DTO for updating a profile.
 */
export class UpdateProfileDto {
  /** Profile name. */
  @IsOptional()
  @IsString()
  public name?: string;

  /** CV / resume in markdown. */
  @IsOptional()
  @IsString()
  public cvMd?: string;

  /** List of skills. */
  @IsOptional()
  public skills?: string[];

  /** Preferences JSONB payload. */
  @IsOptional()
  public preferences?: ProfilePreferences;

  /** Whether this profile should become the active one. */
  @IsOptional()
  @IsBoolean()
  public isActive?: boolean;
}
