/**
 * @module cover-letter-repository.port
 *
 * Port for reading, editing, and (re)generating cover-letter drafts. Drafts
 * are created either by the Phase 6 processing chain
 * ({@link AutomationRepository.persistJobResult}) or by
 * {@link CoverLettersService.regenerate}; this port covers the dashboard's
 * read/edit/regenerate surface for an existing draft.
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
   * no draft exists yet (defensive: normally the pipeline creates it first,
   * but editing should never be blocked on pipeline timing).
   *
   * @param jobId - Job id.
   * @param profileId - Profile id.
   * @param bodyMd - Edited draft body.
   * @returns The saved draft.
   */
  saveEdited(jobId: bigint, profileId: number, bodyMd: string): Promise<CoverLetter>;

  /**
   * Save a freshly LLM-generated draft body (`edited = false`). Used by
   * regeneration; unlike {@link saveEdited}, this never marks the draft
   * user-edited.
   *
   * @param jobId - Job id.
   * @param profileId - Profile id.
   * @param bodyMd - Generated draft body.
   * @param modelUsed - Provider/model snapshot, if known.
   * @returns The saved draft.
   */
  saveGenerated(
    jobId: bigint,
    profileId: number,
    bodyMd: string,
    modelUsed: string | null,
  ): Promise<CoverLetter>;
}

/**
 * Injection token for the cover-letter repository port.
 */
export const COVER_LETTER_REPOSITORY = Symbol('COVER_LETTER_REPOSITORY');
