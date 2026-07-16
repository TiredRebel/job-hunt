/**
 * @module llm-cover-letter-client.port
 *
 * Outbound port for cover-letter (re)generation on the LLM service. Kept
 * separate from {@link LlmAdminClient} (provider list/switch/test) since
 * this is a pipeline call, not an administration call.
 */

/** Job fields the `cover_letter` pipeline prompt consumes. */
export interface CoverLetterJobInput {
  readonly title: string;
  readonly company: string | null;
  readonly location: string | null;
  readonly remote: boolean | null;
  readonly seniority: string | null;
  readonly salaryMin: number | null;
  readonly salaryMax: number | null;
  readonly salaryCurrency: string | null;
  readonly descriptionMd: string;
}

/** Active-profile fields the `cover_letter` pipeline prompt consumes. */
export interface CoverLetterProfileInput {
  readonly summary: string;
  readonly skills: readonly string[];
  readonly preferences: string | null;
}

/** Input to {@link LlmCoverLetterClient.generate}. */
export interface GenerateCoverLetterInput {
  readonly jobId: bigint;
  readonly job: CoverLetterJobInput;
  readonly profile: CoverLetterProfileInput;
}

/**
 * Generated draft. The LLM service's `CoverLetter` schema does not report
 * which provider/model produced it, so there is no `modelUsed` here — the
 * same is true of every other pipeline response in the system today.
 */
export interface GeneratedCoverLetter {
  readonly bodyMd: string;
}

/**
 * Error thrown by {@link LlmCoverLetterClient} implementations, carrying the
 * upstream HTTP status so callers can map it (503 no active provider, 502
 * any other LLM failure) instead of always surfacing a generic 500.
 */
export class LlmUpstreamError extends Error {
  /**
   * Error thrown by {@link LlmCoverLetterClient} implementations.
   *
   * @param status - Upstream HTTP status code.
   * @param message - Upstream error detail.
   */
  public constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'LlmUpstreamError';
  }
}

/**
 * Outbound LLM cover-letter client contract.
 */
export interface LlmCoverLetterClient {
  /**
   * Generate a cover-letter draft for a normalized job and the active
   * profile.
   *
   * @param input - Job and profile context.
   * @returns The generated draft.
   * @throws LlmUpstreamError when the LLM service call fails.
   */
  generate(input: GenerateCoverLetterInput): Promise<GeneratedCoverLetter>;
}

/**
 * Injection token for the LLM cover-letter client port.
 */
export const LLM_COVER_LETTER_CLIENT = Symbol('LLM_COVER_LETTER_CLIENT');
