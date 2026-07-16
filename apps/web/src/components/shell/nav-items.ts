/**
 * @module components/shell/nav-items
 *
 * Sidebar navigation entries (docs/UI_DESIGN.md §4). Shared between the
 * sidebar and the command palette's navigation group.
 */
import type { LucideIcon } from 'lucide-react';
import { Briefcase, KanbanSquare, ListTree, Rss, Settings, UserRound } from 'lucide-react';

/** A single sidebar/command-palette navigation entry. */
export interface NavItem {
  /** Path relative to the locale segment, e.g. `/jobs`. */
  readonly href: string;
  /** i18n message key under the `nav` namespace. */
  readonly labelKey: 'jobs' | 'board' | 'sources' | 'dictionaries' | 'profile' | 'settingsLlm';
  readonly icon: LucideIcon;
}

/** Ordered sidebar navigation entries. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/jobs', labelKey: 'jobs', icon: Briefcase },
  { href: '/board', labelKey: 'board', icon: KanbanSquare },
  { href: '/sources', labelKey: 'sources', icon: Rss },
  { href: '/dictionaries', labelKey: 'dictionaries', icon: ListTree },
  { href: '/profile', labelKey: 'profile', icon: UserRound },
  { href: '/settings/llm', labelKey: 'settingsLlm', icon: Settings },
];
