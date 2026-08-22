/**
 * @module keyword-dictionary.model
 *
 * Editable keyword dictionary entity from `core.keyword_dictionaries`.
 * Scrapers and LLM matcher consume these per-run.
 */

/** Allowed dictionary kind values. */
export type DictionaryKind = 'search' | 'include' | 'exclude' | 'exclude_employer' | 'alias';

/**
 * Keyword dictionary read model.
 */
export interface KeywordDictionary {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly kind: DictionaryKind;
  /** Array of strings for list kinds; record of aliases when kind is `alias`. */
  readonly items: readonly string[] | Readonly<Record<string, string>>;
  /** Disabled list values, or disabled alias keys. */
  readonly disabledItems: readonly string[];
  /** Source slugs this dictionary applies to; empty means all sources. */
  readonly appliesTo: readonly string[];
  readonly enabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
