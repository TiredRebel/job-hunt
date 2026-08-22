/**
 * @module profile.model.spec
 *
 * Regression coverage for selecting the active localized CV.
 */
import { describe, expect, it } from 'vitest';

import { resolveProfileCv, type Profile } from './profile.model';

describe('resolveProfileCv', () => {
  it('returns the active localized CV', () => {
    const profile = {
      id: 1,
      name: 'default',
      cvMd: 'Legacy CV',
      cvLanguage: 'uk',
      cvMdByLanguage: { en: 'English CV', uk: 'Українське CV' },
      skills: [],
      preferences: {},
      isActive: true,
      createdAt: new Date('2026-07-01T00:00:00Z'),
      updatedAt: new Date('2026-07-01T00:00:00Z'),
    } as Profile;

    expect(resolveProfileCv(profile)).toBe('Українське CV');
  });

  it('falls back to the legacy CV for existing profiles', () => {
    const profile = {
      id: 1,
      name: 'default',
      cvMd: 'Legacy CV',
      cvLanguage: 'en',
      cvMdByLanguage: {},
      skills: [],
      preferences: {},
      isActive: true,
      createdAt: new Date('2026-07-01T00:00:00Z'),
      updatedAt: new Date('2026-07-01T00:00:00Z'),
    } as Profile;

    expect(resolveProfileCv(profile)).toBe('Legacy CV');
  });

  it('does not fall back to another language when the selected variant is empty', () => {
    const profile = {
      id: 1,
      name: 'default',
      cvMd: 'Legacy English CV',
      cvLanguage: 'uk',
      cvMdByLanguage: { en: 'English CV' },
      skills: [],
      preferences: {},
      isActive: true,
      createdAt: new Date('2026-07-01T00:00:00Z'),
      updatedAt: new Date('2026-07-01T00:00:00Z'),
    } as Profile;

    expect(resolveProfileCv(profile)).toBe('');
  });
});
