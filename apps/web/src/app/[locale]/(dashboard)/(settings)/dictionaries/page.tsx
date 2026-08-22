import { DictionariesPageClient } from '@/components/dictionaries/dict-editor';

/** Dictionaries admin hits the live API. */
export const dynamic = 'force-dynamic';

/** Dictionaries admin page (`/dictionaries`). */
export default function DictionariesPage() {
  return <DictionariesPageClient />;
}
