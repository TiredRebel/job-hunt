/**
 * @module components/jobs/job-table-columns.spec
 *
 * Rendering regressions for the Jobs table's derived display values.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { buildJobColumns, type JobRow } from './job-table-columns';

const translations = {
  columns: (key: string) => key,
  moreTags: (count: number) => `+${count}`,
  selectRow: 'Select row',
  selectAll: 'Select all',
  deleteAction: 'Delete',
  deleteJob: (title: string) => `Delete ${title}`,
} as const;

function makeJob(overrides: Partial<JobRow> = {}): JobRow {
  return {
    id: '1',
    sourceId: 1,
    sourceSlug: 'workua',
    externalId: 'external-1',
    url: 'https://www.work.ua/jobs/1/',
    title: 'Python Engineer',
    company: null,
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
    firstSeenAt: '2026-07-01T00:00:00Z',
    lastSeenAt: '2026-07-02T00:00:00Z',
    status: 'new',
    matchScore: null,
    currentReaction: null,
    ...overrides,
  } as JobRow;
}

describe('Jobs table posted column', () => {
  it('renders first seen instead of a missing marker when postedAt is absent', () => {
    const columns = buildJobColumns(translations, 'en', { onDeleteJob: vi.fn() });
    const postedColumn = columns.find((column) => column.id === 'posted');
    if (typeof postedColumn?.cell !== 'function') {
      throw new Error('Posted cell renderer is missing');
    }

    const output = postedColumn.cell({ row: { original: makeJob() } } as never);
    render(<>{output}</>);

    expect(screen.getByText(/2026/)).toBeDefined();
    expect(screen.queryByText('—')).toBeNull();
  });
});
