'use client';

/**
 * @module components/llm/provider-form-dialog
 *
 * Create dialog for a new LLM provider (llm-admin-ui spec "Add a custom
 * provider"). Rows are always created inactive — the new card appears with
 * Test one click away, and further configuration happens via
 * `ProviderConfigDialog`. `slug` and `kind` are permanent after creation.
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
import { ApiError } from '@/lib/api/client';
import { createLlmProvider, type LlmProviderKind } from '@/lib/api/llm';
import { queryKeys } from '@/lib/api/query-keys';
import { SLUG_PATTERN } from '@/lib/slug';

const PROVIDER_KINDS: readonly LlmProviderKind[] = ['ollama', 'openai-compatible', 'anthropic'];

/** Props for {@link ProviderFormDialog}. */
export interface ProviderFormDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

interface FormState {
  readonly slug: string;
  readonly name: string;
  readonly kind: LlmProviderKind;
  readonly baseUrl: string;
  readonly defaultModel: string;
  readonly apiKey: string;
}

const INITIAL_STATE: FormState = {
  slug: '',
  name: '',
  kind: 'openai-compatible',
  baseUrl: '',
  defaultModel: '',
  apiKey: '',
};

/**
 * Create dialog for a new LLM provider. Only mounts {@link ProviderFormBody}
 * while open, keyed `'create'` — a fresh mount gives fresh `useState` with
 * no reset-on-close effect needed.
 *
 * @param props - Dialog props.
 * @returns The dialog element.
 */
export function ProviderFormDialog({ open, onOpenChange }: ProviderFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        {open && <ProviderFormBody key="create" onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

/** Props for {@link ProviderFormBody}. */
interface ProviderFormBodyProps {
  readonly onOpenChange: (open: boolean) => void;
}

/**
 * The form itself — a fresh instance per open (see {@link ProviderFormDialog}).
 *
 * @param props - Form body props.
 * @returns The form element.
 */
function ProviderFormBody({ onOpenChange }: ProviderFormBodyProps) {
  const t = useTranslations('llm');
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [slugConflict, setSlugConflict] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createLlmProvider({
        slug: form.slug.trim(),
        ...(form.name.trim() ? { name: form.name.trim() } : {}),
        kind: form.kind,
        baseUrl: form.baseUrl.trim(),
        defaultModel: form.defaultModel.trim(),
        ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.llm.providers });
      toast.success(t('createSuccess'));
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setSlugConflict(t('formSlugConflict'));
        return;
      }
      toast.error(t('createError'));
    },
  });

  const trimmedSlug = form.slug.trim();
  const slugInvalid = form.slug !== '' && !SLUG_PATTERN.test(form.slug);
  const canSubmit =
    trimmedSlug !== '' &&
    !slugInvalid &&
    form.baseUrl.trim() !== '' &&
    form.defaultModel.trim() !== '' &&
    !mutation.isPending;

  return (
    <>
      <DialogTitle>{t('formTitleCreate')}</DialogTitle>
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
          <Label htmlFor="provider-slug">{t('formSlug')}</Label>
          <Input
            id="provider-slug"
            value={form.slug}
            onChange={(event) => {
              setForm({ ...form, slug: event.target.value });
              setSlugConflict(null);
            }}
            placeholder={t('formSlugPlaceholder')}
          />
          <p className="text-xs text-text-muted">{t('formSlugHint')}</p>
          {slugInvalid && <p className="text-xs text-destructive">{t('formSlugPatternError')}</p>}
          {slugConflict && <p className="text-xs text-destructive">{slugConflict}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="provider-name">{t('formName')}</Label>
          <Input
            id="provider-name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder={t('formNamePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('formKind')}</Label>
          <Select
            value={form.kind}
            onValueChange={(value) => setForm({ ...form, kind: value as LlmProviderKind })}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {kind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-text-muted">{t('formKindHint')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="provider-base-url">{t('formBaseUrl')}</Label>
          <Input
            id="provider-base-url"
            value={form.baseUrl}
            onChange={(event) => setForm({ ...form, baseUrl: event.target.value })}
            placeholder={t('formBaseUrlPlaceholder')}
          />
          <p className="text-xs text-text-muted">{t('formBaseUrlHint')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="provider-default-model">{t('formDefaultModel')}</Label>
          <Input
            id="provider-default-model"
            value={form.defaultModel}
            onChange={(event) => setForm({ ...form, defaultModel: event.target.value })}
            placeholder={t('formDefaultModelPlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="provider-api-key">{t('formApiKeyEnv')}</Label>
          <Input
            id="provider-api-key"
            type="password"
            autoComplete="off"
            value={form.apiKey}
            onChange={(event) => setForm({ ...form, apiKey: event.target.value })}
            placeholder={t('formApiKeyEnvPlaceholder')}
          />
          <p className="text-xs text-text-muted">{t('formApiKeyEnvHint')}</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('formCancel')}
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {t('formCreate')}
          </Button>
        </div>
      </form>
    </>
  );
}
