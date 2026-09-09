import type { ReactNode } from 'react';

import { SettingsNav } from '@/components/settings/settings-nav';

/** Shared settings navigation and content frame. */
export function SettingsFrame({ children }: { readonly children: ReactNode }) {
  return (
    <div className="grid gap-6 min-[1100px]:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="min-w-0 min-[1100px]:sticky min-[1100px]:top-20 min-[1100px]:self-start">
        <SettingsNav />
      </aside>
      <div className="min-w-0 max-w-5xl">{children}</div>
    </div>
  );
}
