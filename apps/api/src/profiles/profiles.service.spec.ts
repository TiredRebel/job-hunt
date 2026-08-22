/**
 * @module profiles.service.spec
 *
 * Unit tests for {@link ProfilesService} using an in-memory repository fake.
 */
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Profile } from '../domain/profile.model';
import type {
  CreateProfileInput,
  ProfileRepository,
  UpdateProfileInput,
} from '../application/ports/profile-repository.port';
import { ProfilesService } from './profiles.service';

/**
 * Build a profile fixture with sensible defaults.
 *
 * @param overrides - Fields to override.
 * @returns Profile fixture.
 */
function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 1,
    name: 'Default',
    cvMd: null,
    cvLanguage: 'en',
    cvMdByLanguage: {},
    skills: ['typescript'],
    preferences: {},
    isActive: true,
    createdAt: new Date('2026-07-01T00:00:00Z'),
    updatedAt: new Date('2026-07-01T00:00:00Z'),
    ...overrides,
  };
}

/**
 * In-memory {@link ProfileRepository} fake. Mirrors the single-active-profile
 * invariant of the Postgres implementation.
 */
class FakeProfileRepository implements ProfileRepository {
  public profiles: Profile[] = [];
  private nextId = 100;

  public findAll(): Promise<readonly Profile[]> {
    return Promise.resolve(this.profiles);
  }

  public findActive(): Promise<Profile | null> {
    return Promise.resolve(this.profiles.find((profile) => profile.isActive) ?? null);
  }

  public findById(id: number): Promise<Profile | null> {
    return Promise.resolve(this.profiles.find((profile) => profile.id === id) ?? null);
  }

  public create(input: CreateProfileInput): Promise<Profile> {
    if (input.isActive === true) {
      this.deactivateAll();
    }
    const created = makeProfile({
      id: this.nextId,
      name: input.name,
      cvMd: input.cvMd ?? null,
      cvLanguage: input.cvLanguage ?? 'en',
      cvMdByLanguage: input.cvMdByLanguage ?? {},
      skills: input.skills ?? [],
      preferences: input.preferences ?? {},
      isActive: input.isActive ?? false,
    });
    this.nextId += 1;
    this.profiles.push(created);
    return Promise.resolve(created);
  }

  public update(id: number, input: UpdateProfileInput): Promise<Profile | null> {
    const index = this.profiles.findIndex((profile) => profile.id === id);
    if (index === -1) {
      return Promise.resolve(null);
    }
    if (input.isActive === true) {
      this.deactivateAll();
    }
    const current = this.profiles[index] as Profile;
    const updated = makeProfile({
      ...current,
      name: input.name ?? current.name,
      cvMd: input.cvMd === undefined ? current.cvMd : input.cvMd,
      cvLanguage: input.cvLanguage ?? current.cvLanguage,
      cvMdByLanguage: input.cvMdByLanguage ?? current.cvMdByLanguage,
      skills: input.skills ?? current.skills,
      preferences: input.preferences ?? current.preferences,
      isActive: input.isActive ?? current.isActive,
    });
    this.profiles[index] = updated;
    return Promise.resolve(updated);
  }

  public delete(id: number): Promise<boolean> {
    const before = this.profiles.length;
    this.profiles = this.profiles.filter((profile) => profile.id !== id);
    return Promise.resolve(this.profiles.length < before);
  }

  private deactivateAll(): void {
    this.profiles = this.profiles.map((profile) => makeProfile({ ...profile, isActive: false }));
  }
}

describe('ProfilesService', () => {
  let repository: FakeProfileRepository;
  let service: ProfilesService;

  beforeEach(() => {
    repository = new FakeProfileRepository();
    service = new ProfilesService(repository);
  });

  it('lists all profiles', async () => {
    repository.profiles = [makeProfile(), makeProfile({ id: 2, name: 'Alt', isActive: false })];

    const result = await service.list();

    expect(result).toHaveLength(2);
  });

  it('returns the active profile', async () => {
    repository.profiles = [makeProfile({ id: 1, isActive: false }), makeProfile({ id: 2 })];

    const profile = await service.active();

    expect(profile.id).toBe(2);
  });

  it('throws NotFoundException when no profile is active', async () => {
    repository.profiles = [makeProfile({ isActive: false })];

    await expect(service.active()).rejects.toBeInstanceOf(NotFoundException);
  });

  it('gets a profile by id', async () => {
    repository.profiles = [makeProfile({ id: 5, name: 'Five' })];

    const profile = await service.get(5);

    expect(profile.name).toBe('Five');
  });

  it('throws NotFoundException for a missing profile', async () => {
    await expect(service.get(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creating an active profile deactivates the others', async () => {
    repository.profiles = [makeProfile({ id: 1, isActive: true })];

    const created = await service.create({ name: 'New', isActive: true });

    expect(created.isActive).toBe(true);
    expect(repository.profiles.filter((profile) => profile.isActive)).toHaveLength(1);
  });

  it('updates a profile', async () => {
    repository.profiles = [makeProfile({ id: 1 })];

    const updated = await service.update(1, { name: 'Renamed' });

    expect(updated.name).toBe('Renamed');
  });

  it('keeps the legacy CV synchronized with the selected localized variant', async () => {
    repository.profiles = [
      makeProfile({
        id: 1,
        cvMd: 'English CV',
        cvLanguage: 'en',
        cvMdByLanguage: { en: 'English CV' },
      }),
    ];

    const updated = await service.update(1, {
      cvLanguage: 'uk',
      cvMdByLanguage: { en: 'English CV', uk: 'Українське CV' },
    });

    expect(updated.cvLanguage).toBe('uk');
    expect(updated.cvMd).toBe('Українське CV');
    expect(updated.cvMdByLanguage).toEqual({ en: 'English CV', uk: 'Українське CV' });
  });

  it('throws NotFoundException when updating a missing profile', async () => {
    await expect(service.update(404, { name: 'x' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a profile', async () => {
    repository.profiles = [makeProfile({ id: 1 })];

    await expect(service.remove(1)).resolves.toBe(true);
    expect(repository.profiles).toHaveLength(0);
  });
});
