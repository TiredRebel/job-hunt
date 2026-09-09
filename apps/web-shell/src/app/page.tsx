/**
 * @module app/page
 *
 * Shell health / entry stub. Domain routes are rewritten to remotes.
 */
import Link from 'next/link';

/**
 * Shell home page with links into locale-prefixed remote paths.
 *
 * @returns The stub page.
 */
export default function ShellHomePage() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: 640 }}>
      <h1>web-shell</h1>
      <p>
        Multi-zone host (port 3100 when Docker holds 3000). Remotes are proxied — not Module
        Federation, not iframes.
      </p>
      <ul>
        <li>
          <Link href="/en/jobs">/en/jobs → web-jobs</Link>
        </li>
        <li>
          <Link href="/en/board">/en/board → web-board</Link>
        </li>
        <li>
          <Link href="/en/sources">/en/sources → web-settings</Link>
        </li>
        <li>
          <Link href="/en/dictionaries">/en/dictionaries → web-settings</Link>
        </li>
        <li>
          <Link href="/en/profile">/en/profile → web-settings</Link>
        </li>
        <li>
          <Link href="/en/settings/llm">/en/settings/llm → web-settings</Link>
        </li>
      </ul>
    </main>
  );
}
