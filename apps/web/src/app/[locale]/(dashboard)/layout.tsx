import type { ReactNode } from 'react';

import { CommandPalette } from '@/components/shell/command-palette';
import { CommandPaletteProvider } from '@/components/shell/command-palette-context';
import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';

/**
 * Shared shell for every dashboard route: sidebar + topbar + command
 * palette, wrapping the page content. docs/UI_DESIGN.md §4.
 *
 * @param props - Route props.
 * @param props.children - The active page's content.
 * @returns The dashboard shell.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <CommandPaletteProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-5">{children}</main>
        </div>
      </div>
      <CommandPalette />
    </CommandPaletteProvider>
  );
}
