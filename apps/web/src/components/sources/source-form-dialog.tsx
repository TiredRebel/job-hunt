'use client';

/**
 * @module components/sources/source-form-dialog
 *
 * Create/edit dialog for one source (sources-admin spec "Create a source" /
 * "Edit a source"). Slug is only editable in create mode — it is the
 * scraper's adapter-registry key and immutable afterward.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import {
  createSource,
  updateSource,
  type Source,
  type SourceFetchStrategy,
} from '@/lib/api/sources';
import { SLUG_PATTERN } from '@/lib/slug';

const FETCH_STRATEGIES: readonly SourceFetchStrategy[] = ['api', 'crawl4ai', 'agent-browser'];

/** Props for {@link SourceFormDialog}. */
export interface SourceFormDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** `undefined` opens create mode; a source opens edit mode (slug locked). */
  readonly source?: Source | undefined;
  /**
   * Registered scraper-adapter slugs, for the "no adapter yet" warning.
   * `undefined` while loading or unavailable — the warning is simply
   * omitted, matching the sources list's own degrade-gracefully behavior.
   */
  readonly adapterSlugs: readonly string[] | undefined;
}

interface FormState {
  readonly slug: string;
  readonly name: string;
  readonly baseUrl: string;
  readonly fetchStrategy: SourceFetchStrategy;
  readonly configText: string;
  readonly enabled: boolean;
}

function initialState(source: Source | undefined): FormState {
  if (source) {
    return {
      slug: source.slug,
      name: source.name,
      baseUrl: source.baseUrl,
      fetchStrategy: source.fetchStrategy,
      configText: JSON.stringify(source.config, null, 2),
      enabled: source.enabled,
    };
  }
  return {
    slug: '',
    name: '',
    baseUrl: '',
    fetchStrategy: 'api',
    configText: '{}',
    enabled: true,
  };
}

/**
 * Create/edit dialog for a source. Only mounts {@link SourceFormBody} while
 * open, keyed by the source's slug (or `'create'`) — a fresh mount gives
 * fresh form state for free, no reset-on-prop-change effect needed.
 *
 * @param props - Dialog props.
 * @returns The dialog element.
 */
export function SourceFormDialog({
  open,
  onOpenChange,
  source,
  adapterSlugs,
}: SourceFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        {open && (
          <SourceFormBody
            key={source?.slug ?? 'create'}
            source={source}
            adapterSlugs={adapterSlugs}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Props for {@link SourceFormBody}. */
interface SourceFormBodyProps {
  readonly source: Source | undefined;
  readonly adapterSlugs: readonly string[] | undefined;
  readonly onOpenChange: (open: boolean) => void;
}

/**
 * The form itself — a fresh instance per open (see {@link SourceFormDialog}),
 * so all state below initializes correctly with no synchronization effect.
 *
 * @param props - Form body props.
 * @returns The form element.
 */
function SourceFormBody({ source, adapterSlugs, onOpenChange }: SourceFormBodyProps) {
  const t = useTranslations('sources');
  const queryClient = useQueryClient();
  const mode = source ? 'edit' : 'create';
  const [form, setForm] = useState<FormState>(() => initialState(source));
  const [slugConflict, setSlugConflict] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const config = JSON.parse(form.configText) as Record<string, unknown>;
      if (mode === 'create') {
        return createSource({
          slug: form.slug.trim(),
          name: form.name.trim(),
          baseUrl: form.baseUrl.trim(),
          fetchStrategy: form.fetchStrategy,
          config,
          enabled: form.enabled,
        });
      }
      return updateSource(form.slug, {
        name: form.name.trim(),
        baseUrl: form.baseUrl.trim(),
        fetchStrategy: form.fetchStrategy,
        config,
        enabled: form.enabled,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sources.all });
      toast.success(mode === 'create' ? t('createSuccess') : t('updateSuccess'));
      onOpenChange(false);
    },
    onError: (error) => {
      if (mode === 'create' && error instanceof ApiError && error.status === 409) {
        setSlugConflict(t('formSlugConflict'));
        return;
      }
      toast.error(mode === 'create' ? t('createError') : t('updateError'));
    },
  });

  const trimmedSlug = form.slug.trim();
  const hasNoAdapter =
    adapterSlugs !== undefined && trimmedSlug !== '' && !adapterSlugs.includes(trimmedSlug);
  const slugInvalid = mode === 'create' && form.slug !== '' && !SLUG_PATTERN.test(form.slug);

  const validateConfig = (text: string): void => {
    try {
      JSON.parse(text);
      setConfigError(null);
    } catch {
      setConfigError(t('formConfigError'));
    }
  };

  const canSubmit =
    form.name.trim() !== '' &&
    form.baseUrl.trim() !== '' &&
    (mode === 'edit' || (trimmedSlug !== '' && !slugInvalid)) &&
    configError === null &&
    !mutation.isPending;

  return (
    <>
      <DialogTitle>{mode === 'create' ? t('formTitleCreate') : t('formTitleEdit')}</DialogTitle>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSlugConflict(null);
          if (canSubmit) {
            mutation.mutate();
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="source-slug">{t('formSlug')}</Label>
          <Input
            id="source-slug"
            value={form.slug}
            disabled={mode === 'edit'}
            onChange={(event) => {
              setForm({ ...form, slug: event.target.value });
              setSlugConflict(null);
            }}
            placeholder={t('formSlugPlaceholder')}
          />
          <p className="text-xs text-text-muted">{t('formSlugHint')}</p>
          {slugInvalid && <p className="text-xs text-destructive">{t('formSlugPatternError')}</p>}
          {slugConflict && <p className="text-xs text-destructive">{slugConflict}</p>}
          {hasNoAdapter && <p className="text-xs text-warning">{t('formNoAdapter')}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="source-name">{t('formName')}</Label>
          <Input
            id="source-name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="source-base-url">{t('formBaseUrl')}</Label>
          <Input
            id="source-base-url"
            type="url"
            value={form.baseUrl}
            onChange={(event) => setForm({ ...form, baseUrl: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('formFetchStrategy')}</Label>
          <Select
            value={form.fetchStrategy}
            onValueChange={(value) =>
              setForm({ ...form, fetchStrategy: value as SourceFetchStrategy })
            }
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FETCH_STRATEGIES.map((strategy) => (
                <SelectItem key={strategy} value={strategy}>
                  {strategy}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source-config">{t('formConfig')}</Label>
          <Textarea
            id="source-config"
            value={form.configText}
            onChange={(event) => {
              setForm({ ...form, configText: event.target.value });
              validateConfig(event.target.value);
            }}
            className="min-h-32 font-mono text-xs"
          />
          {configError && <p className="text-xs text-destructive">{configError}</p>}
        </div>

        <label className="flex items-center gap-2 text-sm text-text-primary">
          <Switch
            checked={form.enabled}
            onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
          />
          {t('formEnabled')}
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('formCancel')}
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {mode === 'create' ? t('formCreate') : t('formSave')}
          </Button>
        </div>
      </form>
    </>
  );
}
