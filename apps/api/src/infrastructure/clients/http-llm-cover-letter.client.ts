/**
 * @module http-llm-cover-letter.client
 *
 * HTTP implementation of {@link LlmCoverLetterClient}. Calls
 * `POST /cover-letter` on the LLM service using the shared internal token.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';

import type { ApiConfig } from '../../config/api-config';
import {
  LlmUpstreamError,
  type GenerateCoverLetterInput,
  type GeneratedCoverLetter,
  type LlmCoverLetterClient,
} from '../../application/ports/llm-cover-letter-client.port';
import { CORRELATION_ID_HEADER, type AppClsStore } from '../logger/correlation-id';

/**
 * HTTP client for LLM cover-letter generation.
 */
@Injectable()
export class HttpLlmCoverLetterClient implements LlmCoverLetterClient {
  /**
   * HTTP client for LLM cover-letter generation.
   *
   * @param config - NestJS config service.
   * @param cls - Request-scoped CLS store carrying the correlation id.
   */
  public constructor(
    private readonly config: ConfigService,
    private readonly cls: ClsService<AppClsStore>,
  ) {}

  /** @inheritdoc */
  public async generate(input: GenerateCoverLetterInput): Promise<GeneratedCoverLetter> {
    const baseUrl = this.config.get<ApiConfig['LLM_BASE_URL']>('api.LLM_BASE_URL');
    const token = this.config.get<ApiConfig['INTERNAL_API_TOKEN']>('api.INTERNAL_API_TOKEN');
    if (!baseUrl || !token) {
      throw new Error('LLM cover-letter client misconfiguration: missing base URL or token');
    }
    const correlationId = this.cls.get('correlationId');

    // Not retried: generation is non-deterministic (a retry after a lost
    // response would produce different text), costs real LLM API/token
    // spend, and the LLM service records a pipeline run per call.
    const response = await fetch(`${baseUrl}/cover-letter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': token,
        ...(correlationId !== undefined ? { [CORRELATION_ID_HEADER]: correlationId } : {}),
      },
      body: JSON.stringify({
        job_id: Number(input.jobId),
        job: {
          title: input.job.title,
          company: input.job.company,
          location: input.job.location,
          remote: input.job.remote,
          employment_type: null,
          seniority: input.job.seniority,
          salary_min: input.job.salaryMin,
          salary_max: input.job.salaryMax,
          salary_currency: input.job.salaryCurrency,
          description_md: input.job.descriptionMd,
        },
        profile: {
          summary: input.profile.summary,
          skills: input.profile.skills,
          preferences: input.profile.preferences,
        },
      }),
    });

    if (!response.ok) {
      throw new LlmUpstreamError(response.status, await response.text());
    }

    const body = (await response.json()) as Record<string, unknown>;
    return { bodyMd: String(body['body_md']) };
  }
}
