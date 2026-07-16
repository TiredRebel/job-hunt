/**
 * @module keyword-dictionaries.dto
 *
 * Request DTOs for keyword dictionary CRUD.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

import type { DictionaryKind } from '../domain/keyword-dictionary.model';

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
    enum: ['search', 'include', 'exclude', 'alias'],
    enumName: 'DictionaryKind',
  })
  @IsEnum(['search', 'include', 'exclude', 'alias'])
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
  public items!: string[] | Record<string, string>;

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
  public items?: string[] | Record<string, string>;

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
