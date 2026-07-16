'use client';

/**
 * @module components/llm/llm-settings-page
 *
 * `/settings/llm` body: provider card grid with active switch + connection test.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { ProviderCard, type ConnectionTestState } from '@/components/llm/provider-card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api/client';
import { listLlmProviders, setActiveLlmProvider, testLlmConnection } from '@/lib/api/llm';
import { queryKeys } from '@/lib/api/query-keys';

/**
 * LLM settings page client island.
 *
 * @returns The settings content.
 */
export function LlmSettingsPageClient() {
  const t = useTranslations('llm');
  const queryClient = useQueryClient();
  const [testBySlug, setTestBySlug] = useState<Record<string, ConnectionTestState>>({});

  const providersQuery = useQuery({
    queryKey: queryKeys.llm.providers,
    queryFn: ({ signal }) => listLlmProviders(signal),
  });

  const switchMutation = useMutation({
    mutationFn: (slug: string) => setActiveLlmProvider(slug),
    onMutate: async (slug) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.llm.providers });
      const previous = queryClient.getQueryData(queryKeys.llm.providers);
      queryClient.setQueryData(queryKeys.llm.providers, (current: typeof previous) => {
        if (!Array.isArray(current)) {
          return current;
        }
        return current.map((provider) => ({
          ...provider,
          isActive: provider.slug === slug,
        }));
      });
      return { previous };
    },
    onError: (_error, _slug, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.llm.providers, context.previous);
      }
      toast.error(t('switchError'));
    },
    onSuccess: () => {
      toast.success(t('switchSuccess'));
      void queryClient.invalidateQueries({ queryKey: queryKeys.llm.providers });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (slug: string) => {
      const started = performance.now();
      const result = await testLlmConnection();
      const latencyMs = Math.round(performance.now() - started);
      return { slug, result, latencyMs };
    },
    onMutate: (slug) => {
      setTestBySlug((prev) => ({ ...prev, [slug]: { status: 'pending' } }));
    },
    onSuccess: ({ slug, result, latencyMs }) => {
      setTestBySlug((prev) => ({
        ...prev,
        [slug]: result.ok
          ? { status: 'ok', latencyMs }
          : { status: 'error', message: t('testFailed') },
      }));
    },
    onError: (error, slug) => {
      setTestBySlug((prev) => ({
        ...prev,
        [slug]: {
          status: 'error',
          message: error instanceof ApiError ? error.message : t('testFailed'),
        },
      }));
    },
  });

  if (providersQuery.isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (providersQuery.isError) {
    return <p className="text-sm text-destructive">{t('loadError')}</p>;
  }

  const providers = providersQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">{t('title')}</h1>
        <p className="mt-1 text-sm text-text-muted">{t('subtitle')}</p>
      </div>
      {providers.length === 0 ? (
        <p className="text-sm text-text-muted">{t('empty')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.slug}
              provider={provider}
              testState={testBySlug[provider.slug] ?? { status: 'idle' }}
              switching={switchMutation.isPending}
              testing={testMutation.isPending}
              onActivate={(slug) => switchMutation.mutate(slug)}
              onTest={() => testMutation.mutate(provider.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
