/**
 * @module keyword-dictionaries.service
 *
 * Application service for keyword dictionary CRUD.
 */
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { DictionaryKind, KeywordDictionary } from '../domain/keyword-dictionary.model';
import {
  KEYWORD_DICTIONARY_REPOSITORY,
  type KeywordDictionaryRepository,
  type UpsertDictionaryInput,
} from '../application/ports/keyword-dictionary-repository.port';

/**
 * Reject an `items` payload whose shape contradicts the dictionary's kind.
 *
 * `alias` dictionaries hold a record; every other kind holds a list. The DTO
 * only proves the payload is one of the two, and PATCH never carries `kind` —
 * so the pairing can only be checked here, against the stored row. An object
 * on a `search` dictionary would otherwise reach the scraper, which iterates
 * it and silently searches for the alias *keys*.
 *
 * @param kind - Kind of the dictionary being written.
 * @param items - Items payload.
 * @throws BadRequestException when shape and kind disagree.
 */
function assertItemsMatchKind(kind: DictionaryKind, items: UpsertDictionaryInput['items']): void {
  const isList = Array.isArray(items);
  if (kind === 'alias' && isList) {
    throw new BadRequestException('items must be a record of aliases when kind is `alias`');
  }
  if (kind !== 'alias' && !isList) {
    throw new BadRequestException(`items must be an array of strings when kind is \`${kind}\``);
  }
}

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
    assertItemsMatchKind(input.kind, input.items);
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
    if (input.items !== undefined) {
      assertItemsMatchKind((await this.get(slug)).kind, input.items);
    }
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
