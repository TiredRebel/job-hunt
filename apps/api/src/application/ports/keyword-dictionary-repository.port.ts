/**
 * @module keyword-dictionary-repository.port
 *
 * Port for CRUD on editable keyword dictionaries in `core.keyword_dictionaries`.
 */
import type { DictionaryKind, KeywordDictionary } from '../../domain/keyword-dictionary.model';

/**
 * Data required to create or replace a dictionary.
 */
export interface UpsertDictionaryInput {
  readonly slug: string;
  readonly name: string;
  readonly kind: DictionaryKind;
  readonly items: readonly string[] | Readonly<Record<string, string>>;
  readonly disabledItems?: readonly string[];
  readonly appliesTo?: readonly string[];
  readonly enabled?: boolean;
}

/**
 * Repository contract for keyword dictionaries.
 */
export interface KeywordDictionaryRepository {
  /**
   * List all dictionaries, optionally filtered by kind.
   *
   * @param kind - Optional kind filter.
   * @returns All matching dictionaries.
   */
  findAll(kind?: DictionaryKind): Promise<readonly KeywordDictionary[]>;

  /**
   * Find one dictionary by slug.
   *
   * @param slug - Unique slug.
   * @returns The dictionary or `null`.
   */
  findBySlug(slug: string): Promise<KeywordDictionary | null>;

  /**
   * Create a new dictionary.
   *
   * @param input - Dictionary data.
   * @returns Created dictionary.
   * @throws ConflictError if slug already exists.
   */
  create(input: UpsertDictionaryInput): Promise<KeywordDictionary>;

  /**
   * Update an existing dictionary by slug.
   *
   * @param slug - Existing slug.
   * @param input - Partial update.
   * @returns Updated dictionary or `null`.
   */
  update(
    slug: string,
    input: Partial<Omit<UpsertDictionaryInput, 'slug' | 'kind'>>,
  ): Promise<KeywordDictionary | null>;

  /**
   * Delete a dictionary by slug.
   *
   * @param slug - Unique slug.
   * @returns `true` if deleted.
   */
  delete(slug: string): Promise<boolean>;
}

/**
 * Injection token for the keyword dictionary repository port.
 */
export const KEYWORD_DICTIONARY_REPOSITORY = Symbol('KEYWORD_DICTIONARY_REPOSITORY');
