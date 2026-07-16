/**
 * @module cover-letter-repository.port
 *
 * Port for reading and editing cover-letter drafts. Drafts themselves are
 * created by the LLM pipeline (out of scope here); the gateway only reads
 * a job/profile pair's draft and persists user edits to its body.
 */
import type { CoverLetter } from '../../domain/cover-letter.model';

/**
 * Repository contract for cover-letter drafts.
 */
export interface CoverLetterRepository {
  /**
   * Find the draft for a job/profile pair.
   *
   * @param jobId - Job id.
   * @param profileId - Profile id.
   * @returns The draft or `null` if none exists yet.
   */
  findByJobId(jobId: bigint, profileId: number): Promise<CoverLetter | null>;

  /**
   * Save an edited draft body, marking it as user-edited. Creates the row if
   * no draft exists yet (defensive: normally the LLM pipeline creates it
   * first, but editing should never be blocked on pipeline timing).
   *
   * @param jobId - Job id.
   * @param profileId - Profile id.
   * @param bodyMd - Edited draft body.
   * @returns The saved draft.
   */
  saveEdited(jobId: bigint, profileId: number, bodyMd: string): Promise<CoverLetter>;
}

/**
 * Injection token for the cover-letter repository port.
 */
export const COVER_LETTER_REPOSITORY = Symbol('COVER_LETTER_REPOSITORY');
