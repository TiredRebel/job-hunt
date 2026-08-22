import { DictionariesPageClient } from '@/components/dictionaries/dict-editor';
import { SettingsFrame } from '@/components/settings/settings-frame';

/** Dictionaries admin hits the live API. */
export const dynamic = 'force-dynamic';

/**
 * Dictionaries admin page (`/dictionaries`).
 *
 * @returns The dictionaries page.
 */
export default function DictionariesPage() {
  return (
    <SettingsFrame>
      <DictionariesPageClient />
    </SettingsFrame>
  );
}
