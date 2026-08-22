'use client';

/**
 * @module components/profile/profile-form
 *
 * Active-profile editor (profile-editor spec): skills, seniority, salary,
 * locations, remote, stop-words — with inline validation, dirty guard, reset.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { TagsInput } from '@/components/jobs/tags-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { getActiveProfile, updateProfile, type Profile } from '@/lib/api/profiles';
import { queryKeys } from '@/lib/api/query-keys';

const SENIORITIES = ['junior', 'middle', 'senior', 'lead'] as const;
const REMOTES = ['remote', 'hybrid', 'office'] as const;

/** Editable form snapshot derived from a profile. */
interface ProfileFormState {
  readonly skills: readonly string[];
  readonly seniorities: readonly string[];
  readonly desiredSalaryMin: string;
  readonly desiredSalaryMax: string;
  readonly locations: readonly string[];
  readonly remote: readonly string[];
  readonly stopWords: readonly string[];
}

/**
 * Build form state from an API profile.
 *
 * @param profile - Active profile.
 * @returns Form snapshot.
 */
function fromProfile(profile: Profile): ProfileFormState {
  return {
    skills: profile.skills,
    seniorities: profile.preferences.seniorities ?? [],
    desiredSalaryMin:
      profile.preferences.desiredSalaryMin !== undefined
        ? String(profile.preferences.desiredSalaryMin)
        : '',
    desiredSalaryMax:
      profile.preferences.desiredSalaryMax !== undefined
        ? String(profile.preferences.desiredSalaryMax)
        : '',
    locations: profile.preferences.locations ?? [],
    remote: profile.preferences.remote ?? [],
    stopWords: profile.preferences.stopWords ?? [],
  };
}

/**
 * Active profile form.
 *
 * @returns The profile editor.
 */
export function ProfileForm() {
  const t = useTranslations('profile');
  const queryClient = useQueryClient();
  /** `null` mirrors the server snapshot; a value is a local edit session. */
  const [local, setLocal] = useState<ProfileFormState | null>(null);
  const [salaryError, setSalaryError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: queryKeys.profiles.active,
    queryFn: ({ signal }) => getActiveProfile(signal),
  });

  const baseline = profileQuery.data ? fromProfile(profileQuery.data) : null;
  const form = local ?? baseline;
  const dirty =
    local !== null && baseline !== null && JSON.stringify(local) !== JSON.stringify(baseline);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profileQuery.data || !form) {
        throw new Error('No profile');
      }
      const min = form.desiredSalaryMin ? Number(form.desiredSalaryMin) : undefined;
      const max = form.desiredSalaryMax ? Number(form.desiredSalaryMax) : undefined;
      if (min !== undefined && max !== undefined && min > max) {
        throw new Error('salary-range');
      }
      return updateProfile(String(profileQuery.data.id), {
        skills: [...form.skills],
        preferences: {
          ...(min !== undefined ? { desiredSalaryMin: min } : {}),
          ...(max !== undefined ? { desiredSalaryMax: max } : {}),
          locations: [...form.locations],
          seniorities: [...form.seniorities] as NonNullable<Profile['preferences']['seniorities']>,
          remote: [...form.remote] as NonNullable<Profile['preferences']['remote']>,
          stopWords: [...form.stopWords],
        },
      });
    },
    onSuccess: async () => {
      setLocal(null);
      setSalaryError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all });
      toast.success(t('saveSuccess'));
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'salary-range') {
        setSalaryError(t('salaryRangeError'));
        return;
      }
      toast.error(t('saveError'));
    },
  });

  if (profileQuery.isLoading || !form) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return <p className="text-sm text-destructive">{t('loadError')}</p>;
  }

  const patch = (partial: Partial<ProfileFormState>): void => {
    setLocal({ ...form, ...partial });
  };

  const toggleRemote = (value: string, checked: boolean): void => {
    const next = checked ? [...form.remote, value] : form.remote.filter((entry) => entry !== value);
    patch({ remote: next });
  };

  return (
    <form
      className="mx-auto flex max-w-2xl flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSalaryError(null);
        const min = form.desiredSalaryMin ? Number(form.desiredSalaryMin) : undefined;
        const max = form.desiredSalaryMax ? Number(form.desiredSalaryMax) : undefined;
        if (min !== undefined && max !== undefined && min > max) {
          setSalaryError(t('salaryRangeError'));
          return;
        }
        saveMutation.mutate();
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-text-primary">{t('title')}</h1>
        {dirty && <span className="text-xs text-warning">{t('unsaved')}</span>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="skills">{t('skills')}</Label>
        <TagsInput
          id="skills"
          value={form.skills}
          onChange={(skills) => patch({ skills })}
          placeholder={t('skillsPlaceholder')}
          aria-label={t('skills')}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('seniority')}</Label>
        <Select
          {...(form.seniorities[0] ? { value: form.seniorities[0] } : {})}
          onValueChange={(value) => patch({ seniorities: [value] })}
        >
          <SelectTrigger className="h-9 w-48">
            <SelectValue placeholder={t('seniorityPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {SENIORITIES.map((seniority) => (
              <SelectItem key={seniority} value={seniority}>
                {seniority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="salaryMin">{t('salaryMin')}</Label>
          <Input
            id="salaryMin"
            type="number"
            min={0}
            value={form.desiredSalaryMin}
            onChange={(event) => patch({ desiredSalaryMin: event.target.value })}
            className="h-9"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salaryMax">{t('salaryMax')}</Label>
          <Input
            id="salaryMax"
            type="number"
            min={0}
            value={form.desiredSalaryMax}
            onChange={(event) => patch({ desiredSalaryMax: event.target.value })}
            className="h-9"
          />
        </div>
      </div>
      {salaryError && <p className="text-xs text-destructive">{salaryError}</p>}

      <div className="space-y-2">
        <Label>{t('locations')}</Label>
        <TagsInput
          value={form.locations}
          onChange={(locations) => patch({ locations })}
          placeholder={t('locationsPlaceholder')}
          aria-label={t('locations')}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-text-primary">{t('remote')}</legend>
        <div className="flex flex-wrap gap-4">
          {REMOTES.map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm text-text-muted">
              <Switch
                tone="neutral"
                checked={form.remote.includes(value)}
                onCheckedChange={(checked) => toggleRemote(value, checked)}
              />
              {value}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label>{t('stopWords')}</Label>
        <TagsInput
          value={form.stopWords}
          onChange={(stopWords) => patch({ stopWords })}
          placeholder={t('stopWordsPlaceholder')}
          aria-label={t('stopWords')}
        />
      </div>

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
            setSalaryError(null);
          }}
        >
          {t('reset')}
        </Button>
      </div>
    </form>
  );
}
