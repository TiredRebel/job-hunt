import { Label as LabelPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Accessible form label (shadcn/ui `Label`).
 *
 * @param props - Forwarded to the Radix label, plus `className`.
 * @returns The label element.
 */
export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn('text-sm font-medium text-text-primary select-none', className)}
      {...props}
    />
  );
}
