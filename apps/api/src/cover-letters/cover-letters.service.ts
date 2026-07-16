/**
 * @module cover-letters.service
 *
 * Application service for reading and editing cover-letter drafts, scoped
 * to the active profile (single-user gateway; see docs/DESIGN decisions).
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { CoverLetter } from '../domain/cover-letter.model';
import type { Profile } from '../domain/profile.model';
import {
  COVER_LETTER_REPOSITORY,
  type CoverLetterRepository,
} from '../application/ports/cover-letter-repository.port';
import {
  PROFILE_REPOSITORY,
  type ProfileRepository,
} from '../application/ports/profile-repository.port';

/**
 * Application service for cover-letter drafts.
 */
@Injectable()
export class CoverLettersService {
  /**
   * Application service for cover-letter drafts.
   *
   * @param repository - Cover-letter repository port.
   * @param profiles - Profile repository port (active profile lookup).
   */
  public constructor(
    @Inject(COVER_LETTER_REPOSITORY)
    private readonly repository: CoverLetterRepository,
    @Inject(PROFILE_REPOSITORY)
    private readonly profiles: ProfileRepository,
  ) {}

  /**
   * Get the cover-letter draft for a job, scoped to the active profile.
   *
   * @param jobId - Job id.
   * @returns The draft.
   * @throws NotFoundException when no active profile or no draft exists.
   */
  public async get(jobId: bigint): Promise<CoverLetter> {
    const profile = await this.activeProfile();
    const letter = await this.repository.findByJobId(jobId, profile.id);
    if (letter === null) {
      throw new NotFoundException(`No cover-letter draft for job ${jobId.toString()}`);
    }
    return letter;
  }

  /**
   * Save an edited draft body for a job, scoped to the active profile.
   *
   * @param jobId - Job id.
   * @param body - Edited draft body.
   * @returns The saved draft.
   * @throws NotFoundException when no active profile exists.
   */
  public async save(jobId: bigint, body: string): Promise<CoverLetter> {
    const profile = await this.activeProfile();
    return this.repository.saveEdited(jobId, profile.id, body);
  }

  /**
   * Resolve the active profile.
   *
   * @returns Active profile.
   * @throws NotFoundException when no active profile exists.
   */
  private async activeProfile(): Promise<Profile> {
    const profile = await this.profiles.findActive();
    if (profile === null) {
      throw new NotFoundException('No active profile found');
    }
    return profile;
  }
}
