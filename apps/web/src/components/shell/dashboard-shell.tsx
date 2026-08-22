'use client';

/** Shared dashboard frame with one local sidebar-collapse state. */
import type { ReactNode } from 'react';
import { useState } from 'react';

import { CommandPaletteProvider } from '@/components/shell/command-palette-context';
import { LazyCommandPalette } from '@/components/shell/lazy-command-palette';
import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { cn } from '@/lib/utils';

/** Props accepted by {@link DashboardShell}. */
export interface DashboardShellProps {
  readonly children: ReactNode;
}

/** Dashboard sidebar, topbar, content scroller, and command palette. */
export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <CommandPaletteProvider>
      <div
        className={cn(
          'flex h-dvh overflow-hidden bg-background [--dashboard-sidebar-width:64px]',
          !sidebarCollapsed && 'min-[1025px]:[--dashboard-sidebar-width:248px]',
        )}
      >
        <Sidebar collapsed={sidebarCollapsed} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
          />
          <main id="main-content" className="min-h-0 flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
      <LazyCommandPalette />
    </CommandPaletteProvider>
  );
}
