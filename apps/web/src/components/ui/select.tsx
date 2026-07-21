import { Check, ChevronDown } from 'lucide-react';
import { Select as SelectPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** Select root (shadcn/ui `Select`). Re-exported as-is — no visual wrapper needed. */
export const Select = SelectPrimitive.Root;

/** Select value display, used inside {@link SelectTrigger}. */
export const SelectValue = SelectPrimitive.Value;

/**
 * Select trigger button.
 *
 * @param props - Forwarded to the Radix trigger, plus `className`.
 * @returns The trigger element.
 */
export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-8 w-full items-center justify-between gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-2.5 text-sm text-text-primary disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden="true" size={14} className="shrink-0 text-text-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/**
 * Select dropdown content, portaled and positioned.
 *
 * @param props - Forwarded to the Radix content, plus `className`.
 * @returns The content element.
 */
export function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        className={cn(
          'z-50 max-h-64 min-w-32 overflow-y-auto rounded-[min(var(--radius-card),1rem)] border border-border bg-surface-elevated p-1 text-text-primary shadow-[var(--shadow-elevated)]',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

/**
 * A single selectable option.
 *
 * @param props - Forwarded to the Radix item, plus `className`.
 * @returns The option element.
 */
export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex w-full cursor-default items-center rounded-[calc(var(--radius-control)-4px)] py-1.5 pl-7 pr-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface data-[highlighted]:text-text-primary',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check aria-hidden="true" size={14} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
