import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[calc(var(--radius-control)-2px)] px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-surface-elevated text-text-primary',
        outline: 'border border-border text-text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/**
 * Small label chip (shadcn/ui `Badge`). Semantic score/stage badges compose
 * their own background/foreground tokens directly rather than variants
 * here, since those color pairs are data-driven (see `ScoreBadge`,
 * `StageBadge`).
 *
 * @param props - Standard `span` props plus `variant`.
 * @returns The badge element.
 */
export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
