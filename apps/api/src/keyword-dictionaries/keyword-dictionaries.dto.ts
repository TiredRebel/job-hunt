/**
 * @module keyword-dictionaries.dto
 *
 * Request DTOs for keyword dictionary CRUD.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateBy,
  type ValidationOptions,
} from 'class-validator';

import type { DictionaryKind } from '../domain/keyword-dictionary.model';

/**
 * Validate a dictionary `items` payload: a string array (list kinds) or a
 * string-to-string record (`alias`). Nothing else is accepted — the scraper
 * calls `.strip()` on every entry, so a non-string here would crash a run.
 *
 * Cross-checking the shape against the dictionary's `kind` needs the stored
 * row on PATCH, so that lives in the service instead.
 *
 * @param options - Standard class-validator options.
 * @returns Property decorator.
 */
export function IsDictionaryItems(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isDictionaryItems',
      validator: {
        validate: (value: unknown): boolean =>
          Array.isArray(value)
            ? value.every((entry) => typeof entry === 'string')
            : typeof value === 'object' &&
              value !== null &&
              Object.values(value).every((entry) => typeof entry === 'string'),
        defaultMessage: (): string =>
          'items must be an array of strings or a record of string values',
      },
    },
    options,
  );
}

/**
 * DTO for creating a keyword dictionary.
 */
export class CreateKeywordDictionaryDto {
  /** Unique slug. */
  @ApiProperty({ type: String, description: 'Unique slug.', example: 'stop-words' })
  @IsString()
  public slug!: string;

  /** Display name. */
  @ApiProperty({ type: String, description: 'Display name.', example: 'Stop words' })
  @IsString()
  public name!: string;

  /** Dictionary kind. */
  @ApiProperty({
    description: 'Dictionary kind.',
    enum: ['search', 'include', 'exclude', 'exclude_employer', 'alias'],
    enumName: 'DictionaryKind',
  })
  @IsEnum(['search', 'include', 'exclude', 'exclude_employer', 'alias'])
  public kind!: DictionaryKind;

  /** Items: string list or alias record. */
  @ApiProperty({
    description: 'Items: string list for list kinds; alias record when kind is `alias`.',
    type: Array,
    oneOf: [
      { type: 'array', items: { type: 'string' } },
      { type: 'object', additionalProperties: { type: 'string' } },
    ],
    example: ['senior', 'lead'],
  })
  @IsDictionaryItems()
  public items!: string[] | Record<string, string>;

  /** Disabled list values, or disabled alias keys. */
  @ApiPropertyOptional({ type: String, isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public disabledItems?: string[];

  /** Source slugs this dictionary applies to (empty = all). */
  @ApiPropertyOptional({
    description: 'Source slugs this dictionary applies to (empty = all).',
    type: String,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public appliesTo?: string[];

  /** Whether the dictionary is enabled. */
  @ApiPropertyOptional({ description: 'Whether the dictionary is enabled.', type: Boolean })
  @IsOptional()
  @IsBoolean()
  public enabled?: boolean;
}

/**
 * DTO for updating a keyword dictionary.
 */
export class UpdateKeywordDictionaryDto {
  /** Display name. */
  @ApiPropertyOptional({ type: String, description: 'Display name.' })
  @IsOptional()
  @IsString()
  public name?: string;

  /** Items: string list or alias record. */
  @ApiPropertyOptional({
    description: 'Items: string list for list kinds; alias record when kind is `alias`.',
    type: Array,
    oneOf: [
      { type: 'array', items: { type: 'string' } },
      { type: 'object', additionalProperties: { type: 'string' } },
    ],
  })
  @IsOptional()
  @IsDictionaryItems()
  public items?: string[] | Record<string, string>;

  /** Disabled list values, or disabled alias keys. */
  @ApiPropertyOptional({ type: String, isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public disabledItems?: string[];

  /** Source slugs this dictionary applies to. */
  @ApiPropertyOptional({
    description: 'Source slugs this dictionary applies to.',
    type: String,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public appliesTo?: string[];

  /** Whether the dictionary is enabled. */
  @ApiPropertyOptional({ description: 'Whether the dictionary is enabled.', type: Boolean })
  @IsOptional()
  @IsBoolean()
  public enabled?: boolean;
}
