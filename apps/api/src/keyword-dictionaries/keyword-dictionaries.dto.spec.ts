/**
 * @module keyword-dictionaries.dto.spec
 *
 * Runs the app's real global `ValidationPipe` config (see `main.ts`) against
 * the dictionary DTOs. A bad `items` payload used to reach the scraper, which
 * calls `.strip()` on every entry — a non-string wedged the whole run.
 */
import { ValidationPipe } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { CreateKeywordDictionaryDto, UpdateKeywordDictionaryDto } from './keyword-dictionaries.dto';

const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

/**
 * Run a payload through the pipe for one DTO.
 *
 * @param metatype - DTO class to validate against.
 * @param value - Request body.
 * @returns The transformed body.
 */
async function validate(metatype: unknown, value: unknown): Promise<unknown> {
  return pipe.transform(value, { type: 'body', metatype: metatype as never });
}

describe('keyword dictionary DTO items validation', () => {
  it('accepts a string list on create', async () => {
    await expect(
      validate(CreateKeywordDictionaryDto, {
        slug: 'search-terms',
        name: 'Search terms',
        kind: 'search',
        items: ['python', 'fastapi'],
      }),
    ).resolves.toMatchObject({ items: ['python', 'fastapi'] });
  });

  it('accepts an alias record on create', async () => {
    await expect(
      validate(CreateKeywordDictionaryDto, {
        slug: 'tag-aliases',
        name: 'Tag aliases',
        kind: 'alias',
        items: { js: 'javascript' },
      }),
    ).resolves.toMatchObject({ items: { js: 'javascript' } });
  });

  it('rejects non-string entries on create', async () => {
    await expect(
      validate(CreateKeywordDictionaryDto, {
        slug: 'x',
        name: 'X',
        kind: 'search',
        items: [1, 2],
      }),
    ).rejects.toThrow();
  });

  it('still requires items on create', async () => {
    await expect(
      validate(CreateKeywordDictionaryDto, { slug: 'x', name: 'X', kind: 'search' }),
    ).rejects.toThrow();
  });

  it('accepts a string list on update', async () => {
    await expect(validate(UpdateKeywordDictionaryDto, { items: ['go'] })).resolves.toMatchObject({
      items: ['go'],
    });
  });

  it('rejects non-string entries on update', async () => {
    await expect(validate(UpdateKeywordDictionaryDto, { items: [1, 2] })).rejects.toThrow();
    await expect(validate(UpdateKeywordDictionaryDto, { items: { a: 1 } })).rejects.toThrow();
  });

  it('accepts only string disabled item identifiers', async () => {
    await expect(
      validate(UpdateKeywordDictionaryDto, { disabledItems: ['react'] }),
    ).resolves.toMatchObject({ disabledItems: ['react'] });
    await expect(validate(UpdateKeywordDictionaryDto, { disabledItems: [1] })).rejects.toThrow();
  });
});
