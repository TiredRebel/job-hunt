'use client';

/**
 * @module ds-preview-shim
 *
 * Context wrapper for the design-sync bundle (`/design-sync` skill).
 *
 * `ScoreBadge` and `StageBadge` read their labels through `next-intl`, and
 * `Tooltip` needs its provider — neither has a Next.js request context when a
 * design is rendered on claude.ai/design, so both are supplied here.
 *
 * Messages are imported, not passed as config props: that keeps one copy in
 * the bundle instead of inlining the locale JSON into every preview card,
 * where it would silently rot as `messages/en.json` changes.
 */
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

import { TooltipProvider } from './src/components/ui/tooltip';

import messages from './messages/en.json';

/** The EN message catalogue, exported so previews can reference it directly. */
export const dsMessages = messages;

/** Props accepted by {@link DsPreviewProvider}. */
export interface DsPreviewProviderProps {
  readonly children?: ReactNode;
}

/**
 * Wraps children in the contexts every Job Hunter component expects.
 *
 * @param props - Provider props.
 * @returns The wrapped tree.
 */
export function DsPreviewProvider({ children }: DsPreviewProviderProps) {
  return (
    <NextIntlClientProvider locale="en" messages={messages} timeZone="Europe/Kyiv">
      <TooltipProvider>{children}</TooltipProvider>
    </NextIntlClientProvider>
  );
}
