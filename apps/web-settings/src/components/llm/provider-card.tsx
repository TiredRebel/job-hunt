'use client';

/**
 * @module components/llm/provider-card
 *
 * LLM provider card for `/settings/llm` (llm-admin-ui spec): active radio,
 * confirm-to-switch, per-slug connection test (real, on every card), and a
 * Configure action opening `ProviderConfigDialog`.
 */
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { LlmProvider } from '@/lib/api/llm';
import { cn } from '@/lib/utils';

/** Inline connection-test result shown on the card. */
export type ConnectionTestState =
  | { readonly status: 'idle' }
  | { readonly status: 'pending' }
  | { readonly status: 'ok'; readonly latencyMs: number | null }
  | { readonly status: 'error'; readonly message: string };

/** Props accepted by {@link ProviderCard}. */
export interface ProviderCardProps {
  readonly provider: LlmProvider;
  readonly testState: ConnectionTestState;
  readonly switching: boolean;
  readonly testing: boolean;
  readonly onActivate: (slug: string) => void;
  readonly onTest: () => void;
  readonly onConfigure: (slug: string) => void;
}

/**
 * Map provider kind to a short local/cloud label.
 *
 * @param kind - Provider kind.
 * @returns Localized-ready kind key.
 */
function kindBucket(kind: LlmProvider['kind']): 'local' | 'cloud' {
  switch (kind) {
    case 'ollama':
      return 'local';
    case 'openai-compatible':
    case 'anthropic':
      return 'cloud';
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

/**
 * LLM provider administration card.
 *
 * @param props - Card props.
 * @returns The card element.
 */
export function ProviderCard({
  provider,
  testState,
  switching,
  testing,
  onActivate,
  onTest,
  onConfigure,
}: ProviderCardProps) {
  const t = useTranslations('llm');
  const locale = useLocale();
  const health = provider.lastStatus ?? 'muted';
  const p50 = Number.isFinite(provider.p50LatencyMs) ? provider.p50LatencyMs : null;
  const p95 = Number.isFinite(provider.p95LatencyMs) ? provider.p95LatencyMs : p50;

  const handleSelect = (): void => {
    if (provider.isActive) {
      return;
    }
    if (!window.confirm(t('confirmSwitch', { name: provider.name }))) {
      return;
    }
    onActivate(provider.slug);
  };

  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4',
        provider.isActive && 'border-accent',
      )}
    >
      <header className="flex items-start gap-3">
        <input
          type="radio"
          name="llm-provider"
          checked={provider.isActive}
          disabled={switching}
          onChange={handleSelect}
          aria-label={t('activateLabel', { name: provider.name })}
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">{provider.name}</p>
          <p className="font-mono text-[11px] text-text-muted">{provider.slug}</p>
          <p className="font-mono text-xs text-text-muted">{provider.defaultModel}</p>
          <p className="mt-1 text-xs text-text-muted">
            {kindBucket(provider.kind) === 'local' ? t('kindLocal') : t('kindCloud')} ·{' '}
            {provider.kind}
          </p>
        </div>
        <span
          className={cn(
            'mt-0.5 shrink-0 text-xs',
            health === 'success' && 'text-score-high-fg',
            health === 'failed' && 'text-destructive',
            health === 'muted' && 'text-text-muted',
          )}
        >
          {health === 'success'
            ? t('healthSuccess')
            : health === 'failed'
              ? t('healthFailed')
              : t('healthMuted')}
        </span>
      </header>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-y border-border py-2 text-xs">
        <dt className="text-text-muted">{t('latency')}</dt>
        <dd className="text-right font-mono text-text-primary">
          {p50 === null
            ? '—'
            : t('latencyValue', {
                p50: Math.round(p50),
                p95: Math.round(p95 ?? p50),
              })}
        </dd>
        <dt className="text-text-muted">{t('errors24h')}</dt>
        <dd className="text-right font-mono text-text-primary">{provider.failedRuns24h ?? 0}</dd>
        <dt className="text-text-muted">{t('lastRun')}</dt>
        <dd className="text-right text-text-primary">
          {provider.lastRunAt
            ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
                new Date(provider.lastRunAt),
              )
            : t('noRuns')}
        </dd>
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={testing} onClick={onTest}>
          {t('testConnection')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onConfigure(provider.slug)}
        >
          {t('configure')}
        </Button>
        {testState.status === 'pending' && (
          <span className="text-xs text-text-muted">{t('testing')}</span>
        )}
        {testState.status === 'ok' && (
          <span className="tabular-nums text-xs text-score-high-fg">
            {testState.latencyMs === null
              ? t('testOkPlain')
              : t('testOk', { ms: testState.latencyMs })}
          </span>
        )}
        {testState.status === 'error' && (
          <span className="text-xs text-destructive">{testState.message}</span>
        )}
      </div>
    </article>
  );
}
