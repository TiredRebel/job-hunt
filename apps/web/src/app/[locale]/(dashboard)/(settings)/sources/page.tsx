import { SourcesPageClient } from '@/components/sources/sources-page';

/** Sources admin hits the live API. */
export const dynamic = 'force-dynamic';

/** Sources admin page (`/sources`). */
export default function SourcesPage() {
  return <SourcesPageClient />;
}
