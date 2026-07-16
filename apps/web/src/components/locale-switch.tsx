'use client';

/**
 * @module components/locale-switch
 *
 * EN/UK locale switcher for the topbar. Navigates to the same path under
 * the other locale prefix; next-intl persists the choice in a cookie.
 */
import { useLocale, useTranslations } from 'next-intl';

import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';

/**
 * Locale switcher control (EN / UK).
 *
 * @returns The locale switch control.
 */
export function LocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('locale');

  return (
    <div
      role="radiogroup"
      aria-label={t('switch')}
      className="inline-flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5"
    >
      {routing.locales.map((value) => {
        const selected = locale === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(value)}
            title={t(value)}
            onClick={() => router.replace(pathname, { locale: value })}
            className={cn(
              'flex h-7 items-center justify-center rounded-[calc(var(--radius-control)-2px)] px-2 text-xs font-medium uppercase text-text-muted transition-colors',
              selected && 'bg-accent text-accent-foreground',
            )}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}
