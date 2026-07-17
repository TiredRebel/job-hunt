'use client';

/**
 * @module components/llm/provider-config-dialog
 *
 * Configure dialog for an existing LLM provider (llm-admin-ui spec "Provider
 * configuration"): connection fields (base URL, API key env-var name),
 * default model, and per-pipeline overrides. `slug`/`kind` are immutable and
 * not shown here — see `ProviderFormDialog` for creation.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  listLlmModels,
  updateLlmProvider,
  type LlmProvider,
  type UpdateLlmProviderBody,
} from '@/lib/api/llm';
import { queryKeys } from '@/lib/api/query-keys';

const PIPELINE_KEYS = ['normalize', 'tag', 'match', 'cover_letter'] as const;
type PipelineKey = (typeof PIPELINE_KEYS)[number];
const MAX_MODEL_SUGGESTIONS = 200;

/** i18n message key for each pipeline's label — kept static for next-intl. */
const PIPELINE_LABEL_KEYS: Record<PipelineKey, string> = {
  normalize: 'pipelineNormalize',
  tag: 'pipelineTag',
  match: 'pipelineMatch',
  cover_letter: 'pipelineCoverLetter',
};

/** Props for {@link ProviderConfigDialog}. */
export interface ProviderConfigDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** The provider being configured. `undefined` while closed/unresolved. */
  readonly provider: LlmProvider | undefined;
}

interface OverrideState {
  readonly model: string;
  readonly temperature: string;
}

interface FormState {
  readonly baseUrl: string;
  readonly apiKeyEnv: string;
  readonly defaultModel: string;
  readonly overrides: Record<PipelineKey, OverrideState>;
}

function readOverride(raw: unknown): OverrideState {
  if (!raw || typeof raw !== 'object') {
    return { model: '', temperature: '' };
  }
  const obj = raw as Record<string, unknown>;
  return {
    model: typeof obj['model'] === 'string' ? obj['model'] : '',
    temperature: typeof obj['temperature'] === 'number' ? String(obj['temperature']) : '',
  };
}

function initialState(provider: LlmProvider): FormState {
  const overrides = {} as Record<PipelineKey, OverrideState>;
  for (const key of PIPELINE_KEYS) {
    overrides[key] = readOverride(provider.pipelineOverrides[key]);
  }
  return {
    baseUrl: provider.baseUrl ?? '',
    apiKeyEnv: provider.apiKeyEnv ?? '',
    defaultModel: provider.defaultModel,
    overrides,
  };
}

/** Parsed temperature: `null` means "no override", `'invalid'` fails 0–2 range. */
function parseTemperature(raw: string): number | null | 'invalid' {
  if (raw.trim() === '') {
    return null;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 2) {
    return 'invalid';
  }
  return value;
}

function buildOverridesPayload(
  overrides: Record<PipelineKey, OverrideState>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of PIPELINE_KEYS) {
    const { model, temperature } = overrides[key];
    const entry: Record<string, unknown> = {};
    if (model.trim() !== '') {
      entry['model'] = model.trim();
    }
    const parsedTemperature = parseTemperature(temperature);
    if (typeof parsedTemperature === 'number') {
      entry['temperature'] = parsedTemperature;
    }
    if (Object.keys(entry).length > 0) {
      result[key] = entry;
    }
  }
  return result;
}

/**
 * Free-text model field with a cmdk-backed suggestion dropdown. Typing
 * filters the list; any typed value is accepted as-is, since a cloud
 * provider's model list can fail or be huge, and a local one may not have
 * pulled a model yet — both are legitimate row states (design D7).
 *
 * @param props - Combobox props.
 * @returns The combobox element.
 */
function ModelCombobox({
  id,
  value,
  onValueChange,
  models,
  placeholder,
}: {
  readonly id: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly models: readonly string[];
  readonly placeholder: string;
}) {
  const t = useTranslations('llm');
  const [open, setOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const filtered = (
    query ? models.filter((model) => model.toLowerCase().includes(query)) : models
  ).slice(0, MAX_MODEL_SUGGESTIONS);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          id={id}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" onOpenAutoFocus={(event) => event.preventDefault()}>
        <Command shouldFilter={false}>
          <CommandList>
            {filtered.length === 0 ? (
              <CommandEmpty>{t('modelComboboxEmpty')}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((model) => (
                  <CommandItem
                    key={model}
                    value={model}
                    onSelect={() => {
                      onValueChange(model);
                      setOpen(false);
                    }}
                  >
                    {model}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Configure dialog for an existing provider. Only mounts
 * {@link ProviderConfigBody} while open and a provider is resolved, keyed by
 * slug — a fresh mount gives fresh `useState` with no reset effect needed.
 *
 * @param props - Dialog props.
 * @returns The dialog element.
 */
export function ProviderConfigDialog({ open, onOpenChange, provider }: ProviderConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        {open && provider && (
          <ProviderConfigBody key={provider.slug} provider={provider} onOpenChange={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Props for {@link ProviderConfigBody}. */
interface ProviderConfigBodyProps {
  readonly provider: LlmProvider;
  readonly onOpenChange: (open: boolean) => void;
}

/**
 * The form itself — a fresh instance per open (see {@link ProviderConfigDialog}).
 *
 * @param props - Form body props.
 * @returns The form element.
 */
function ProviderConfigBody({ provider, onOpenChange }: ProviderConfigBodyProps) {
  const t = useTranslations('llm');
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => initialState(provider));

  const modelsQuery = useQuery({
    queryKey: queryKeys.llm.models(provider.slug),
    queryFn: ({ signal }) => listLlmModels(provider.slug, signal),
  });
  const models = modelsQuery.data?.models ?? [];
  const modelsError = modelsQuery.data?.error ?? null;

  const mutation = useMutation({
    mutationFn: () => {
      const patch: UpdateLlmProviderBody = {};
      const trimmedBaseUrl = form.baseUrl.trim();
      if (trimmedBaseUrl !== (provider.baseUrl ?? '')) {
        patch.baseUrl = trimmedBaseUrl;
      }
      const trimmedDefaultModel = form.defaultModel.trim();
      if (trimmedDefaultModel !== provider.defaultModel) {
        patch.defaultModel = trimmedDefaultModel;
      }
      const trimmedApiKeyEnv = form.apiKeyEnv.trim();
      const initialApiKeyEnv = provider.apiKeyEnv ?? '';
      if (trimmedApiKeyEnv !== initialApiKeyEnv) {
        patch.apiKeyEnv = trimmedApiKeyEnv === '' ? null : trimmedApiKeyEnv;
      }
      const nextOverrides = buildOverridesPayload(form.overrides);
      const initialOverrides = buildOverridesPayload(initialState(provider).overrides);
      if (JSON.stringify(nextOverrides) !== JSON.stringify(initialOverrides)) {
        patch.pipelineOverrides = nextOverrides;
      }
      return updateLlmProvider(provider.slug, patch);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.llm.providers });
      toast.success(t('updateSuccess'));
      onOpenChange(false);
    },
    onError: () => {
      toast.error(t('updateError'));
    },
  });

  const temperatureInvalid = PIPELINE_KEYS.some(
    (key) => parseTemperature(form.overrides[key].temperature) === 'invalid',
  );
  const canSubmit =
    form.baseUrl.trim() !== '' &&
    form.defaultModel.trim() !== '' &&
    !temperatureInvalid &&
    !mutation.isPending;

  const setOverride = (key: PipelineKey, next: Partial<OverrideState>): void => {
    setForm({
      ...form,
      overrides: { ...form.overrides, [key]: { ...form.overrides[key], ...next } },
    });
  };

  return (
    <>
      <DialogTitle>{t('formTitleConfigure', { name: provider.slug })}</DialogTitle>
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) {
            mutation.mutate();
          }
        }}
      >
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-text-primary">{t('connectionSection')}</h2>
          <div className="space-y-2">
            <Label htmlFor="config-base-url">{t('formBaseUrl')}</Label>
            <Input
              id="config-base-url"
              value={form.baseUrl}
              onChange={(event) => setForm({ ...form, baseUrl: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="config-api-key-env">{t('formApiKeyEnv')}</Label>
            <Input
              id="config-api-key-env"
              value={form.apiKeyEnv}
              onChange={(event) => setForm({ ...form, apiKeyEnv: event.target.value })}
              placeholder={t('formApiKeyEnvPlaceholder')}
            />
            <p className="text-xs text-text-muted">{t('formApiKeyEnvClearHint')}</p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-text-primary">{t('modelSection')}</h2>
          <ModelCombobox
            id="config-default-model"
            value={form.defaultModel}
            onValueChange={(value) => setForm({ ...form, defaultModel: value })}
            models={models}
            placeholder={t('modelPlaceholder')}
          />
          {modelsError && (
            <p className="text-xs text-warning">{t('modelsErrorHint', { error: modelsError })}</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-text-primary">{t('overridesSection')}</h2>
          {PIPELINE_KEYS.map((key) => {
            const invalid = parseTemperature(form.overrides[key].temperature) === 'invalid';
            return (
              <div key={key} className="flex items-start gap-2">
                <div className="w-28 shrink-0 pt-1.5 text-xs text-text-muted">
                  {t(PIPELINE_LABEL_KEYS[key])}
                </div>
                <div className="min-w-0 flex-1">
                  <ModelCombobox
                    id={`config-override-model-${key}`}
                    value={form.overrides[key].model}
                    onValueChange={(value) => setOverride(key, { model: value })}
                    models={models}
                    placeholder={t('modelInheritPlaceholder')}
                  />
                </div>
                <div className="w-24 shrink-0">
                  <Input
                    id={`config-override-temperature-${key}`}
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={form.overrides[key].temperature}
                    onChange={(event) => setOverride(key, { temperature: event.target.value })}
                    placeholder={t('temperaturePlaceholder')}
                  />
                  {invalid && (
                    <p className="text-xs text-destructive">{t('temperatureRangeError')}</p>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('formCancel')}
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {t('formSave')}
          </Button>
        </div>
      </form>
    </>
  );
}
