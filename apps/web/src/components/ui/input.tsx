import { forwardRef, type ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Standard text input (shadcn/ui `Input`).
 *
 * @param props - Standard `input` props.
 * @returns The input element.
 */
export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-8 w-full rounded-[var(--radius-control)] border border-border bg-surface px-2.5 text-sm text-text-primary placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});
