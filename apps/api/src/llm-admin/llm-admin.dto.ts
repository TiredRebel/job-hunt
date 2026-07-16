/**
 * @module llm-admin.dto
 *
 * Request DTOs for LLM administration endpoints.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * DTO for switching the active provider.
 */
export class SetActiveProviderDto {
  /** Provider slug to activate. */
  @ApiProperty({ type: String, description: 'Provider slug to activate.', example: 'ollama-local' })
  @IsString()
  public slug!: string;
}
