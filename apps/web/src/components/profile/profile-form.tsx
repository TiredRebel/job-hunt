'use client';

/**
 * @module components/profile/profile-form
 *
 * Active-profile editor for scorer inputs and CV context. Owns the profile
 * query/mutation lifecycle, validation, dirty guard, and completeness summary;
 * composed from shared form controls and the profile API client.
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
import { Textarea } from '@/components/ui/textarea';
import { getActiveProfile, updateProfile, type Profile } from '@/lib/api/profiles';
import { queryKeys } from '@/lib/api/query-keys';

const SENIORITIES = ['junior', 'middle', 'senior', 'lead'] as const;
const REMOTES = ['remote', 'hybrid', 'office'] as const;

/** Editable form snapshot derived from a profile. */
interface ProfileFormState {
  readonly cvMd: string;
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
    cvMd: profile.cvMd ?? '',
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
        cvMd: form.cvMd,
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

  if (profileQuery.isError) {
    return <p className="text-sm text-destructive">{t('loadError')}</p>;
  }

  if (profileQuery.isLoading || !form || !profileQuery.data) {
    return (
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,720px)_280px]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const patch = (partial: Partial<ProfileFormState>): void => {
    setLocal({ ...form, ...partial });
  };

  const toggleRemote = (value: string, checked: boolean): void => {
    const next = checked ? [...form.remote, value] : form.remote.filter((entry) => entry !== value);
    patch({ remote: next });
  };

  const completeness = [
    { label: t('completenessSkills'), complete: form.skills.length > 0 },
    { label: t('completenessRole'), complete: form.seniorities.length > 0 },
    {
      label: t('completenessCompensation'),
      complete: Boolean(form.desiredSalaryMin || form.desiredSalaryMax),
    },
    {
      label: t('completenessLocation'),
      complete: form.locations.length > 0 || form.remote.length > 0,
    },
    { label: t('completenessExclusions'), complete: form.stopWords.length > 0 },
    { label: t('completenessCv'), complete: form.cvMd.trim().length > 0 },
  ];
  const completeCount = completeness.filter((item) => item.complete).length;
  const completenessPercent = Math.round((completeCount / completeness.length) * 100);

  return (
    <form
      className="mx-auto flex w-full max-w-[1040px] flex-col"
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
      <header className="mb-5">
        <h1 className="text-lg font-semibold text-text-primary">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-text-muted">{t('subtitle')}</p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,720px)_280px]">
        <div className="flex flex-col gap-4">
          <section className="workspace-panel flex flex-col gap-2 p-4">
            <h2 className="utility-label text-text-muted">{t('matchBasis')}</h2>
            <p className="text-sm leading-5 text-text-muted">{t('matchBasisHint')}</p>
          </section>

          <section className="workspace-panel flex flex-col gap-3 p-4">
            <div>
              <h2 className="utility-label text-text-muted">{t('skills')}</h2>
              <p className="mt-1 text-sm text-text-muted">{t('skillsHint')}</p>
            </div>
            <TagsInput
              id="skills"
              value={form.skills}
              onChange={(skills) => patch({ skills })}
              placeholder={t('skillsPlaceholder')}
              aria-label={t('skills')}
            />
          </section>

          <section className="workspace-panel flex flex-col gap-3 p-4">
            <h2 className="utility-label text-text-muted">{t('role')}</h2>
            <div className="space-y-2">
              <Label>{t('seniority')}</Label>
              <Select
                {...(form.seniorities[0] ? { value: form.seniorities[0] } : {})}
                onValueChange={(value) => patch({ seniorities: [value] })}
              >
                <SelectTrigger className="h-9 w-full sm:w-56">
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
          </section>

          <section className="workspace-panel flex flex-col gap-4 p-4">
            <h2 className="utility-label text-text-muted">{t('compensationLocation')}</h2>
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
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {REMOTES.map((value) => (
                  <label key={value} className="flex items-center gap-2 text-sm text-text-muted">
                    <Switch
                      tone="neutral"
                      checked={form.remote.includes(value)}
                      onCheckedChange={(checked) => toggleRemote(value, checked)}
                    />
                    {t(`remoteOptions.${value}`)}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="workspace-panel flex flex-col gap-3 p-4">
            <div>
              <h2 className="utility-label text-text-muted">{t('exclusions')}</h2>
              <p className="mt-1 text-sm text-text-muted">{t('exclusionsHint')}</p>
            </div>
            <TagsInput
              value={form.stopWords}
              onChange={(stopWords) => patch({ stopWords })}
              placeholder={t('stopWordsPlaceholder')}
              aria-label={t('stopWords')}
            />
          </section>

          <section className="workspace-panel flex flex-col gap-3 p-4">
            <div>
              <h2 className="utility-label text-text-muted">{t('cv')}</h2>
              <p className="mt-1 text-sm text-text-muted">{t('cvHint')}</p>
            </div>
            <Textarea
              id="cvMd"
              value={form.cvMd}
              onChange={(event) => patch({ cvMd: event.target.value })}
              placeholder={t('cvPlaceholder')}
              aria-label={t('cv')}
              className="min-h-40 resize-y text-sm leading-5"
            />
            <p className="text-right font-mono text-[11px] text-text-muted">
              {t('cvCharacters', { count: form.cvMd.length })}
            </p>
          </section>
        </div>

        <aside className="sticky top-5 flex flex-col gap-4" aria-label={t('profileSummary')}>
          <section className="workspace-panel p-4">
            <div className="flex items-end justify-between gap-3">
              <h2 className="utility-label text-text-muted">{t('completeness')}</h2>
              <span className="font-mono text-lg font-semibold text-text-primary">
                {completenessPercent}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={t('completeness')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completenessPercent}
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${completenessPercent}%` }}
              />
            </div>
            <ul className="mt-4 space-y-2.5">
              {completeness.map((item) => (
                <li key={item.label} className="flex items-start gap-2 text-xs text-text-muted">
                  <span
                    aria-hidden="true"
                    className={item.complete ? 'text-accent' : 'text-text-subtle'}
                  >
                    {item.complete ? '✓' : '○'}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {dirty && (
        <footer className="sticky bottom-0 z-20 mt-5 flex flex-col gap-3 border border-border-subtle bg-surface-elevated p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-warning">{t('unsaved')}</p>
            <p className="text-xs text-text-muted">{t('dirtyHint')}</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLocal(null);
                setSalaryError(null);
              }}
            >
              {t('reset')}
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('save')}
            </Button>
          </div>
        </footer>
      )}
    </form>
  );
}
