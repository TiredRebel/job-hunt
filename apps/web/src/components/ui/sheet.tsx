'use client';

import { Dialog as SheetPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Sheet root — controls open state for the trigger/content pair.
 *
 * @param props - Forwarded to the Radix dialog root.
 * @returns The sheet root.
 */
export function Sheet(props: ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root {...props} />;
}

/**
 * Sheet trigger — the element that opens the sheet.
 *
 * @param props - Forwarded to the Radix dialog trigger.
 * @returns The sheet trigger.
 */
export function SheetTrigger(props: ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger {...props} />;
}

const sheetVariants = cva(
  'fixed z-50 flex flex-col gap-4 border-border bg-surface-elevated p-6 shadow-[var(--shadow-elevated)] transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-[var(--motion-drawer)] data-[state=open]:duration-[var(--motion-drawer)]',
  {
    variants: {
      side: {
        right:
          'inset-y-0 right-0 h-full w-full max-w-[560px] border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        left: 'inset-y-0 left-0 h-full w-full max-w-[560px] border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
);

/**
 * Sheet panel: portaled overlay + side-sliding content, per shadcn/ui
 * conventions (used as the 560px job-detail drawer, UI_DESIGN §5.3).
 *
 * @param props - Forwarded to the Radix content, plus `side`/`className`.
 * @returns The sheet overlay and content.
 */
export function SheetContent({
  className,
  side,
  children,
  closeLabel = 'Close',
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants> & { readonly closeLabel?: string }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <SheetPrimitive.Content className={cn(sheetVariants({ side, className }))} {...props}>
        {children}
        <SheetPrimitive.Close
          className="absolute right-4 top-4 rounded-[calc(var(--radius-control)-2px)] text-text-muted transition-colors hover:text-text-primary"
          aria-label={closeLabel}
        >
          <X aria-hidden="true" size={16} />
          <span className="sr-only">{closeLabel}</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

/**
 * Sheet title — required for accessibility (labels the sheet).
 *
 * @param props - Forwarded to the Radix title, plus `className`.
 * @returns The sheet title.
 */
export function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      className={cn('text-base font-semibold text-text-primary', className)}
      {...props}
    />
  );
}

/**
 * Sheet description — supplementary text under the title.
 *
 * @param props - Forwarded to the Radix description, plus `className`.
 * @returns The sheet description.
 */
export function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description className={cn('text-sm text-text-muted', className)} {...props} />
  );
}
