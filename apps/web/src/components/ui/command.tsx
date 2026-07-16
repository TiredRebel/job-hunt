'use client';

import { Command as CommandPrimitive } from 'cmdk';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

/**
 * Command palette root (cmdk), styled per shadcn/ui conventions.
 *
 * @param props - Forwarded to cmdk's root, plus `className`.
 * @returns The command root.
 */
export function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-surface-elevated text-text-primary',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Command palette rendered inside a modal dialog (the ⌘K global search).
 *
 * @param props - Dialog props, a required `title`/`description` for
 *   screen readers, and the command list children.
 * @param props.title - Accessible dialog title (visually hidden).
 * @param props.description - Accessible dialog description (visually
 *   hidden).
 * @param props.children - `CommandInput`/`CommandList` etc.
 * @returns The command dialog.
 */
export function CommandDialog({
  title,
  description,
  children,
  ...props
}: ComponentProps<typeof Dialog> & { title: string; description: string; children: ReactNode }) {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-muted">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Command palette search input.
 *
 * @param props - Forwarded to cmdk's input, plus `className`.
 * @returns The command input, with a search icon slot.
 */
export function CommandInput({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      className="flex items-center gap-2 border-b border-border px-3"
      data-slot="command-input-wrapper"
    >
      <CommandPrimitive.Input
        className={cn(
          'flex h-11 w-full rounded-md bg-transparent py-3 text-sm text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  );
}

/**
 * Command palette results list (scroll container).
 *
 * @param props - Forwarded to cmdk's list, plus `className`.
 * @returns The command list.
 */
export function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn('max-h-80 overflow-y-auto overflow-x-hidden p-1', className)}
      {...props}
    />
  );
}

/**
 * Command palette empty state.
 *
 * @param props - Forwarded to cmdk's empty slot.
 * @returns The empty-state message container.
 */
export function CommandEmpty(props: ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className="py-6 text-center text-sm text-text-muted" {...props} />;
}

/**
 * Command palette result group with a heading.
 *
 * @param props - Forwarded to cmdk's group, plus `className`.
 * @returns The command group.
 */
export function CommandGroup({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn('overflow-hidden p-1 text-text-primary', className)}
      {...props}
    />
  );
}

/**
 * A single selectable command palette entry.
 *
 * @param props - Forwarded to cmdk's item, plus `className`.
 * @returns The command item.
 */
export function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-[calc(var(--radius-control)-2px)] px-2 py-1.5 text-sm outline-none select-none data-[selected=true]:bg-surface data-[selected=true]:text-text-primary data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}
