/**
 * @module i18n/navigation
 *
 * Locale-aware navigation primitives (`Link`, `useRouter`, `usePathname`,
 * `redirect`), typed against {@link routing}. Components must use these
 * instead of `next/link` / `next/navigation` so locale prefixes are
 * preserved automatically.
 */
import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
