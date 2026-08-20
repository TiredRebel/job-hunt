import { Check, Minus } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Tri-state checkbox (shadcn/ui `Checkbox`). Used for table row selection.
 *
 * @param props - Forwarded to the Radix checkbox, plus `className`.
 * @returns The checkbox element.
 */
export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'group flex size-4 shrink-0 items-center justify-center rounded-[calc(var(--radius-control)-2px)] border border-border bg-surface data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-accent-foreground">
        <Minus
          aria-hidden="true"
          className="hidden group-data-[state=indeterminate]:block"
          size={12}
          strokeWidth={3}
        />
        <Check
          aria-hidden="true"
          className="block group-data-[state=indeterminate]:hidden"
          size={12}
          strokeWidth={3}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
