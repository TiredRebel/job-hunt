import { SourcesPageClient } from '@/components/sources/sources-page';
import { SettingsFrame } from '@/components/settings/settings-frame';

/** Sources admin hits the live API. */
export const dynamic = 'force-dynamic';

/**
 * Sources admin page (`/sources`).
 *
 * @returns The sources page.
 */
export default function SourcesPage() {
  return (
    <SettingsFrame>
      <SourcesPageClient />
    </SettingsFrame>
  );
}
