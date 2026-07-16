/**
 * @module keyword-dictionaries.service.spec
 *
 * Unit tests for {@link KeywordDictionariesService} using an in-memory
 * repository fake.
 */
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { DictionaryKind, KeywordDictionary } from '../domain/keyword-dictionary.model';
import type {
  KeywordDictionaryRepository,
  UpsertDictionaryInput,
} from '../application/ports/keyword-dictionary-repository.port';
import { KeywordDictionariesService } from './keyword-dictionaries.service';

/**
 * Build a dictionary fixture with sensible defaults.
 *
 * @param overrides - Fields to override.
 * @returns Dictionary fixture.
 */
function makeDictionary(overrides: Partial<KeywordDictionary> = {}): KeywordDictionary {
  return {
    id: 1,
    slug: 'ts-search',
    name: 'TypeScript search terms',
    kind: 'search',
    items: ['typescript', 'node.js'],
    appliesTo: [],
    enabled: true,
    createdAt: new Date('2026-07-01T00:00:00Z'),
    updatedAt: new Date('2026-07-01T00:00:00Z'),
    ...overrides,
  };
}

/**
 * In-memory {@link KeywordDictionaryRepository} fake.
 */
class FakeKeywordDictionaryRepository implements KeywordDictionaryRepository {
  public dictionaries: KeywordDictionary[] = [];
  private nextId = 100;

  public findAll(kind?: DictionaryKind): Promise<readonly KeywordDictionary[]> {
    return Promise.resolve(
      kind === undefined
        ? this.dictionaries
        : this.dictionaries.filter((dictionary) => dictionary.kind === kind),
    );
  }

  public findBySlug(slug: string): Promise<KeywordDictionary | null> {
    return Promise.resolve(
      this.dictionaries.find((dictionary) => dictionary.slug === slug) ?? null,
    );
  }

  public create(input: UpsertDictionaryInput): Promise<KeywordDictionary> {
    const created = makeDictionary({
      id: this.nextId,
      slug: input.slug,
      name: input.name,
      kind: input.kind,
      items: input.items,
      appliesTo: input.appliesTo ?? [],
      enabled: input.enabled ?? true,
    });
    this.nextId += 1;
    this.dictionaries.push(created);
    return Promise.resolve(created);
  }

  public update(
    slug: string,
    input: Partial<Omit<UpsertDictionaryInput, 'slug' | 'kind'>>,
  ): Promise<KeywordDictionary | null> {
    const index = this.dictionaries.findIndex((dictionary) => dictionary.slug === slug);
    if (index === -1) {
      return Promise.resolve(null);
    }
    const current = this.dictionaries[index] as KeywordDictionary;
    const updated = makeDictionary({
      ...current,
      name: input.name ?? current.name,
      items: input.items ?? current.items,
      appliesTo: input.appliesTo ?? current.appliesTo,
      enabled: input.enabled ?? current.enabled,
    });
    this.dictionaries[index] = updated;
    return Promise.resolve(updated);
  }

  public delete(slug: string): Promise<boolean> {
    const before = this.dictionaries.length;
    this.dictionaries = this.dictionaries.filter((dictionary) => dictionary.slug !== slug);
    return Promise.resolve(this.dictionaries.length < before);
  }
}

describe('KeywordDictionariesService', () => {
  let repository: FakeKeywordDictionaryRepository;
  let service: KeywordDictionariesService;

  beforeEach(() => {
    repository = new FakeKeywordDictionaryRepository();
    service = new KeywordDictionariesService(repository);
  });

  it('lists all dictionaries', async () => {
    repository.dictionaries = [
      makeDictionary(),
      makeDictionary({ id: 2, slug: 'stop', kind: 'exclude' }),
    ];

    const result = await service.list();

    expect(result).toHaveLength(2);
  });

  it('filters dictionaries by kind', async () => {
    repository.dictionaries = [
      makeDictionary(),
      makeDictionary({ id: 2, slug: 'stop', kind: 'exclude' }),
    ];

    const result = await service.list('exclude');

    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe('stop');
  });

  it('gets a dictionary by slug', async () => {
    repository.dictionaries = [makeDictionary()];

    const dictionary = await service.get('ts-search');

    expect(dictionary.name).toBe('TypeScript search terms');
  });

  it('throws NotFoundException for a missing slug', async () => {
    await expect(service.get('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a dictionary', async () => {
    const created = await service.create({
      slug: 'aliases',
      name: 'Title aliases',
      kind: 'alias',
      items: { 'ts dev': 'typescript developer' },
    });

    expect(created.slug).toBe('aliases');
    expect(repository.dictionaries).toHaveLength(1);
  });

  it('updates a dictionary by slug', async () => {
    repository.dictionaries = [makeDictionary()];

    const updated = await service.update('ts-search', { enabled: false });

    expect(updated.enabled).toBe(false);
  });

  it('throws NotFoundException when updating a missing dictionary', async () => {
    await expect(service.update('nope', { enabled: false })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes a dictionary by slug', async () => {
    repository.dictionaries = [makeDictionary()];

    await expect(service.remove('ts-search')).resolves.toBe(true);
    expect(repository.dictionaries).toHaveLength(0);
  });
});
