/**
 * @module llm-admin.response.dto
 *
 * Response DTOs for the LLM administration endpoints. Mirror the `LlmProvider`
 * domain model and the test-connection result for OpenAPI documentation only;
 * controllers keep returning domain objects unchanged.
 */
import { ApiProperty } from '@nestjs/swagger';

import type { LlmProviderKind } from '../domain/llm-provider.model';

/**
 * LLM provider as returned by the API. Secrets are referenced by env var name
 * only.
 */
export class LlmProviderResponse {
  /** Primary key. */
  @ApiProperty({ description: 'Primary key.', type: Number, example: 1 })
  public id!: number;

  /** Provider slug. */
  @ApiProperty({ type: String, description: 'Provider slug.', example: 'ollama-local' })
  public slug!: string;

  /** Provider kind. */
  @ApiProperty({
    description: 'Provider kind.',
    enum: ['ollama', 'openai-compatible', 'anthropic'],
    enumName: 'LlmProviderKind',
  })
  public kind!: LlmProviderKind;

  /** Base URL, when configured. */
  @ApiProperty({ description: 'Base URL, when configured.', type: String, nullable: true })
  public baseUrl!: string | null;

  /** Default model name. */
  @ApiProperty({ type: String, description: 'Default model name.' })
  public defaultModel!: string;

  /** Name of the environment variable holding the API key (never the value). */
  @ApiProperty({
    description: 'Name of the environment variable holding the API key (never the value).',
    type: String,
    nullable: true,
  })
  public apiKeyEnv!: string | null;

  /** Per-pipeline overrides. */
  @ApiProperty({
    description: 'Per-pipeline overrides.',
    type: 'object',
    additionalProperties: true,
  })
  public pipelineOverrides!: Record<string, unknown>;

  /** Whether this provider is the active one. */
  @ApiProperty({ description: 'Whether this provider is the active one.', type: Boolean })
  public isActive!: boolean;

  /** Provider-specific parameters. */
  @ApiProperty({
    description: 'Provider-specific parameters.',
    type: 'object',
    additionalProperties: true,
  })
  public params!: Record<string, unknown>;

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

/**
 * Result of testing the connection to the active provider.
 */
export class TestConnectionResponse {
  /** Whether the connection test succeeded. */
  @ApiProperty({ description: 'Whether the connection test succeeded.', type: Boolean })
  public ok!: boolean;
}
