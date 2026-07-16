/**
 * @module llm-admin.dto
 *
 * Request DTOs for LLM administration endpoints.
 */
import { IsString } from 'class-validator';

/**
 * DTO for switching the active provider.
 */
export class SetActiveProviderDto {
  /** Provider slug to activate. */
  @IsString()
  public slug!: string;
}
