/**
 * @module components/jobs/match-explanation-bars.spec
 *
 * Covers `buildRows`'s branches: each row appears only when its inputs
 * exist, skills fraction and salary delta are computed correctly, and an
 * unscored job with no profile preferences yields no rows at all (the
 * caller then falls back to the free-text explanation).
 */
import type { useTranslations } from 'next-intl';
import { describe, expect, it } from 'vitest';

import { buildRows } from './match-explanation-bars';
import type { JobDetail } from '@/lib/api/jobs';
import type { Profile } from '@/lib/api/profiles';

const translate = ((key: string, values?: Record<string, unknown>) =>
  values ? `${key}:${JSON.stringify(values)}` : key) as unknown as ReturnType<
  typeof useTranslations
>;

function makeJob(overrides: Partial<JobDetail> = {}): JobDetail {
  return {
    id: '1',
    sourceId: 1,
    sourceSlug: 'dou',
    externalId: 'x',
    url: 'https://example.com',
    title: 'Senior QA Engineer',
    company: 'Acme',
    descriptionMd: null,
    summary: null,
    tags: [],
    redFlags: [],
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    seniority: 'unknown',
    remote: 'unknown',
    location: null,
    postedAt: null,
    firstSeenAt: '2026-08-05T00:00:00Z',
    lastSeenAt: '2026-08-06T00:00:00Z',
    status: 'new',
    matchScore: null,
    currentReaction: null,
    currentReactionAt: null,
    matchExplanation: null,
    matchedSkills: [],
    missingSkills: [],
    ...overrides,
  };
}

function makeProfile(overrides: Partial<Profile['preferences']> = {}): Profile {
  return {
    id: 1,
    name: 'Default',
    cvMd: null,
    skills: [],
    preferences: { ...overrides },
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  } as unknown as Profile;
}

describe('buildRows', () => {
  it('returns nothing for an unscored job with no profile preferences', () => {
    expect(buildRows(makeJob(), makeProfile(), translate)).toEqual([]);
  });

  it('returns nothing when there is no profile at all', () => {
    const job = makeJob({ matchedSkills: ['TypeScript'], missingSkills: [] });
    expect(buildRows(job, undefined, translate).map((r) => r.key)).toEqual(['skills']);
  });

  it('computes the skills fraction from matched/missing skills', () => {
    const job = makeJob({ matchedSkills: ['TypeScript', 'Playwright'], missingSkills: ['Go'] });
    const [row] = buildRows(job, makeProfile(), translate);
    expect(row?.key).toBe('skills');
    expect(row?.fillPercent).toBeCloseTo((2 / 3) * 100);
  });

  it('flags a seniority match when the job seniority is in the accepted list', () => {
    const job = makeJob({ seniority: 'senior' });
    const profile = makeProfile({ seniorities: ['senior', 'lead'] });
    const row = buildRows(job, profile, translate).find((r) => r.key === 'seniority');
    expect(row?.fillPercent).toBe(100);
  });

  it('flags a seniority mismatch when the job seniority is outside the accepted list', () => {
    const job = makeJob({ seniority: 'junior' });
    const profile = makeProfile({ seniorities: ['senior', 'lead'] });
    const row = buildRows(job, profile, translate).find((r) => r.key === 'seniority');
    expect(row?.fillPercent).toBe(0);
  });

  it('omits the seniority row when the profile has no seniority preference', () => {
    const job = makeJob({ seniority: 'senior' });
    const rows = buildRows(job, makeProfile(), translate);
    expect(rows.some((r) => r.key === 'seniority')).toBe(false);
  });

  it('computes salary delta as a percentage above expectation', () => {
    const job = makeJob({ salaryMin: 5000, salaryMax: 5000 });
    const profile = makeProfile({ desiredSalaryMin: 4000, desiredSalaryMax: 4000 });
    const row = buildRows(job, profile, translate).find((r) => r.key === 'salary');
    // (5000 - 4000) / 4000 = +25%, clamped to [-50, 50] then mapped to a 0-100 fill.
    expect(row?.fillPercent).toBeCloseTo(50 + (25 / 50) * 50);
  });

  it('omits the salary row when the profile has no salary expectation', () => {
    const job = makeJob({ salaryMin: 5000, salaryMax: 5000 });
    const rows = buildRows(job, makeProfile(), translate);
    expect(rows.some((r) => r.key === 'salary')).toBe(false);
  });
});
