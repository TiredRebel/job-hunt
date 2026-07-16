/**
 * @module keyword-dictionaries.dto
 *
 * Request DTOs for keyword dictionary CRUD.
 */
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

import type { DictionaryKind } from '../domain/keyword-dictionary.model';

/**
 * DTO for creating a keyword dictionary.
 */
export class CreateKeywordDictionaryDto {
  /** Unique slug. */
  @IsString()
  public slug!: string;

  /** Display name. */
  @IsString()
  public name!: string;

  /** Dictionary kind. */
  @IsEnum(['search', 'include', 'exclude', 'alias'])
  public kind!: DictionaryKind;

  /** Items: string list or alias record. */
  public items!: string[] | Record<string, string>;

  /** Source slugs this dictionary applies to (empty = all). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public appliesTo?: string[];

  /** Whether the dictionary is enabled. */
  @IsOptional()
  @IsBoolean()
  public enabled?: boolean;
}

/**
 * DTO for updating a keyword dictionary.
 */
export class UpdateKeywordDictionaryDto {
  /** Display name. */
  @IsOptional()
  @IsString()
  public name?: string;

  /** Items: string list or alias record. */
  @IsOptional()
  public items?: string[] | Record<string, string>;

  /** Source slugs this dictionary applies to. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public appliesTo?: string[];

  /** Whether the dictionary is enabled. */
  @IsOptional()
  @IsBoolean()
  public enabled?: boolean;
}
