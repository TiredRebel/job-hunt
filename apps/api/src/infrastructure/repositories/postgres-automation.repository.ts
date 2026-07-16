/**
 * @module postgres-automation.repository
 *
 * Postgres implementation of {@link AutomationRepository}. Every query here
 * targets `core.*` tables the gateway already owns; raw-job state
 * (`scraper.jobs_raw`) is never touched directly — see
 * {@link ScraperClient.markProcessed}.
 */
import { Injectable } from '@nestjs/common';

import type {
  AutomationRepository,
  DigestPayload,
  NotificationChannel,
  PersistJobResultInput,
  PersistJobResultOutput,
  UnnotifiedMatch,
} from '../../application/ports/automation-repository.port';
import { PgDatabase } from '../database/database.module';

const KNOWN_SENIORITIES = new Set(['junior', 'middle', 'senior', 'lead']);

/**
 * Map the LLM's free-text seniority guess onto `core.jobs`'s closed enum.
 *
 * @param raw - Seniority text from the `normalize` pipeline, if any.
 * @returns A value satisfying `core.jobs.seniority`'s CHECK constraint.
 */
function mapSeniority(raw: string | null): 'junior' | 'middle' | 'senior' | 'lead' | 'unknown' {
  const normalized = raw?.trim().toLowerCase() ?? '';
  if (KNOWN_SENIORITIES.has(normalized)) {
    return normalized as 'junior' | 'middle' | 'senior' | 'lead';
  }
  if (normalized.includes('lead') || normalized.includes('principal')) {
    return 'lead';
  }
  if (normalized.includes('senior') || normalized === 'sr') {
    return 'senior';
  }
  if (normalized.includes('middle') || normalized === 'mid') {
    return 'middle';
  }
  if (normalized.includes('junior') || normalized === 'jr') {
    return 'junior';
  }
  return 'unknown';
}

/**
 * Map the LLM's boolean remote flag onto `core.jobs`'s closed enum. The
 * `normalize` pipeline cannot distinguish `hybrid` from a plain boolean, so
 * that state is never produced here — only read/edited manually.
 *
 * @param remote - Remote flag from the `normalize` pipeline, if any.
 * @returns A value satisfying `core.jobs.remote`'s CHECK constraint.
 */
function mapRemote(remote: boolean | null): 'remote' | 'office' | 'unknown' {
  if (remote === true) {
    return 'remote';
  }
  if (remote === false) {
    return 'office';
  }
  return 'unknown';
}

/**
 * Postgres-backed automation repository.
 */
@Injectable()
export class PostgresAutomationRepository implements AutomationRepository {
  /**
   * Postgres-backed automation repository.
   *
   * @param db - Pg database wrapper.
   */
  public constructor(private readonly db: PgDatabase) {}

  /** @inheritdoc */
  public async persistJobResult(input: PersistJobResultInput): Promise<PersistJobResultOutput> {
    return this.db.transaction(async (client) => {
      const jobResult = await client.query<Record<string, unknown>>(
        `INSERT INTO core.jobs (
           source_id, raw_id, external_id, url, title, company, description_md,
           salary_min, salary_max, salary_currency, seniority, remote, location, status
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'processed')
         ON CONFLICT (source_id, external_id) DO UPDATE SET
           raw_id = EXCLUDED.raw_id,
           title = EXCLUDED.title,
           company = EXCLUDED.company,
           description_md = EXCLUDED.description_md,
           salary_min = EXCLUDED.salary_min,
           salary_max = EXCLUDED.salary_max,
           salary_currency = EXCLUDED.salary_currency,
           seniority = EXCLUDED.seniority,
           remote = EXCLUDED.remote,
           location = EXCLUDED.location,
           status = 'processed',
           last_seen_at = now()
         RETURNING id`,
        [
          input.sourceId,
          input.rawJobId,
          input.externalId,
          input.url,
          input.normalized.title,
          input.normalized.company,
          input.normalized.descriptionMd,
          input.normalized.salaryMin,
          input.normalized.salaryMax,
          input.normalized.salaryCurrency,
          mapSeniority(input.normalized.seniority),
          mapRemote(input.normalized.remote),
          input.normalized.location,
        ],
      );
      const jobRow = jobResult.rows[0];
      if (jobRow === undefined) {
        throw new Error('Job upsert unexpectedly returned no row');
      }
      const jobId = BigInt(jobRow['id'] as number | string);

      if (input.match !== null) {
        await client.query(
          `INSERT INTO core.job_matches (job_id, profile_id, score, explanation, model_used)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (job_id, profile_id) DO UPDATE SET
             score = EXCLUDED.score,
             explanation = EXCLUDED.explanation,
             model_used = EXCLUDED.model_used`,
          [
            jobId,
            input.profileId,
            input.match.score,
            input.match.explanation,
            input.match.modelUsed,
          ],
        );
      }

      if (input.coverLetter !== null) {
        await client.query(
          `INSERT INTO core.cover_letters (job_id, profile_id, body_md, model_used, edited)
           VALUES ($1,$2,$3,$4,false)
           ON CONFLICT (job_id, profile_id) DO UPDATE SET
             body_md = EXCLUDED.body_md,
             model_used = EXCLUDED.model_used
           WHERE core.cover_letters.edited = false`,
          [jobId, input.profileId, input.coverLetter.bodyMd, input.coverLetter.modelUsed],
        );
      }

      return { jobId };
    });
  }

  /** @inheritdoc */
  public async findUnnotifiedMatches(
    channel: NotificationChannel,
  ): Promise<readonly UnnotifiedMatch[]> {
    const result = await this.db.query<Record<string, unknown>>(
      `SELECT jm.id AS job_match_id, jm.job_id, j.title AS job_title, j.company, j.url,
              jm.score, jm.explanation
       FROM core.job_matches jm
       JOIN core.jobs j ON j.id = jm.job_id
       WHERE jm.score >= (
               SELECT (value::text)::int FROM core.app_settings WHERE key = 'match_threshold'
             )
         AND NOT EXISTS (
               SELECT 1 FROM core.notifications n
               WHERE n.job_match_id = jm.id AND n.channel = $1
             )
       ORDER BY jm.score DESC`,
      [channel],
    );
    return result.rows.map((row) => ({
      jobMatchId: BigInt(row['job_match_id'] as number | string),
      jobId: BigInt(row['job_id'] as number | string),
      jobTitle: row['job_title'] as string,
      company: (row['company'] as string | null) ?? null,
      url: row['url'] as string,
      score: row['score'] as number,
      explanation: (row['explanation'] as string | null) ?? null,
    }));
  }

  /** @inheritdoc */
  public async recordNotification(
    jobMatchId: bigint,
    channel: NotificationChannel,
  ): Promise<boolean> {
    const result = await this.db.query(
      `INSERT INTO core.notifications (job_match_id, channel) VALUES ($1, $2)
       ON CONFLICT (job_match_id, channel) DO NOTHING
       RETURNING id`,
      [jobMatchId, channel],
    );
    return result.rows.length > 0;
  }

  /** @inheritdoc */
  public async digest(): Promise<DigestPayload> {
    const settingResult = await this.db.query<Record<string, unknown>>(
      "SELECT value FROM core.app_settings WHERE key = 'last_digest_at'",
    );
    const raw = settingResult.rows[0]?.['value'] as string | null | undefined;
    const since = raw === null || raw === undefined ? null : new Date(raw);
    const effectiveSince = since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);

    const jobsResult = await this.db.query<Record<string, unknown>>(
      `SELECT j.id AS job_id, j.title, s.slug AS source_slug, j.first_seen_at
       FROM core.jobs j
       JOIN core.sources s ON s.id = j.source_id
       WHERE j.first_seen_at > $1
       ORDER BY j.first_seen_at DESC`,
      [effectiveSince],
    );
    const matchesResult = await this.db.query<Record<string, unknown>>(
      `SELECT jm.job_id, j.title, jm.score, j.url
       FROM core.job_matches jm
       JOIN core.jobs j ON j.id = jm.job_id
       WHERE jm.created_at > $1
       ORDER BY jm.score DESC`,
      [effectiveSince],
    );

    return {
      since,
      newJobs: jobsResult.rows.map((row) => ({
        jobId: BigInt(row['job_id'] as number | string),
        title: row['title'] as string,
        sourceSlug: row['source_slug'] as string,
        firstSeenAt: new Date(row['first_seen_at'] as string),
      })),
      newMatches: matchesResult.rows.map((row) => ({
        jobId: BigInt(row['job_id'] as number | string),
        title: row['title'] as string,
        score: row['score'] as number,
        url: row['url'] as string,
      })),
    };
  }

  /** @inheritdoc */
  public async markDigestSent(): Promise<Date> {
    const now = new Date();
    await this.db.query(
      "UPDATE core.app_settings SET value = to_jsonb($1::text) WHERE key = 'last_digest_at'",
      [now.toISOString()],
    );
    return now;
  }
}
