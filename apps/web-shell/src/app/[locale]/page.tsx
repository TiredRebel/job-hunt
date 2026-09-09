/**
 * @module app/[locale]/page
 *
 * Locale-prefixed shell landing stub.
 */
import Link from 'next/link';

/**
 * Locale home for the shell.
 *
 * @param props - Route params.
 * @returns The stub page.
 */
export default async function LocaleHomePage({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}) {
  const { locale } = await params;
  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <h1>web-shell ({locale})</h1>
      <p>
        <Link href={`/${locale}/jobs`}>Jobs</Link>
        {' · '}
        <Link href={`/${locale}/board`}>Board</Link>
        {' · '}
        <Link href={`/${locale}/sources`}>Sources</Link>
      </p>
    </main>
  );
}
