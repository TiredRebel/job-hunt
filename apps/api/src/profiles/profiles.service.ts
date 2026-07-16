/**
 * @module profiles.service
 *
 * Application service for profile CRUD and active-profile lookup.
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { Profile } from '../domain/profile.model';
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
    return this.repository.create(input);
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
    const profile = await this.repository.update(id, input);
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
