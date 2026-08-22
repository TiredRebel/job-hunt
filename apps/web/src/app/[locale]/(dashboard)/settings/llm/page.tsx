import { LlmSettingsPageClient } from '@/components/llm/llm-settings-page';
import { SettingsFrame } from '@/components/settings/settings-frame';

/** LLM settings hits the live API. */
export const dynamic = 'force-dynamic';

/**
 * LLM admin settings page (`/settings/llm`).
 *
 * @returns The LLM settings page.
 */
export default function LlmSettingsPage() {
  return (
    <SettingsFrame>
      <LlmSettingsPageClient />
    </SettingsFrame>
  );
}
