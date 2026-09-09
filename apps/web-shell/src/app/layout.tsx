/**
 * @module app/layout
 *
 * Root layout for the multi-zone shell host.
 */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** Shell metadata. */
export const metadata: Metadata = {
  title: 'Job Hunter Shell',
  description: 'Multi-zone host for Job Hunter dashboard remotes.',
};

/**
 * Root HTML shell for the host app.
 *
 * @param props - Layout props.
 * @returns The document shell.
 */
export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
