import { Popover as PopoverPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** Popover root (shadcn/ui `Popover`). */
export const Popover = PopoverPrimitive.Root;

/** Popover trigger. */
export const PopoverTrigger = PopoverPrimitive.Trigger;

/** Popover close control, for use inside {@link PopoverContent}. */
export const PopoverClose = PopoverPrimitive.Close;

/**
 * Popover content bubble, portaled and positioned.
 *
 * @param props - Forwarded to the Radix content, plus `className`.
 * @returns The content element.
 */
export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 6,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72 rounded-[var(--radius-card)] border border-border bg-surface-elevated p-3 text-text-primary shadow-[var(--shadow-elevated)] outline-none',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
