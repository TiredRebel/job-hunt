/**
 * @module cover-letters.dto
 *
 * Request DTOs for cover-letter endpoints. Validated by the global
 * ValidationPipe.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/**
 * DTO for saving an edited cover-letter draft.
 */
export class SaveCoverLetterDto {
  /** Edited draft body in markdown. */
  @ApiProperty({ description: 'Edited draft body in markdown.', type: String })
  @IsString()
  @MinLength(1)
  public body!: string;
}
