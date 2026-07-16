import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Multi-line text input (shadcn/ui `Textarea`).
 *
 * @param props - Standard `textarea` props.
 * @returns The textarea element.
 */
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'flex min-h-24 w-full rounded-[var(--radius-control)] border border-border bg-surface px-2.5 py-2 text-sm text-text-primary placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
