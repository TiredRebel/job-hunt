import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Scrollable table container + `<table>` element (shadcn/ui `Table`).
 *
 * @param props - Standard `table` props.
 * @returns The table wrapped in a horizontal scroll container.
 */
export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

/**
 * Table header group.
 *
 * @param props - Standard `thead` props.
 * @returns The table header element.
 */
export function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return (
    <thead
      className={cn('sticky top-0 z-10 bg-surface [&_tr]:border-b [&_tr]:border-border', className)}
      {...props}
    />
  );
}

/**
 * Table body.
 *
 * @param props - Standard `tbody` props.
 * @returns The table body element.
 */
export function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

/**
 * Table row.
 *
 * @param props - Standard `tr` props.
 * @returns The table row element.
 */
export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors hover:bg-surface-elevated data-[state=selected]:bg-accent/10',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Table header cell.
 *
 * @param props - Standard `th` props.
 * @returns The table header cell element.
 */
export function TableHead({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'h-9 whitespace-nowrap px-3 text-left align-middle text-xs font-medium text-text-muted [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Table data cell.
 *
 * @param props - Standard `td` props.
 * @returns The table data cell element.
 */
export function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return (
    <td
      className={cn(
        'whitespace-nowrap px-3 align-middle text-text-primary [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  );
}
