/**
 * @module keyword-dictionaries/dictionary-filters.spec
 */
import { describe, expect, it } from 'vitest';

import type { KeywordDictionary } from '../domain/keyword-dictionary.model';
import {
  companyMatches,
  compileFilterRules,
  shouldHideJob,
  textContainsAny,
} from './dictionary-filters';

function dictionary(
  overrides: Partial<KeywordDictionary> & Pick<KeywordDictionary, 'kind' | 'slug'>,
): KeywordDictionary {
  return {
    id: 1,
    name: overrides.slug,
    items: [],
    disabledItems: [],
    appliesTo: [],
    enabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('dictionary-filters', () => {
  it('matches exclude terms case-insensitively', () => {
    const rules = compileFilterRules(
      [
        dictionary({
          slug: 'stop-words',
          kind: 'exclude',
          items: ['WordPress'],
        }),
      ],
      'dou',
    );

    expect(
      shouldHideJob(
        { title: 'Developer', company: 'Acme', descriptionMd: 'Uses wordpress daily' },
        rules,
      ),
    ).toBe(true);
  });

  it('ignores disabled items', () => {
    const rules = compileFilterRules(
      [
        dictionary({
          slug: 'stop-words',
          kind: 'exclude',
          items: ['WordPress'],
          disabledItems: ['WordPress'],
        }),
      ],
      'dou',
    );

    expect(rules.excludeTerms).toEqual([]);
  });

  it('matches excluded employers case-insensitively', () => {
    const rules = compileFilterRules(
      [
        dictionary({
          slug: 'excluded-employers',
          kind: 'exclude_employer',
          items: ['playtech'],
        }),
      ],
      'dou',
    );

    expect(companyMatches('Playtech', rules.excludedEmployers)).toBe(true);
    expect(
      shouldHideJob(
        { title: 'Fullstack Developer', company: 'Playtech', descriptionMd: 'Great stack' },
        rules,
      ),
    ).toBe(true);
  });

  it('respects applies_to scoping', () => {
    const rules = compileFilterRules(
      [
        dictionary({
          slug: 'excluded-employers',
          kind: 'exclude_employer',
          items: ['Playtech'],
          appliesTo: ['workua'],
        }),
      ],
      'dou',
    );

    expect(
      shouldHideJob(
        { title: 'Fullstack Developer', company: 'Playtech', descriptionMd: '' },
        rules,
      ),
    ).toBe(false);
  });

  it('applies must-have only from the must-have slug', () => {
    const rules = compileFilterRules(
      [
        dictionary({
          slug: 'nice-to-have',
          kind: 'include',
          items: ['remote'],
        }),
        dictionary({
          slug: 'must-have',
          kind: 'include',
          items: ['python'],
        }),
      ],
      'dou',
    );

    expect(rules.mustHaveTerms).toEqual(['python']);
    expect(
      shouldHideJob({ title: 'JS role', company: 'Acme', descriptionMd: 'frontend only' }, rules),
    ).toBe(true);
  });

  it('textContainsAny handles null haystack', () => {
    expect(textContainsAny(null, ['python'])).toBe(false);
  });
});
