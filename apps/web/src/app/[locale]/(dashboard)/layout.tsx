import type { ReactNode } from 'react';

import { DashboardShell } from '@/components/shell/dashboard-shell';

/**
 * Shared shell for every dashboard route: sidebar + topbar + command
 * palette, wrapping the page content. docs/UI_DESIGN.md §4.
 *
 * @param props - Route props.
 * @param props.children - The active page's content.
 * @returns The dashboard shell.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
