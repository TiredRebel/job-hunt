'use client';

import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Tooltip provider — mount once near the app root.
 *
 * @param props - Forwarded to the Radix provider.
 * @returns The provider wrapping `children`.
 */
export function TooltipProvider({
  delayDuration = 200,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

/**
 * Tooltip root. Wrap a trigger + content pair.
 *
 * @param props - Forwarded to the Radix root.
 * @returns The tooltip root.
 */
export function Tooltip(props: ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root {...props} />;
}

/**
 * Tooltip trigger — the hovered/focused element.
 *
 * @param props - Forwarded to the Radix trigger.
 * @returns The tooltip trigger.
 */
export function TooltipTrigger(props: ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger {...props} />;
}

/**
 * Tooltip content bubble.
 *
 * @param props - Forwarded to the Radix content, plus `className`.
 * @returns The tooltip content, portaled and positioned.
 */
export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 overflow-hidden rounded-[calc(var(--radius-control)-2px)] border border-border bg-surface-elevated px-2.5 py-1.5 text-xs text-text-primary shadow-[var(--shadow-elevated)] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
