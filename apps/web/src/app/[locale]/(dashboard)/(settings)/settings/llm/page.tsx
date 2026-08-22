import { LlmSettingsPageClient } from '@/components/llm/llm-settings-page';

/** LLM settings hits the live API. */
export const dynamic = 'force-dynamic';

/** LLM admin settings page (`/settings/llm`). */
export default function LlmSettingsPage() {
  return <LlmSettingsPageClient />;
}
