/**
 * @module common.response.dto
 *
 * Response DTOs shared across bounded contexts. Named object wrappers are
 * used instead of bare JSON primitives so every endpoint response gets a
 * named OpenAPI component schema (bare primitives produce inline, anonymous
 * schemas in the generated client).
 */
import { ApiProperty } from '@nestjs/swagger';

/**
 * Result of a bulk insert operation.
 */
export class BulkInsertedResponse {
  /** Number of rows inserted. */
  @ApiProperty({
    description: 'Number of rows inserted.',
    type: Number,
    example: 3,
  })
  public inserted!: number;
}

/**
 * Result of a delete operation.
 */
export class DeletedResponse {
  /** Whether the entity existed and was deleted. */
  @ApiProperty({
    description: 'Whether the entity existed and was deleted.',
    type: Boolean,
    example: true,
  })
  public deleted!: boolean;
}

/**
 * Result of a bulk delete operation.
 */
export class BulkDeletedResponse {
  /** Number of rows actually deleted. */
  @ApiProperty({
    description: 'Number of rows actually deleted.',
    type: Number,
    example: 3,
  })
  public deleted!: number;
}
