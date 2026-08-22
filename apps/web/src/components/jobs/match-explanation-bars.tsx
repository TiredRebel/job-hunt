/**
 * @module components/jobs/match-explanation-bars
 *
 * Structured match-score breakdown (design_handoff job-detail template:
 * must-have skills, seniority fit, salary vs expectation, each a labeled
 * progress bar). Every row is derived from real stored data — the LLM's own
 * `matched_skills`/`missing_skills` judgment for the skills row, plain
 * arithmetic against the active profile for salary/seniority — never a
 * fabricated numeric score. A row renders only when its inputs exist, so an
 * unscored job or a profile with no preferences set just shows fewer rows
 * (never a fake "0 / 0").
 */
import { useTranslations } from 'next-intl';

import type { JobDetail } from '@/lib/api/jobs';
import type { Profile } from '@/lib/api/profiles';

/** One breakdown row: a label, a 0–100 bar fill, and its value readout. */
interface BreakdownRow {
  readonly key: string;
  readonly label: string;
  readonly fillPercent: number;
  readonly valueText: string;
}

/** Salary delta beyond which the bar reads as fully "above expectation". */
const SALARY_DELTA_CLAMP_PCT = 50;

/**
 * Average of the two salary bounds present, or the one bound present, or
 * `null` when neither is set.
 *
 * @param min - Lower bound, if any.
 * @param max - Upper bound, if any.
 * @returns The midpoint, or `null` when there's nothing to average.
 */
function salaryMidpoint(min: number | null, max: number | null): number | null {
  if (min !== null && max !== null) {
    return (min + max) / 2;
  }
  return min ?? max ?? null;
}

/**
 * Build the breakdown rows this job/profile pair can actually support.
 *
 * @param job - Job detail (matched/missing skills, salary, seniority).
 * @param profile - Active profile (salary expectation, accepted seniorities).
 * @param t - `jobs.matchBreakdown` translator.
 * @returns Rows to render, in display order; empty when nothing computable.
 */
export function buildRows(
  job: JobDetail,
  profile: Profile | undefined,
  t: ReturnType<typeof useTranslations>,
): readonly BreakdownRow[] {
  const rows: BreakdownRow[] = [];

  const skillsTotal = job.matchedSkills.length + job.missingSkills.length;
  if (skillsTotal > 0) {
    rows.push({
      key: 'skills',
      label: t('skills'),
      fillPercent: (job.matchedSkills.length / skillsTotal) * 100,
      valueText: t('skillsValue', { matched: job.matchedSkills.length, total: skillsTotal }),
    });
  }

  const seniorities = profile?.preferences?.seniorities ?? [];
  if (seniorities.length > 0 && job.seniority !== 'unknown') {
    const fits = seniorities.includes(job.seniority);
    rows.push({
      key: 'seniority',
      label: t('seniority'),
      fillPercent: fits ? 100 : 0,
      valueText: fits ? t('seniorityFit') : t('seniorityMismatch'),
    });
  }

  const jobMidpoint = salaryMidpoint(job.salaryMin, job.salaryMax);
  const expectedMidpoint = salaryMidpoint(
    profile?.preferences?.desiredSalaryMin ?? null,
    profile?.preferences?.desiredSalaryMax ?? null,
  );
  if (jobMidpoint !== null && expectedMidpoint !== null && expectedMidpoint > 0) {
    const deltaPct = ((jobMidpoint - expectedMidpoint) / expectedMidpoint) * 100;
    const clamped = Math.max(-SALARY_DELTA_CLAMP_PCT, Math.min(SALARY_DELTA_CLAMP_PCT, deltaPct));
    rows.push({
      key: 'salary',
      label: t('salary'),
      fillPercent: 50 + (clamped / SALARY_DELTA_CLAMP_PCT) * 50,
      valueText: t('salaryValue', { sign: deltaPct >= 0 ? '+' : '', delta: Math.round(deltaPct) }),
    });
  }

  return rows;
}

/** Props accepted by {@link MatchExplanationBars}. */
export interface MatchExplanationBarsProps {
  readonly job: JobDetail;
  readonly profile: Profile | undefined;
}

/**
 * Structured match-score breakdown bars. Renders nothing when no row has
 * enough data to compute — callers should keep the free-text explanation as
 * the fallback in that case.
 *
 * @param props - Job detail and the active profile.
 * @returns The breakdown rows, or `null` when none are computable.
 */
export function MatchExplanationBars({ job, profile }: MatchExplanationBarsProps) {
  const t = useTranslations('jobs.matchBreakdown');
  const rows = buildRows(job, profile, t);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-2.5 text-xs">
          <span className="w-24 shrink-0 text-text-muted">{row.label}</span>
          <div className="h-1 flex-1 rounded-full bg-surface-tonal">
            <div
              className="h-1 rounded-full bg-accent"
              style={{ width: `${Math.max(0, Math.min(100, row.fillPercent))}%` }}
            />
          </div>
          <span className="tabular-nums w-14 shrink-0 text-right text-text-muted">
            {row.valueText}
          </span>
        </div>
      ))}
    </div>
  );
}
