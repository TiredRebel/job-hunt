import type { ReactNode } from 'react';

import { SettingsFrame } from '@/components/settings/settings-frame';

/** Shared frame for settings-adjacent routes without changing their URLs. */
export default function SettingsLayout({ children }: { readonly children: ReactNode }) {
  return <SettingsFrame>{children}</SettingsFrame>;
}
