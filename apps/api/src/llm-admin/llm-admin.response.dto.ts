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
 * LLM provider as returned by the API. API keys are never returned.
 */
export class LlmProviderResponse {
  /** Primary key. */
  @ApiProperty({ description: 'Primary key.', type: Number, example: 1 })
  public id!: number;

  /** Provider slug. */
  @ApiProperty({ type: String, description: 'Provider slug.', example: 'ollama-local' })
  public slug!: string;

  /** Human-readable connection name. */
  @ApiProperty({ type: String, description: 'Human-readable connection name.' })
  public name!: string;

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

  /** Whether a provider API key has been configured. */
  @ApiProperty({
    description: 'Whether a provider API key has been configured.',
    type: Boolean,
  })
  public apiKeyConfigured!: boolean;

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
 * Result of testing connectivity for one provider.
 */
export class ProviderTestResponse {
  /** Whether the provider responded successfully. */
  @ApiProperty({ description: 'Whether the provider responded successfully.', type: Boolean })
  public ok!: boolean;

  /** Human-readable detail (error class name on failure, null on success). */
  @ApiProperty({
    description: 'Human-readable detail (error class name on failure, null on success).',
    type: String,
    nullable: true,
  })
  public detail!: string | null;

  /** Round-trip latency in milliseconds, when measured. */
  @ApiProperty({
    description: 'Round-trip latency in milliseconds, when measured.',
    type: Number,
    nullable: true,
  })
  public elapsedMs!: number | null;
}

/**
 * Result of listing models available from one provider.
 */
export class ModelListResponse {
  /** Model identifiers reported by the provider. */
  @ApiProperty({ description: 'Model identifiers reported by the provider.', type: [String] })
  public models!: string[];

  /** Error detail when the model list could not be retrieved. */
  @ApiProperty({
    description: 'Error detail when the model list could not be retrieved.',
    type: String,
    nullable: true,
  })
  public error!: string | null;
}
