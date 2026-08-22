import { Switch as SwitchPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Boolean toggle (shadcn/ui `Switch`).
 *
 * @param props - Forwarded to the Radix switch, plus `className`.
 * @returns The switch element.
 */
export interface SwitchProps extends ComponentProps<typeof SwitchPrimitive.Root> {
  readonly tone?: 'accent' | 'neutral';
}

/** Render an accent or neutral boolean switch. */
export function Switch({ className, tone = 'accent', ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent bg-surface-elevated transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'accent' ? 'data-[state=checked]:bg-accent' : 'data-[state=checked]:bg-text-muted',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block size-4 translate-x-0.5 rounded-full bg-text-primary shadow-[var(--shadow-elevated)] transition-transform data-[state=checked]:translate-x-[18px]',
          tone === 'accent' && 'data-[state=checked]:bg-accent-foreground',
        )}
      />
    </SwitchPrimitive.Root>
  );
}
