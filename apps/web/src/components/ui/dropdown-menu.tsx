import { Check } from 'lucide-react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** Dropdown menu root (shadcn/ui `DropdownMenu`). */
export const DropdownMenu = DropdownMenuPrimitive.Root;

/** Dropdown menu trigger. */
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

/**
 * Dropdown menu content, portaled and positioned.
 *
 * @param props - Forwarded to the Radix content, plus `className`.
 * @returns The content element.
 */
export function DropdownMenuContent({
  className,
  align = 'end',
  sideOffset = 6,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-40 rounded-[calc(var(--radius-control)-2px)] border border-border bg-surface-elevated p-1 text-text-primary shadow-[var(--shadow-elevated)] outline-none',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

/**
 * Regular menu item.
 *
 * @param props - Forwarded to the Radix item, plus `className`.
 * @returns The item element.
 */
export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'flex cursor-default items-center gap-2 rounded-[calc(var(--radius-control)-4px)] px-2 py-1.5 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Checkable menu item (column-visibility toggles, etc.).
 *
 * @param props - Forwarded to the Radix checkbox item, plus `className`.
 * @returns The checkbox item element.
 */
export function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      {...(checked === undefined ? {} : { checked })}
      className={cn(
        'relative flex cursor-default items-center gap-2 rounded-[calc(var(--radius-control)-4px)] py-1.5 pl-7 pr-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check aria-hidden="true" size={14} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

/**
 * Menu section label.
 *
 * @param props - Forwarded to the Radix label, plus `className`.
 * @returns The label element.
 */
export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn('px-2 py-1.5 text-xs font-medium text-text-muted', className)}
      {...props}
    />
  );
}

/**
 * Thin divider between menu sections.
 *
 * @param props - Forwarded to the Radix separator, plus `className`.
 * @returns The separator element.
 */
export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}
