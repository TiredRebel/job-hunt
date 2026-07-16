/**
 * @module profile.model
 *
 * User profile entity stored in `core.profiles`. Exactly one profile is active
 * at a time; the API gateway reads it for match display and cover-letter
 * actions.
 */

import type { RemoteType, Seniority } from './job.model';

/**
 * Serialized preferences JSONB shape from `core.profiles.preferences`.
 */
export interface ProfilePreferences {
  /** Desired minimum salary in local currency. */
  readonly desiredSalaryMin?: number;
  /** Desired maximum salary in local currency. */
  readonly desiredSalaryMax?: number;
  /** Preferred remote arrangement. */
  readonly remote?: readonly RemoteType[];
  /** Preferred locations. */
  readonly locations?: readonly string[];
  /** Seniorities the user is open to. */
  readonly seniorities?: readonly Seniority[];
  /** Stop-words for filtering. */
  readonly stopWords?: readonly string[];
}

/**
 * User profile read model.
 */
export interface Profile {
  readonly id: number;
  readonly name: string;
  readonly cvMd: string | null;
  readonly skills: readonly string[];
  readonly preferences: ProfilePreferences;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
