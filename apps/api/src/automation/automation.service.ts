/**
 * @module automation.service
 *
 * Application service backing the n8n automation surface: the
 * unprocessed-jobs feed, result persistence, notification dedup, and the
 * digest. All decision logic (what to process, what was already notified,
 * digest content) lives here — n8n only orchestrates (see design.md in
 * openspec/changes/phase-6-n8n-workflows).
 */
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Profile } from '../domain/profile.model';
import {
  AUTOMATION_REPOSITORY,
  type AutomationRepository,
  type CoverLetterInput,
  type DigestPayload,
  type MatchInput,
  type NotificationChannel,
  type UnnotifiedMatch,
} from '../application/ports/automation-repository.port';
import {
  PROFILE_REPOSITORY,
  type ProfileRepository,
} from '../application/ports/profile-repository.port';
import {
  SCRAPER_CLIENT,
  type RawJob,
  type ScraperClient,
} from '../application/ports/scraper-client.port';
import type { JobResultDto } from './automation.dto';

/** The active profile, shaped for the LLM service's `ProfileInput`. */
export interface LlmProfileInput {
  readonly summary: string;
  readonly skills: string[];
  readonly preferences: string | null;
}

/** One raw job as handed to n8n for processing. */
export interface UnprocessedJob {
  readonly rawJobId: number;
  readonly sourceId: number;
  readonly externalId: string;
  readonly url: string;
  readonly title: string;
  readonly body: string;
}

/** Response payload for the unprocessed-jobs feed. */
export interface UnprocessedJobsPayload {
  readonly profile: LlmProfileInput;
  readonly jobs: readonly UnprocessedJob[];
}

/** Acknowledgement returned after persisting (or failing) a job result. */
export interface JobResultAck {
  readonly status: 'processed' | 'failed';
  readonly jobId: bigint | null;
}

/**
 * Project the active {@link Profile} onto the LLM service's `ProfileInput`
 * shape. There is no dedicated "summary" field on a profile — the CV
 * markdown is the closest fit and is what the LLM prompts were designed to
 * consume as free-text candidate context.
 *
 * @param profile - Active profile.
 * @returns LLM-ready profile payload.
 */
function toLlmProfileInput(profile: Profile): LlmProfileInput {
  const hasPreferences = Object.keys(profile.preferences).length > 0;
  return {
    summary: profile.cvMd ?? '',
    skills: [...profile.skills],
    preferences: hasPreferences ? JSON.stringify(profile.preferences) : null,
  };
}

/**
 * Map a {@link RawJob} onto the shape handed to n8n / `POST /process/job`.
 *
 * @param raw - Raw job from the scraper service.
 * @returns Job payload for the unprocessed-jobs feed.
 */
function toUnprocessedJob(raw: RawJob): UnprocessedJob {
  return {
    rawJobId: raw.id,
    sourceId: raw.sourceId,
    externalId: raw.externalId,
    url: raw.url,
    title: raw.title,
    body: raw.rawHtml,
  };
}

/**
 * Application service for the automation surface.
 */
@Injectable()
export class AutomationService {
  /**
   * Application service for the automation surface.
   *
   * @param repository - Automation repository port.
   * @param profiles - Profile repository port (active profile lookup).
   * @param scraper - Scraper client port (raw-job feed + processed marking).
   */
  public constructor(
    @Inject(AUTOMATION_REPOSITORY)
    private readonly repository: AutomationRepository,
    @Inject(PROFILE_REPOSITORY)
    private readonly profiles: ProfileRepository,
    @Inject(SCRAPER_CLIENT)
    private readonly scraper: ScraperClient,
  ) {}

  /**
   * Fetch raw jobs awaiting processing, plus the active profile in
   * LLM-ready shape.
   *
   * @param limit - Maximum rows to return.
   * @throws NotFoundException when no active profile exists.
   */
  public async unprocessedJobs(limit: number): Promise<UnprocessedJobsPayload> {
    const profile = await this.activeProfile();
    const rawJobs = await this.scraper.listUnprocessed(limit);
    return {
      profile: toLlmProfileInput(profile),
      jobs: rawJobs.map(toUnprocessedJob),
    };
  }

  /**
   * Persist (or record the failure of) one processing-chain attempt.
   *
   * @param rawJobId - `scraper.jobs_raw.id`.
   * @param payload - Processing outcome for this raw job.
   * @throws BadRequestException when `status` is `processed` but required
   *   fields are missing.
   * @throws NotFoundException when `rawJobId` is unknown to the scraper.
   */
  public async persistResult(rawJobId: number, payload: JobResultDto): Promise<JobResultAck> {
    if (payload.status === 'failed') {
      const marked = await this.scraper.markProcessed(rawJobId, 'failed');
      if (!marked) {
        throw new NotFoundException(`Unknown raw job ${rawJobId}`);
      }
      return { status: 'failed', jobId: null };
    }

    const { sourceId, externalId, url, normalized } = payload;
    if (
      sourceId === undefined ||
      externalId === undefined ||
      url === undefined ||
      normalized === undefined
    ) {
      throw new BadRequestException(
        'sourceId, externalId, url and normalized are required when status is "processed"',
      );
    }

    const profile = await this.activeProfile();
    const match: MatchInput | null = payload.match
      ? {
          score: payload.match.score,
          explanation: payload.match.explanation,
          modelUsed: payload.match.modelUsed ?? null,
        }
      : null;
    const coverLetter: CoverLetterInput | null = payload.coverLetter
      ? { bodyMd: payload.coverLetter.bodyMd, modelUsed: payload.coverLetter.modelUsed ?? null }
      : null;

    const result = await this.repository.persistJobResult({
      rawJobId,
      sourceId,
      externalId,
      url,
      profileId: profile.id,
      normalized: {
        title: normalized.title,
        company: normalized.company ?? null,
        location: normalized.location ?? null,
        remote: normalized.remote ?? null,
        employmentType: null,
        seniority: normalized.seniority ?? null,
        salaryMin: normalized.salaryMin ?? null,
        salaryMax: normalized.salaryMax ?? null,
        salaryCurrency: normalized.salaryCurrency ?? null,
        descriptionMd: normalized.descriptionMd,
      },
      match,
      coverLetter,
    });

    const marked = await this.scraper.markProcessed(rawJobId, 'done');
    if (!marked) {
      throw new NotFoundException(`Unknown raw job ${rawJobId}`);
    }
    return { status: 'processed', jobId: result.jobId };
  }

  /**
   * List matches at or above the score threshold with no notification
   * recorded yet on `channel`.
   *
   * @param channel - Notification channel.
   */
  public async unnotifiedMatches(
    channel: NotificationChannel,
  ): Promise<readonly UnnotifiedMatch[]> {
    return this.repository.findUnnotifiedMatches(channel);
  }

  /**
   * Record a sent notification.
   *
   * @param jobMatchId - `core.job_matches.id`.
   * @param channel - Notification channel.
   * @throws ConflictException when already recorded for this match/channel.
   */
  public async recordNotification(jobMatchId: bigint, channel: NotificationChannel): Promise<void> {
    const inserted = await this.repository.recordNotification(jobMatchId, channel);
    if (!inserted) {
      throw new ConflictException('Notification already recorded for this match/channel');
    }
  }

  /**
   * Jobs and matches new since the last digest.
   */
  public async digest(): Promise<DigestPayload> {
    return this.repository.digest();
  }

  /**
   * Advance the digest watermark to now.
   *
   * @returns The new watermark value.
   */
  public async markDigestSent(): Promise<Date> {
    return this.repository.markDigestSent();
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
