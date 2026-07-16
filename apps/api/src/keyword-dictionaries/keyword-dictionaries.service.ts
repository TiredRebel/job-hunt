/**
 * @module keyword-dictionaries.service
 *
 * Application service for keyword dictionary CRUD.
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { KeywordDictionary } from '../domain/keyword-dictionary.model';
import {
  KEYWORD_DICTIONARY_REPOSITORY,
  type KeywordDictionaryRepository,
  type UpsertDictionaryInput,
} from '../application/ports/keyword-dictionary-repository.port';

/**
 * Application service for keyword dictionaries.
 */
@Injectable()
export class KeywordDictionariesService {
  /**
   * Application service for keyword dictionaries.
   *
   * @param repository - Keyword dictionary repository port.
   */
  public constructor(
    @Inject(KEYWORD_DICTIONARY_REPOSITORY)
    private readonly repository: KeywordDictionaryRepository,
  ) {}

  /**
   * List all dictionaries, optionally filtered by kind.
   *
   * @param kind - Optional kind filter.
   */
  public async list(kind?: KeywordDictionary['kind']): Promise<readonly KeywordDictionary[]> {
    return this.repository.findAll(kind);
  }

  /**
   * Get a dictionary by slug.
   *
   * @param slug - Dictionary slug.
   * @returns Dictionary.
   * @throws NotFoundException when not found.
   */
  public async get(slug: string): Promise<KeywordDictionary> {
    const dictionary = await this.repository.findBySlug(slug);
    if (dictionary === null) {
      throw new NotFoundException(`Dictionary ${slug} not found`);
    }
    return dictionary;
  }

  /**
   * Create a dictionary.
   *
   * @param input - Dictionary data.
   */
  public async create(input: UpsertDictionaryInput): Promise<KeywordDictionary> {
    return this.repository.create(input);
  }

  /**
   * Update a dictionary by slug.
   *
   * @param slug - Existing slug.
   * @param input - Partial update.
   * @returns Updated dictionary.
   * @throws NotFoundException when not found.
   */
  public async update(
    slug: string,
    input: Partial<Omit<UpsertDictionaryInput, 'slug' | 'kind'>>,
  ): Promise<KeywordDictionary> {
    const dictionary = await this.repository.update(slug, input);
    if (dictionary === null) {
      throw new NotFoundException(`Dictionary ${slug} not found`);
    }
    return dictionary;
  }

  /**
   * Delete a dictionary by slug.
   *
   * @param slug - Dictionary slug.
   * @returns `true` on success.
   * @throws NotFoundException when not found.
   */
  public async remove(slug: string): Promise<boolean> {
    return this.repository.delete(slug);
  }
}
