/**
 * @module reactions.response.dto
 *
 * Response DTOs for the reaction endpoints. Mirror the `JobReactionEvent`
 * domain model for OpenAPI documentation only; controllers keep returning
 * domain objects unchanged. `bigint` domain ids are serialized as strings in
 * JSON and are therefore typed as `string` here.
 */
import { ApiProperty } from '@nestjs/swagger';

import type { JobReaction } from '../domain/job-reaction.model';

/**
 * Single reaction event as returned by the API.
 */
export class JobReactionEventResponse {
  /** Event id (bigint serialized as a string in JSON). */
  @ApiProperty({
    description: 'Event id (bigint serialized as a string).',
    type: String,
    example: '7',
  })
  public id!: string;

  /** Job id (bigint serialized as a string in JSON). */
  @ApiProperty({
    description: 'Job id (bigint serialized as a string).',
    type: String,
    example: '42',
  })
  public jobId!: string;

  /** Profile id. */
  @ApiProperty({ description: 'Profile id.', type: Number, example: 1 })
  public profileId!: number;

  /** Reaction value. */
  @ApiProperty({
    description: 'Reaction value.',
    enum: [
      'saved',
      'applied',
      'viewed_by_employer',
      'replied',
      'interview',
      'test_task',
      'offer',
      'rejected',
      'withdrawn',
      'note',
    ],
    enumName: 'JobReactionKind',
  })
  public reaction!: JobReaction;

  /** Optional note. */
  @ApiProperty({ description: 'Optional note.', type: String, nullable: true })
  public note!: string | null;

  /** When the reaction occurred (ISO 8601). */
  @ApiProperty({
    description: 'When the reaction occurred (ISO 8601).',
    type: String,
    format: 'date-time',
  })
  public occurredAt!: string;

  /** When the event row was created (ISO 8601). */
  @ApiProperty({
    description: 'When the event row was created (ISO 8601).',
    type: String,
    format: 'date-time',
  })
  public createdAt!: string;
}
