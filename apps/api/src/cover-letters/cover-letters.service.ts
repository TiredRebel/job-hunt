/**
 * @module cover-letters.service
 *
 * Application service for reading, editing, and regenerating cover-letter
 * drafts, scoped to the active profile (single-user gateway; see
 * docs/DESIGN decisions).
 */
import {
  BadGatewayException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import type { CoverLetter } from '../domain/cover-letter.model';
import type { Job } from '../domain/job.model';
import { resolveProfileCv, type Profile } from '../domain/profile.model';
import {
  COVER_LETTER_REPOSITORY,
  type CoverLetterRepository,
} from '../application/ports/cover-letter-repository.port';
import { JOB_REPOSITORY, type JobRepository } from '../application/ports/job-repository.port';
import {
  LLM_COVER_LETTER_CLIENT,
  LlmUpstreamError,
  type LlmCoverLetterClient,
} from '../application/ports/llm-cover-letter-client.port';
import {
  PROFILE_REPOSITORY,
  type ProfileRepository,
} from '../application/ports/profile-repository.port';

/**
 * Map the job's closed `remote` enum onto the boolean the LLM `normalize`
 * pipeline shape uses. `hybrid` has no boolean equivalent and maps to
 * `null`, same as `unknown`.
 *
 * @param remote - Job's remote arrangement.
 * @returns Boolean remote flag, or `null` when not representable.
 */
function toLlmRemote(remote: Job['remote']): boolean | null {
  if (remote === 'remote') {
    return true;
  }
  if (remote === 'office') {
    return false;
  }
  return null;
}

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
   * @param jobs - Job repository port (job context for regeneration).
   * @param llm - LLM cover-letter client port.
   */
  public constructor(
    @Inject(COVER_LETTER_REPOSITORY)
    private readonly repository: CoverLetterRepository,
    @Inject(PROFILE_REPOSITORY)
    private readonly profiles: ProfileRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobs: JobRepository,
    @Inject(LLM_COVER_LETTER_CLIENT)
    private readonly llm: LlmCoverLetterClient,
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
   * Regenerate a cover-letter draft for a job via the LLM service, scoped
   * to the active profile. Never overwrites a draft's edited history in a
   * way that loses data — the caller (web) is expected to confirm before
   * discarding unsaved edits; this call always replaces the persisted body.
   *
   * @param jobId - Job id.
   * @returns The regenerated (and persisted) draft.
   * @throws NotFoundException when no active profile, no job, or no
   *   persisted match exists for this job (regeneration requires a match).
   * @throws ServiceUnavailableException when the LLM service has no active
   *   provider.
   * @throws BadGatewayException on any other LLM service failure.
   */
  public async regenerate(jobId: bigint): Promise<CoverLetter> {
    const profile = await this.activeProfile();
    const job = await this.jobs.findById(jobId);
    if (job === null) {
      throw new NotFoundException(`No job ${jobId.toString()}`);
    }
    if (job.matchScore === null) {
      throw new NotFoundException(
        `Job ${jobId.toString()} has no persisted match yet; regeneration requires one`,
      );
    }

    let generated;
    try {
      generated = await this.llm.generate({
        jobId,
        job: {
          title: job.title,
          company: job.company,
          location: job.location,
          remote: toLlmRemote(job.remote),
          seniority: job.seniority === 'unknown' ? null : job.seniority,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          descriptionMd: job.descriptionMd ?? '',
        },
        profile: {
          summary: resolveProfileCv(profile),
          skills: profile.skills,
          preferences:
            Object.keys(profile.preferences).length > 0
              ? JSON.stringify(profile.preferences)
              : null,
        },
      });
    } catch (error) {
      if (error instanceof LlmUpstreamError) {
        if (error.status === 503) {
          throw new ServiceUnavailableException(error.message);
        }
        throw new BadGatewayException(error.message);
      }
      throw error;
    }

    return this.repository.saveGenerated(jobId, profile.id, generated.bodyMd, null);
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
