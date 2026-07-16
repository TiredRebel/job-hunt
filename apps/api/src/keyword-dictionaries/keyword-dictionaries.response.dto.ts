/**
 * @module keyword-dictionaries.response.dto
 *
 * Response DTOs for the keyword dictionary endpoints. Mirror the
 * `KeywordDictionary` domain model for OpenAPI documentation only; controllers
 * keep returning domain objects unchanged.
 */
import { ApiProperty } from '@nestjs/swagger';

import type { DictionaryKind } from '../domain/keyword-dictionary.model';

/**
 * Keyword dictionary as returned by the API.
 */
export class KeywordDictionaryResponse {
  /** Primary key. */
  @ApiProperty({ description: 'Primary key.', type: Number, example: 1 })
  public id!: number;

  /** Unique slug. */
  @ApiProperty({ type: String, description: 'Unique slug.', example: 'stop-words' })
  public slug!: string;

  /** Display name. */
  @ApiProperty({ type: String, description: 'Display name.', example: 'Stop words' })
  public name!: string;

  /** Dictionary kind. */
  @ApiProperty({
    description: 'Dictionary kind.',
    enum: ['search', 'include', 'exclude', 'alias'],
    enumName: 'DictionaryKind',
  })
  public kind!: DictionaryKind;

  /** Items: string list or alias record. */
  @ApiProperty({
    description: 'Items: string list for list kinds; alias record when kind is `alias`.',
    type: Array,
    oneOf: [
      { type: 'array', items: { type: 'string' } },
      { type: 'object', additionalProperties: { type: 'string' } },
    ],
  })
  public items!: string[] | Record<string, string>;

  /** Source slugs this dictionary applies to; empty means all sources. */
  @ApiProperty({
    description: 'Source slugs this dictionary applies to; empty means all sources.',
    type: String,
    isArray: true,
  })
  public appliesTo!: string[];

  /** Whether the dictionary is enabled. */
  @ApiProperty({ description: 'Whether the dictionary is enabled.', type: Boolean })
  public enabled!: boolean;

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
