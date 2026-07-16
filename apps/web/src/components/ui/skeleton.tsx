import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Pulsing placeholder block for loading states (shadcn/ui `Skeleton`).
 *
 * @param props - Standard `div` props.
 * @returns The skeleton element.
 */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('animate-pulse rounded-[var(--radius-control)] bg-surface-elevated', className)}
      {...props}
    />
  );
}
