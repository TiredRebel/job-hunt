'use client';

import { Dialog as DialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Dialog root — controls open state for the trigger/content pair.
 *
 * @param props - Forwarded to the Radix root.
 * @returns The dialog root.
 */
export function Dialog(props: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props} />;
}

/**
 * Dialog trigger — the element that opens the dialog.
 *
 * @param props - Forwarded to the Radix trigger.
 * @returns The dialog trigger.
 */
export function DialogTrigger(props: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger {...props} />;
}

/**
 * Dialog panel: portaled overlay + centered content card with a close
 * button, per shadcn/ui conventions.
 *
 * @param props - Forwarded to the Radix content, plus `className`.
 * @returns The dialog overlay and content.
 */
export function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-[var(--radius-card)] border border-border bg-surface-elevated p-6 shadow-[var(--shadow-elevated)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-[calc(var(--radius-control)-2px)] text-text-muted transition-colors hover:text-text-primary">
            <X aria-hidden="true" size={16} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/**
 * Dialog title — required for accessibility (labels the dialog).
 *
 * @param props - Forwarded to the Radix title, plus `className`.
 * @returns The dialog title.
 */
export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-base font-semibold text-text-primary', className)}
      {...props}
    />
  );
}

/**
 * Dialog description — supplementary text under the title.
 *
 * @param props - Forwarded to the Radix description, plus `className`.
 * @returns The dialog description.
 */
export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={cn('text-sm text-text-muted', className)} {...props} />
  );
}
