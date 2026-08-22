/**
 * @module profile-repository.port
 *
 * Port for CRUD on user profiles. Only one profile can be active at a time;
 * activation is handled inside the repository transaction.
 */
import type {
  CvLanguage,
  CvMarkdownByLanguage,
  Profile,
  ProfilePreferences,
} from '../../domain/profile.model';

/**
 * Data required to create a profile.
 */
export interface CreateProfileInput {
  readonly name: string;
  readonly cvMd?: string;
  readonly cvLanguage?: CvLanguage;
  readonly cvMdByLanguage?: CvMarkdownByLanguage;
  readonly skills?: readonly string[];
  readonly preferences?: ProfilePreferences;
  readonly isActive?: boolean;
}

/**
 * Data accepted for a profile update.
 */
export interface UpdateProfileInput {
  readonly name?: string;
  readonly cvMd?: string | null;
  readonly cvLanguage?: CvLanguage;
  readonly cvMdByLanguage?: CvMarkdownByLanguage;
  readonly skills?: readonly string[];
  readonly preferences?: ProfilePreferences;
  readonly isActive?: boolean;
}

/**
 * Repository contract for profiles.
 */
export interface ProfileRepository {
  /**
   * List all profiles.
   */
  findAll(): Promise<readonly Profile[]>;

  /**
   * Get the active profile.
   */
  findActive(): Promise<Profile | null>;

  /**
   * Find a profile by id.
   *
   * @param id - Profile id.
   */
  findById(id: number): Promise<Profile | null>;

  /**
   * Create a profile. If `isActive` is true, deactivates all others.
   *
   * @param input - Profile data.
   */
  create(input: CreateProfileInput): Promise<Profile>;

  /**
   * Update a profile. If `isActive` is true, deactivates all others.
   *
   * @param id - Profile id.
   * @param input - Partial update.
   * @returns Updated profile or `null`.
   */
  update(id: number, input: UpdateProfileInput): Promise<Profile | null>;

  /**
   * Delete a profile by id.
   *
   * @param id - Profile id.
   * @returns `true` if deleted.
   */
  delete(id: number): Promise<boolean>;
}

/**
 * Injection token for the profile repository port.
 */
export const PROFILE_REPOSITORY = Symbol('PROFILE_REPOSITORY');
