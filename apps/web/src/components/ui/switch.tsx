import { Switch as SwitchPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Boolean toggle (shadcn/ui `Switch`).
 *
 * @param props - Forwarded to the Radix switch, plus `className`.
 * @returns The switch element.
 */
export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent bg-surface-elevated transition-colors data-[state=checked]:bg-accent disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-4 translate-x-0.5 rounded-full bg-text-primary shadow-[var(--shadow-elevated)] transition-transform data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-accent-foreground" />
    </SwitchPrimitive.Root>
  );
}
