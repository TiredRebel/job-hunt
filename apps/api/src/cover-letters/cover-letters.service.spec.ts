/**
 * @module cover-letters.service.spec
 *
 * Unit tests for {@link CoverLettersService} using in-memory repository
 * fakes.
 */
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CoverLetter } from '../domain/cover-letter.model';
import type { Profile } from '../domain/profile.model';
import type { CoverLetterRepository } from '../application/ports/cover-letter-repository.port';
import type {
  CreateProfileInput,
  ProfileRepository,
  UpdateProfileInput,
} from '../application/ports/profile-repository.port';
import { CoverLettersService } from './cover-letters.service';

/**
 * In-memory {@link CoverLetterRepository} fake.
 */
class FakeCoverLetterRepository implements CoverLetterRepository {
  public letters: CoverLetter[] = [];
  private nextId = 1n;

  public findByJobId(jobId: bigint, profileId: number): Promise<CoverLetter | null> {
    return Promise.resolve(
      this.letters.find((letter) => letter.jobId === jobId && letter.profileId === profileId) ??
        null,
    );
  }

  public saveEdited(jobId: bigint, profileId: number, bodyMd: string): Promise<CoverLetter> {
    const existingIndex = this.letters.findIndex(
      (letter) => letter.jobId === jobId && letter.profileId === profileId,
    );
    const now = new Date('2026-07-16T00:00:00Z');
    if (existingIndex === -1) {
      const created: CoverLetter = {
        id: this.nextId,
        jobId,
        profileId,
        bodyMd,
        modelUsed: null,
        edited: true,
        createdAt: now,
        updatedAt: now,
      };
      this.nextId += 1n;
      this.letters.push(created);
      return Promise.resolve(created);
    }
    const existing = this.letters[existingIndex];
    if (existing === undefined) {
      throw new Error('Unreachable: index came from findIndex');
    }
    const updated: CoverLetter = { ...existing, bodyMd, edited: true, updatedAt: now };
    this.letters[existingIndex] = updated;
    return Promise.resolve(updated);
  }
}

/**
 * Minimal {@link ProfileRepository} fake with a single switchable active
 * profile.
 */
class FakeProfileRepository implements ProfileRepository {
  public active: Profile | null = {
    id: 1,
    name: 'default',
    cvMd: null,
    skills: [],
    preferences: {},
    isActive: true,
    createdAt: new Date('2026-07-01T00:00:00Z'),
    updatedAt: new Date('2026-07-01T00:00:00Z'),
  };

  public findAll(): Promise<readonly Profile[]> {
    return Promise.resolve(this.active === null ? [] : [this.active]);
  }

  public findActive(): Promise<Profile | null> {
    return Promise.resolve(this.active);
  }

  public findById(): Promise<Profile | null> {
    return Promise.resolve(this.active);
  }

  public create(input: CreateProfileInput): Promise<Profile> {
    throw new Error(`Not implemented in fake: create(${JSON.stringify(input)})`);
  }

  public update(id: number, input: UpdateProfileInput): Promise<Profile | null> {
    throw new Error(`Not implemented in fake: update(${id.toString()}, ${JSON.stringify(input)})`);
  }

  public delete(id: number): Promise<boolean> {
    throw new Error(`Not implemented in fake: delete(${id.toString()})`);
  }
}

describe('CoverLettersService', () => {
  let letters: FakeCoverLetterRepository;
  let profiles: FakeProfileRepository;
  let service: CoverLettersService;

  beforeEach(() => {
    letters = new FakeCoverLetterRepository();
    profiles = new FakeProfileRepository();
    service = new CoverLettersService(letters, profiles);
  });

  it('returns the draft for the active profile', async () => {
    await letters.saveEdited(42n, 1, 'Dear hiring manager...');

    const draft = await service.get(42n);

    expect(draft.bodyMd).toBe('Dear hiring manager...');
    expect(draft.edited).toBe(true);
  });

  it('throws NotFoundException when no draft exists', async () => {
    await expect(service.get(99n)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when no active profile exists', async () => {
    profiles.active = null;

    await expect(service.get(1n)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('saves an edited draft body and marks it edited', async () => {
    const saved = await service.save(7n, 'Updated letter body');

    expect(saved.bodyMd).toBe('Updated letter body');
    expect(saved.edited).toBe(true);
    expect(letters.letters).toHaveLength(1);
  });

  it('upserts onto an existing draft rather than duplicating it', async () => {
    await service.save(7n, 'First draft');
    await service.save(7n, 'Second draft');

    expect(letters.letters).toHaveLength(1);
    expect(letters.letters[0]?.bodyMd).toBe('Second draft');
  });
});
