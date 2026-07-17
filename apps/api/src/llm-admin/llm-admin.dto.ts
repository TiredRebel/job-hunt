/**
 * @module llm-admin.dto
 *
 * Request DTOs for LLM administration endpoints.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, Matches } from 'class-validator';

import type { LlmProviderKind } from '../domain/llm-provider.model';

const PROVIDER_KINDS: readonly LlmProviderKind[] = ['ollama', 'openai-compatible', 'anthropic'];

/**
 * DTO for switching the active provider.
 */
export class SetActiveProviderDto {
  /** Provider slug to activate. */
  @ApiProperty({ type: String, description: 'Provider slug to activate.', example: 'ollama-local' })
  @IsString()
  public slug!: string;
}

/**
 * DTO for creating a new provider. Rows are created inactive.
 */
export class CreateLlmProviderDto {
  /** Provider slug (registry key), permanent after creation. */
  @ApiProperty({
    description: 'Provider slug (registry key), permanent after creation.',
    type: String,
    example: 'openrouter',
  })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, digits, and hyphens',
  })
  public slug!: string;

  /** Provider kind — permanent after creation. */
  @ApiProperty({
    description: 'Provider kind — permanent after creation.',
    enum: PROVIDER_KINDS,
    enumName: 'LlmProviderKind',
  })
  @IsIn(PROVIDER_KINDS)
  public kind!: LlmProviderKind;

  /**
   * Base URL of the provider API. Not validated as a strict URL — local/Docker
   * hosts like `http://ollama:11434` are a first-class case here, unlike
   * public source sites elsewhere in this API.
   */
  @ApiProperty({
    description: 'Base URL of the provider API (e.g. http://ollama:11434 or a public API root).',
    type: String,
    example: 'https://openrouter.ai/api/v1',
  })
  @IsString()
  @IsNotEmpty()
  public baseUrl!: string;

  /** Default model name. */
  @ApiProperty({ type: String, description: 'Default model name.', example: 'qwen/qwen3-14b' })
  @IsString()
  @IsNotEmpty()
  public defaultModel!: string;

  /** Name of the environment variable holding the API key (never the value). */
  @ApiPropertyOptional({
    description: 'Name of the environment variable holding the API key (never the value).',
    type: String,
    example: 'OPENROUTER_API_KEY',
  })
  @IsOptional()
  @IsString()
  public apiKeyEnv?: string;
}

/**
 * DTO for editing a provider's configuration. Omitted fields are left
 * untouched. `slug` and `kind` are absent — both are immutable after
 * creation.
 */
export class UpdateLlmProviderDto {
  /** New default model. */
  @ApiPropertyOptional({ description: 'New default model.', type: String })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public defaultModel?: string;

  /** New base URL. */
  @ApiPropertyOptional({ description: 'New base URL.', type: String })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public baseUrl?: string;

  /**
   * Name of the environment variable holding the API key. Send `null` to
   * clear the key requirement; omit the field entirely to leave it untouched.
   */
  @ApiPropertyOptional({
    description:
      'Env var name holding the API key. Send null to clear the key requirement; omit to leave unchanged.',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  public apiKeyEnv?: string | null;

  /**
   * Per-pipeline model/temperature overrides. Replaces the whole map (not
   * merged) — deep shape validation happens on the LLM service.
   */
  @ApiPropertyOptional({
    description: 'Per-pipeline model/temperature overrides. Replaces the whole map (not merged).',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  public pipelineOverrides?: Record<string, unknown>;
}
