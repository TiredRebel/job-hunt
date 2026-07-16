/**
 * @module cover-letters.response.dto
 *
 * Response DTO for cover-letter endpoints. Mirrors the `CoverLetter` domain
 * model for OpenAPI documentation only; controllers keep returning domain
 * objects unchanged. `bigint` domain ids are serialized as strings in JSON
 * and are therefore typed as `string` here.
 */
import { ApiProperty } from '@nestjs/swagger';

/**
 * Cover-letter draft as returned by the API.
 */
export class CoverLetterResponse {
  /** Draft id (bigint serialized as a string in JSON). */
  @ApiProperty({
    description: 'Draft id (bigint serialized as a string).',
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

  /** Draft body in markdown. */
  @ApiProperty({ description: 'Draft body in markdown.', type: String })
  public bodyMd!: string;

  /** LLM provider/model snapshot used to generate the original draft. */
  @ApiProperty({
    description: 'LLM provider/model snapshot used to generate the original draft.',
    type: String,
    nullable: true,
  })
  public modelUsed!: string | null;

  /** Whether the user has edited the draft since it was generated. */
  @ApiProperty({
    description: 'Whether the user has edited the draft since it was generated.',
    type: Boolean,
  })
  public edited!: boolean;

  /** When the draft row was created (ISO 8601). */
  @ApiProperty({
    description: 'When the draft row was created (ISO 8601).',
    type: String,
    format: 'date-time',
  })
  public createdAt!: string;

  /** When the draft was last updated (ISO 8601). */
  @ApiProperty({
    description: 'When the draft was last updated (ISO 8601).',
    type: String,
    format: 'date-time',
  })
  public updatedAt!: string;
}
