/**
 * @module keyword-dictionaries/dictionary-filters
 *
 * Case-insensitive hard filters from enabled keyword dictionaries. Used by
 * the automation processing chain when persisting normalized jobs.
 */
import type { DictionaryKind, KeywordDictionary } from '../domain/keyword-dictionary.model';

/** Compiled, lower-cased filter terms for one source. */
export interface CompiledFilterRules {
  readonly excludeTerms: readonly string[];
  readonly excludedEmployers: readonly string[];
  readonly mustHaveTerms: readonly string[];
}

/**
 * Normalize a dictionary term for case-insensitive matching.
 *
 * @param term - Raw dictionary entry.
 * @returns Trimmed lower-case token.
 */
function normalizeTerm(term: string): string {
  return term.trim().toLowerCase();
}

/**
 * Return whether a dictionary applies to the given source slug.
 *
 * @param dictionary - Keyword dictionary row.
 * @param sourceSlug - Source slug being processed.
 */
function appliesTo(dictionary: KeywordDictionary, sourceSlug: string): boolean {
  return dictionary.appliesTo.length === 0 || dictionary.appliesTo.includes(sourceSlug);
}

/**
 * Type guard: dictionary items are a string list (non-alias kinds).
 *
 * `Array.isArray` alone narrows the `readonly string[] | Record<string, string>`
 * union to `any[]`, since its built-in predicate is not readonly-aware. Mirrors
 * the same guard in `apps/web/src/components/dictionaries/dict-editor.tsx`.
 *
 * @param items - Dictionary items payload.
 * @returns Whether `items` is a string list.
 */
function isStringItems(items: KeywordDictionary['items']): items is readonly string[] {
  return Array.isArray(items);
}

/**
 * Extract string list items from a dictionary row.
 *
 * @param dictionary - Keyword dictionary row.
 */
function listItems(dictionary: KeywordDictionary): readonly string[] {
  return isStringItems(dictionary.items) ? dictionary.items : [];
}

/**
 * Compile enabled filter dictionaries for one source.
 *
 * @param dictionaries - Enabled filter dictionaries.
 * @param sourceSlug - Source slug being processed.
 */
export function compileFilterRules(
  dictionaries: readonly KeywordDictionary[],
  sourceSlug: string,
): CompiledFilterRules {
  const excludeTerms: string[] = [];
  const excludedEmployers: string[] = [];
  const mustHaveTerms: string[] = [];
  const seenExclude = new Set<string>();
  const seenEmployers = new Set<string>();
  const seenMustHave = new Set<string>();

  for (const dictionary of dictionaries) {
    if (!dictionary.enabled || !appliesTo(dictionary, sourceSlug)) {
      continue;
    }
    for (const rawTerm of listItems(dictionary)) {
      const term = normalizeTerm(rawTerm);
      if (term.length === 0) {
        continue;
      }
      if (dictionary.kind === 'exclude' && !seenExclude.has(term)) {
        seenExclude.add(term);
        excludeTerms.push(term);
      } else if (dictionary.kind === 'exclude_employer' && !seenEmployers.has(term)) {
        seenEmployers.add(term);
        excludedEmployers.push(term);
      } else if (
        dictionary.kind === 'include' &&
        dictionary.slug === 'must-have' &&
        !seenMustHave.has(term)
      ) {
        seenMustHave.add(term);
        mustHaveTerms.push(term);
      }
    }
  }

  return { excludeTerms, excludedEmployers, mustHaveTerms };
}

/**
 * Return whether any term appears in haystack (case-insensitive substring).
 *
 * @param haystack - Text to scan.
 * @param terms - Lower-cased terms.
 */
export function textContainsAny(
  haystack: string | null | undefined,
  terms: readonly string[],
): boolean {
  if (haystack === null || haystack === undefined || terms.length === 0) {
    return false;
  }
  const lowered = haystack.toLowerCase();
  return terms.some((term) => lowered.includes(term));
}

/**
 * Return whether a company name matches any excluded employer token.
 *
 * @param company - Employer name.
 * @param employers - Lower-cased employer tokens.
 */
export function companyMatches(
  company: string | null | undefined,
  employers: readonly string[],
): boolean {
  if (company === null || company === undefined || employers.length === 0) {
    return false;
  }
  const lowered = company.trim().toLowerCase();
  return employers.some((employer) => lowered.includes(employer));
}

/** Normalized job fields used for dictionary filtering. */
export interface FilterableJob {
  readonly title: string;
  readonly company: string | null;
  readonly descriptionMd: string;
}

/**
 * Return whether a normalized job should be stored as `hidden`.
 *
 * @param job - Normalized job payload.
 * @param rules - Compiled filter rules for the source.
 */
export function shouldHideJob(job: FilterableJob, rules: CompiledFilterRules): boolean {
  if (companyMatches(job.company, rules.excludedEmployers)) {
    return true;
  }
  const haystack = `${job.title}\n${job.company ?? ''}\n${job.descriptionMd}`;
  if (textContainsAny(haystack, rules.excludeTerms)) {
    return true;
  }
  if (
    rules.mustHaveTerms.length > 0 &&
    !rules.mustHaveTerms.every((term) => textContainsAny(haystack, [term]))
  ) {
    return true;
  }
  return false;
}

/** Dictionary kinds consumed by {@link compileFilterRules}. */
export const FILTER_DICTIONARY_KINDS: readonly DictionaryKind[] = [
  'exclude',
  'exclude_employer',
  'include',
];
