'use client';

/**
 * @module components/dictionaries/dict-editor
 *
 * Keyword-dictionary editor grouped by API kind (`search` / `include` /
 * `exclude` / `alias`). Items are edited as tags (or key→value for aliases);
 * enable is dictionary-level (the API has no per-item enabled flag — UI_DESIGN
 * "per item" maps to per-dictionary here).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ApiError } from '@/lib/api/client';
import {
  createDictionary,
  deleteDictionary,
  listDictionaries,
  updateDictionary,
  type DictionaryKind,
  type KeywordDictionary,
} from '@/lib/api/dictionaries';
import { queryKeys } from '@/lib/api/query-keys';
import { cn } from '@/lib/utils';

/** Display order for dictionary kind sections. */
const KIND_ORDER: readonly DictionaryKind[] = ['search', 'include', 'exclude', 'alias'];

/**
 * Type guard: dictionary items are a string list (non-alias kinds).
 *
 * @param items - Dictionary items payload.
 * @returns Whether `items` is a string array.
 */
function isStringItems(items: KeywordDictionary['items']): items is string[] {
  return Array.isArray(items);
}

/**
 * Resolve a localized kind section title.
 *
 * @param t - Translator scoped to `dictionaries`.
 * @param kind - Dictionary kind.
 * @returns Localized title.
 */
function kindTitle(
  t: ReturnType<typeof useTranslations<'dictionaries'>>,
  kind: DictionaryKind,
): string {
  switch (kind) {
    case 'search':
      return t('kindSearch');
    case 'include':
      return t('kindInclude');
    case 'exclude':
      return t('kindExclude');
    case 'alias':
      return t('kindAlias');
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

/** Props for one dictionary card. */
interface DictionaryCardProps {
  readonly dictionary: KeywordDictionary;
}

/**
 * Editable card for a single keyword dictionary.
 *
 * @param props - Card props.
 * @returns The card element.
 */
function DictionaryCard({ dictionary }: DictionaryCardProps) {
  const t = useTranslations('dictionaries');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [aliasKey, setAliasKey] = useState('');
  const [aliasValue, setAliasValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.dictionaries.all });
  };

  const updateMutation = useMutation({
    mutationFn: (body: Parameters<typeof updateDictionary>[1]) =>
      updateDictionary(dictionary.slug, body),
    onSuccess: async () => {
      setApiError(null);
      await invalidate();
    },
    onError: (error) => {
      setApiError(error instanceof ApiError ? error.message : t('saveError'));
      toast.error(t('saveError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDictionary(dictionary.slug),
    onSuccess: async () => {
      await invalidate();
      toast.success(t('deleted'));
    },
    onError: () => toast.error(t('deleteError')),
  });

  const stringItems = isStringItems(dictionary.items) ? dictionary.items : [];
  const aliasItems = !isStringItems(dictionary.items) ? dictionary.items : {};

  const addStringItem = (): void => {
    const next = draft.trim();
    if (!next || stringItems.includes(next)) {
      return;
    }
    setDraft('');
    updateMutation.mutate({ items: [...stringItems, next] });
  };

  const removeStringItem = (item: string): void => {
    updateMutation.mutate({ items: stringItems.filter((entry) => entry !== item) });
  };

  const addAlias = (): void => {
    const key = aliasKey.trim();
    const value = aliasValue.trim();
    if (!key || !value) {
      return;
    }
    setAliasKey('');
    setAliasValue('');
    updateMutation.mutate({ items: { ...aliasItems, [key]: value } });
  };

  const removeAlias = (key: string): void => {
    const next = { ...aliasItems };
    delete next[key];
    updateMutation.mutate({ items: next });
  };

  return (
    <article
      className={cn(
        'rounded-[var(--radius-card)] border border-border bg-surface p-4',
        !dictionary.enabled && 'opacity-60',
      )}
    >
      <header className="mb-3 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">{dictionary.name}</p>
          <p className="font-mono text-xs text-text-muted">{dictionary.slug}</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-text-muted">
          <Switch
            checked={dictionary.enabled}
            disabled={updateMutation.isPending}
            onCheckedChange={(checked) => updateMutation.mutate({ enabled: checked })}
            aria-label={t('enableLabel', { name: dictionary.name })}
          />
          {dictionary.enabled ? t('enabled') : t('disabled')}
        </label>
        {confirmDelete ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
            onBlur={() => setConfirmDelete(false)}
          >
            {tCommon('confirm')}
          </Button>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>
            {tCommon('delete')}
          </Button>
        )}
      </header>

      {apiError && <p className="mb-2 text-xs text-destructive">{apiError}</p>}

      {dictionary.kind === 'alias' ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(aliasItems).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded-[calc(var(--radius-control)-2px)] bg-surface-elevated px-1.5 py-0.5 text-xs text-text-primary"
              >
                <span className="font-mono">
                  {key} → {value}
                </span>
                <button
                  type="button"
                  onClick={() => removeAlias(key)}
                  aria-label={`${tCommon('delete')} ${key}`}
                  className="text-text-muted hover:text-text-primary"
                >
                  <X aria-hidden="true" size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              value={aliasKey}
              onChange={(event) => setAliasKey(event.target.value)}
              placeholder={t('aliasKeyPlaceholder')}
              className="h-8 w-36"
            />
            <Input
              value={aliasValue}
              onChange={(event) => setAliasValue(event.target.value)}
              placeholder={t('aliasValuePlaceholder')}
              className="h-8 w-36"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addAlias();
                }
              }}
            />
            <Button type="button" size="sm" onClick={addAlias} disabled={updateMutation.isPending}>
              {t('add')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {stringItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-[calc(var(--radius-control)-2px)] bg-surface-elevated px-1.5 py-0.5 text-xs text-text-primary"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeStringItem(item)}
                  aria-label={`${tCommon('delete')} ${item}`}
                  className="text-text-muted hover:text-text-primary"
                >
                  <X aria-hidden="true" size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t('addPlaceholder')}
              className="h-8"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addStringItem();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={addStringItem}
              disabled={updateMutation.isPending}
            >
              {t('add')}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

/**
 * Dictionaries admin page body — sections per kind with inline CRUD.
 *
 * @returns The dictionaries page content.
 */
export function DictionariesPageClient() {
  const t = useTranslations('dictionaries');
  const queryClient = useQueryClient();
  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<DictionaryKind>('search');

  const dictionariesQuery = useQuery({
    queryKey: queryKeys.dictionaries.all,
    queryFn: ({ signal }) => listDictionaries(undefined, signal),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createDictionary({
        slug: newSlug.trim(),
        name: newName.trim() || newSlug.trim(),
        kind: newKind,
        items: newKind === 'alias' ? {} : [],
        enabled: true,
      }),
    onSuccess: async () => {
      setNewSlug('');
      setNewName('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.dictionaries.all });
      toast.success(t('created'));
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : t('createError'));
    },
  });

  const byKind = useMemo(() => {
    const map = new Map<DictionaryKind, KeywordDictionary[]>();
    for (const kind of KIND_ORDER) {
      map.set(kind, []);
    }
    for (const dictionary of dictionariesQuery.data ?? []) {
      const list = map.get(dictionary.kind) ?? [];
      list.push(dictionary);
      map.set(dictionary.kind, list);
    }
    return map;
  }, [dictionariesQuery.data]);

  if (dictionariesQuery.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (dictionariesQuery.isError) {
    return <p className="text-sm text-destructive">{t('loadError')}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">{t('title')}</h1>
        <p className="mt-1 text-sm text-text-muted">{t('subtitle')}</p>
      </div>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-text-primary">{t('createTitle')}</h2>
        <div className="flex flex-wrap gap-2">
          <Input
            value={newSlug}
            onChange={(event) => setNewSlug(event.target.value)}
            placeholder={t('slugPlaceholder')}
            className="h-8 w-40"
          />
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder={t('namePlaceholder')}
            className="h-8 w-48"
          />
          <select
            value={newKind}
            onChange={(event) => setNewKind(event.target.value as DictionaryKind)}
            className="h-8 rounded-[var(--radius-control)] border border-border bg-surface px-2 text-sm text-text-primary"
            aria-label={t('kindLabel')}
          >
            {KIND_ORDER.map((kind) => (
              <option key={kind} value={kind}>
                {kindTitle(t, kind)}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            disabled={!newSlug.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {t('create')}
          </Button>
        </div>
      </section>

      {KIND_ORDER.map((kind) => {
        const dictionaries = byKind.get(kind) ?? [];
        return (
          <section key={kind} className="space-y-3">
            <h2 className="text-sm font-semibold text-text-primary">{kindTitle(t, kind)}</h2>
            {dictionaries.length === 0 ? (
              <p className="text-sm text-text-muted">{t('emptyKind')}</p>
            ) : (
              dictionaries.map((dictionary) => (
                <DictionaryCard key={dictionary.slug} dictionary={dictionary} />
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}
