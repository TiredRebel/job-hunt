'use client';

/**
 * @module components/profile/notification-settings-form
 *
 * Notifications section of `/profile` (profile-editor spec's "Notifications
 * section" requirement): per-channel enable + connection fields, secret
 * status shown without ever displaying a secret value, and the
 * match-threshold/digest-hour scalars automation already depends on. A
 * save here never touches the profiles API — separate mutation, separate
 * dirty state from {@link ProfileForm}.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { queryKeys } from '@/lib/api/query-keys';
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
  type UpdateNotificationSettingsBody,
} from '@/lib/api/settings';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ENV_VAR_PATTERN = /^[A-Z_][A-Z0-9_]*$/;

/** Editable form snapshot derived from notification settings. Numbers stay strings for controlled inputs. */
interface NotificationFormState {
  readonly telegramEnabled: boolean;
  readonly telegramChatId: string;
  readonly telegramBotTokenEnv: string;
  readonly emailEnabled: boolean;
  readonly smtpHost: string;
  readonly smtpPort: string;
  readonly smtpUser: string;
  readonly smtpPasswordEnv: string;
  readonly fromEmail: string;
  readonly toEmail: string;
  readonly matchThreshold: string;
  readonly digestHour: string;
}

/** Inline validation errors, keyed by field. */
interface ValidationErrors {
  readonly smtpPort?: string;
  readonly fromEmail?: string;
  readonly toEmail?: string;
  readonly matchThreshold?: string;
  readonly digestHour?: string;
  readonly telegramBotTokenEnv?: string;
  readonly smtpPasswordEnv?: string;
}

/**
 * Build form state from the API response.
 *
 * @param settings - Effective notification settings.
 * @returns Form snapshot.
 */
function fromSettings(settings: NotificationSettings): NotificationFormState {
  return {
    telegramEnabled: settings.telegram.enabled,
    telegramChatId: settings.telegram.chatId ?? '',
    telegramBotTokenEnv: settings.telegram.botTokenEnv,
    emailEnabled: settings.email.enabled,
    smtpHost: settings.email.smtpHost ?? '',
    smtpPort: settings.email.smtpPort !== null ? String(settings.email.smtpPort) : '',
    smtpUser: settings.email.smtpUser ?? '',
    smtpPasswordEnv: settings.email.smtpPasswordEnv,
    fromEmail: settings.email.fromEmail ?? '',
    toEmail: settings.email.toEmail ?? '',
    matchThreshold: String(settings.matchThreshold),
    digestHour: String(settings.digestHour),
  };
}

/**
 * Validate the form. An empty result means the form is submittable.
 *
 * @param form - Current form state.
 * @returns Field-keyed validation errors.
 */
function validate(form: NotificationFormState): ValidationErrors {
  const errors: Record<string, string> = {};

  if (form.smtpPort !== '') {
    const port = Number(form.smtpPort);
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
      errors['smtpPort'] = 'smtpPortError';
    }
  }
  if (form.fromEmail !== '' && !EMAIL_PATTERN.test(form.fromEmail)) {
    errors['fromEmail'] = 'emailFormatError';
  }
  if (form.toEmail !== '' && !EMAIL_PATTERN.test(form.toEmail)) {
    errors['toEmail'] = 'emailFormatError';
  }
  const threshold = Number(form.matchThreshold);
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 100) {
    errors['matchThreshold'] = 'matchThresholdError';
  }
  const hour = Number(form.digestHour);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    errors['digestHour'] = 'digestHourError';
  }
  if (!ENV_VAR_PATTERN.test(form.telegramBotTokenEnv)) {
    errors['telegramBotTokenEnv'] = 'envVarPatternError';
  }
  if (!ENV_VAR_PATTERN.test(form.smtpPasswordEnv)) {
    errors['smtpPasswordEnv'] = 'envVarPatternError';
  }

  return errors as ValidationErrors;
}

/**
 * Build a partial PATCH body containing only fields that changed from the
 * server snapshot.
 *
 * @param baseline - Last-known server settings.
 * @param form - Current form state.
 * @returns The patch to send; empty when nothing changed.
 */
function buildPatch(
  baseline: NotificationSettings,
  form: NotificationFormState,
): UpdateNotificationSettingsBody {
  const patch: UpdateNotificationSettingsBody = {};

  if (form.telegramEnabled !== baseline.telegram.enabled) {
    patch.telegramEnabled = form.telegramEnabled;
  }
  if (form.telegramChatId !== (baseline.telegram.chatId ?? '')) {
    patch.telegramChatId = form.telegramChatId;
  }
  if (form.telegramBotTokenEnv !== baseline.telegram.botTokenEnv) {
    patch.telegramBotTokenEnv = form.telegramBotTokenEnv;
  }
  if (form.emailEnabled !== baseline.email.enabled) {
    patch.emailEnabled = form.emailEnabled;
  }
  if (form.smtpHost !== (baseline.email.smtpHost ?? '')) {
    patch.smtpHost = form.smtpHost;
  }
  const basePort = baseline.email.smtpPort !== null ? String(baseline.email.smtpPort) : '';
  if (form.smtpPort !== basePort && form.smtpPort !== '') {
    patch.smtpPort = Number(form.smtpPort);
  }
  if (form.smtpUser !== (baseline.email.smtpUser ?? '')) {
    patch.smtpUser = form.smtpUser;
  }
  if (form.smtpPasswordEnv !== baseline.email.smtpPasswordEnv) {
    patch.smtpPasswordEnv = form.smtpPasswordEnv;
  }
  if (form.fromEmail !== (baseline.email.fromEmail ?? '') && form.fromEmail !== '') {
    patch.fromEmail = form.fromEmail;
  }
  if (form.toEmail !== (baseline.email.toEmail ?? '') && form.toEmail !== '') {
    patch.toEmail = form.toEmail;
  }
  if (form.matchThreshold !== String(baseline.matchThreshold)) {
    patch.matchThreshold = Number(form.matchThreshold);
  }
  if (form.digestHour !== String(baseline.digestHour)) {
    patch.digestHour = Number(form.digestHour);
  }

  return patch;
}

/**
 * Notifications section of the profile page.
 *
 * @returns The notification settings form.
 */
export function NotificationSettingsForm() {
  const t = useTranslations('notifications');
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<NotificationFormState | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const settingsQuery = useQuery({
    queryKey: queryKeys.settings.notifications,
    queryFn: ({ signal }) => getNotificationSettings(signal),
  });

  const baseline = settingsQuery.data ? fromSettings(settingsQuery.data) : null;
  const form = local ?? baseline;
  const dirty =
    local !== null && baseline !== null && JSON.stringify(local) !== JSON.stringify(baseline);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settingsQuery.data || !form) {
        throw new Error('No settings');
      }
      return updateNotificationSettings(buildPatch(settingsQuery.data, form));
    },
    onSuccess: async () => {
      setLocal(null);
      setErrors({});
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.notifications });
      toast.success(t('saveSuccess'));
    },
    onError: () => {
      toast.error(t('saveError'));
    },
  });

  const data = settingsQuery.data;

  if (settingsQuery.isLoading || !form || !data) {
    return (
      <div className="workspace-panel flex flex-col gap-3 p-5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div className="workspace-panel p-5">
        <p className="text-sm text-destructive">{t('loadError')}</p>
      </div>
    );
  }

  const patch = (partial: Partial<NotificationFormState>): void => {
    setLocal({ ...form, ...partial });
  };

  return (
    <form
      className="workspace-panel mx-auto flex max-w-2xl flex-col gap-5 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const validationErrors = validate(form);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
        setErrors({});
        saveMutation.mutate();
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{t('title')}</h2>
          <p className="text-xs text-text-muted">{t('subtitle')}</p>
        </div>
        {dirty && <span className="text-xs text-warning">{t('unsaved')}</span>}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-text-primary">{t('telegramTitle')}</legend>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <Switch
            checked={form.telegramEnabled}
            onCheckedChange={(checked) => patch({ telegramEnabled: checked })}
          />
          {t('telegramEnabledLabel')}
        </label>

        <div className="space-y-2">
          <Label htmlFor="telegramChatId">{t('telegramChatId')}</Label>
          <Input
            id="telegramChatId"
            value={form.telegramChatId}
            onChange={(event) => patch({ telegramChatId: event.target.value })}
            placeholder={t('telegramChatIdPlaceholder')}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="telegramBotTokenEnv">{t('telegramBotTokenEnv')}</Label>
            <SecretStatus
              configured={data.telegram.botTokenConfigured}
              envVar={form.telegramBotTokenEnv}
            />
          </div>
          <Input
            id="telegramBotTokenEnv"
            value={form.telegramBotTokenEnv}
            onChange={(event) => patch({ telegramBotTokenEnv: event.target.value })}
            className="h-9 font-mono"
          />
          <p className="text-xs text-text-muted">{t('telegramBotTokenEnvHint')}</p>
          {errors.telegramBotTokenEnv && (
            <p className="text-xs text-destructive">{t(errors.telegramBotTokenEnv)}</p>
          )}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-text-primary">{t('emailTitle')}</legend>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <Switch
            checked={form.emailEnabled}
            onCheckedChange={(checked) => patch({ emailEnabled: checked })}
          />
          {t('emailEnabledLabel')}
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="smtpHost">{t('smtpHost')}</Label>
            <Input
              id="smtpHost"
              value={form.smtpHost}
              onChange={(event) => patch({ smtpHost: event.target.value })}
              placeholder={t('smtpHostPlaceholder')}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpPort">{t('smtpPort')}</Label>
            <Input
              id="smtpPort"
              type="number"
              min={1}
              max={65_535}
              value={form.smtpPort}
              onChange={(event) => patch({ smtpPort: event.target.value })}
              className="h-9"
            />
            {errors.smtpPort && <p className="text-xs text-destructive">{t(errors.smtpPort)}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="smtpUser">{t('smtpUser')}</Label>
          <Input
            id="smtpUser"
            value={form.smtpUser}
            onChange={(event) => patch({ smtpUser: event.target.value })}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="smtpPasswordEnv">{t('smtpPasswordEnv')}</Label>
            <SecretStatus
              configured={data.email.smtpPasswordConfigured}
              envVar={form.smtpPasswordEnv}
            />
          </div>
          <Input
            id="smtpPasswordEnv"
            value={form.smtpPasswordEnv}
            onChange={(event) => patch({ smtpPasswordEnv: event.target.value })}
            className="h-9 font-mono"
          />
          <p className="text-xs text-text-muted">{t('smtpPasswordEnvHint')}</p>
          {errors.smtpPasswordEnv && (
            <p className="text-xs text-destructive">{t(errors.smtpPasswordEnv)}</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fromEmail">{t('fromEmail')}</Label>
            <Input
              id="fromEmail"
              type="email"
              value={form.fromEmail}
              onChange={(event) => patch({ fromEmail: event.target.value })}
              className="h-9"
            />
            {errors.fromEmail && <p className="text-xs text-destructive">{t(errors.fromEmail)}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="toEmail">{t('toEmail')}</Label>
            <Input
              id="toEmail"
              type="email"
              value={form.toEmail}
              onChange={(event) => patch({ toEmail: event.target.value })}
              className="h-9"
            />
            {errors.toEmail && <p className="text-xs text-destructive">{t(errors.toEmail)}</p>}
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">{t('title')}</legend>
        <div className="space-y-2">
          <Label htmlFor="matchThreshold">{t('matchThreshold')}</Label>
          <Input
            id="matchThreshold"
            type="number"
            min={0}
            max={100}
            value={form.matchThreshold}
            onChange={(event) => patch({ matchThreshold: event.target.value })}
            className="h-9"
          />
          <p className="text-xs text-text-muted">{t('matchThresholdHint')}</p>
          {errors.matchThreshold && (
            <p className="text-xs text-destructive">{t(errors.matchThreshold)}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="digestHour">{t('digestHour')}</Label>
          <Input
            id="digestHour"
            type="number"
            min={0}
            max={23}
            value={form.digestHour}
            onChange={(event) => patch({ digestHour: event.target.value })}
            className="h-9"
          />
          <p className="text-xs text-text-muted">{t('digestHourHint')}</p>
          {errors.digestHour && <p className="text-xs text-destructive">{t(errors.digestHour)}</p>}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" disabled={!dirty || saveMutation.isPending}>
          {t('save')}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!dirty}
          onClick={() => {
            setLocal(null);
            setErrors({});
          }}
        >
          {t('reset')}
        </Button>
      </div>
    </form>
  );
}

/**
 * Configured / not-configured indicator for a secret's environment
 * variable. Never renders the secret's value — only whether it's present.
 *
 * @param props - Whether the variable is currently populated, and its name.
 * @returns The status indicator.
 */
function SecretStatus({ configured, envVar }: { configured: boolean; envVar: string }) {
  const t = useTranslations('notifications');
  return (
    <span className={configured ? 'text-xs text-score-high-fg' : 'text-xs text-warning'}>
      {configured ? t('configured') : t('notConfigured', { envVar })}
    </span>
  );
}
