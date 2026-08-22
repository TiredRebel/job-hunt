/**
 * @module profiles.service
 *
 * Application service for profile CRUD and active-profile lookup.
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { CvLanguage, CvMarkdownByLanguage, Profile } from '../domain/profile.model';
import {
  PROFILE_REPOSITORY,
  type CreateProfileInput,
  type ProfileRepository,
  type UpdateProfileInput,
} from '../application/ports/profile-repository.port';

/**
 * Application service for profiles.
 */
@Injectable()
export class ProfilesService {
  /**
   * Application service for profiles.
   *
   * @param repository - Profile repository port.
   */
  public constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly repository: ProfileRepository,
  ) {}

  /**
   * List all profiles.
   */
  public async list(): Promise<readonly Profile[]> {
    return this.repository.findAll();
  }

  /**
   * Get the active profile.
   *
   * @returns Active profile.
   * @throws NotFoundException when no active profile exists.
   */
  public async active(): Promise<Profile> {
    const profile = await this.repository.findActive();
    if (profile === null) {
      throw new NotFoundException('No active profile found');
    }
    return profile;
  }

  /**
   * Get a profile by id.
   *
   * @param id - Profile id.
   * @returns Profile.
   * @throws NotFoundException when not found.
   */
  public async get(id: number): Promise<Profile> {
    const profile = await this.repository.findById(id);
    if (profile === null) {
      throw new NotFoundException(`Profile ${id.toString()} not found`);
    }
    return profile;
  }

  /**
   * Create a profile.
   *
   * @param input - Profile data.
   */
  public async create(input: CreateProfileInput): Promise<Profile> {
    const cvLanguage = input.cvLanguage ?? 'en';
    const suppliedVariants: CvMarkdownByLanguage =
      input.cvMdByLanguage ?? (input.cvMd === undefined ? {} : { en: input.cvMd });
    const cvMd = suppliedVariants[cvLanguage] ?? input.cvMd ?? '';
    const cvMdByLanguage: CvMarkdownByLanguage = {
      ...suppliedVariants,
      [cvLanguage]: cvMd,
    };
    return this.repository.create({ ...input, cvLanguage, cvMdByLanguage, cvMd });
  }

  /**
   * Update a profile.
   *
   * @param id - Profile id.
   * @param input - Partial update.
   * @returns Updated profile.
   * @throws NotFoundException when not found.
   */
  public async update(id: number, input: UpdateProfileInput): Promise<Profile> {
    const current = await this.repository.findById(id);
    if (current === null) {
      throw new NotFoundException(`Profile ${id.toString()} not found`);
    }
    const cvLanguage: CvLanguage = input.cvLanguage ?? current.cvLanguage;
    const mergedVariants: CvMarkdownByLanguage = {
      ...current.cvMdByLanguage,
      ...input.cvMdByLanguage,
      ...(input.cvMd === undefined ? {} : { [cvLanguage]: input.cvMd }),
    };
    const cvMd = mergedVariants[cvLanguage] ?? '';
    const cvMdByLanguage: CvMarkdownByLanguage = {
      ...mergedVariants,
      [cvLanguage]: cvMd,
    };
    const normalized = {
      ...input,
      cvLanguage,
      cvMdByLanguage,
      cvMd,
    };
    const profile = await this.repository.update(id, normalized);
    if (profile === null) {
      throw new NotFoundException(`Profile ${id.toString()} not found`);
    }
    return profile;
  }

  /**
   * Delete a profile.
   *
   * @param id - Profile id.
   * @returns `true` on success.
   * @throws NotFoundException when not found.
   */
  public async remove(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }
}
