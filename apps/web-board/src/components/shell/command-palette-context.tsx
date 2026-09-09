'use client';

/**
 * @module components/shell/command-palette-context
 *
 * Shares the ⌘K command palette's open state between its keyboard shortcut
 * listener and the topbar's visible search trigger.
 */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

interface CommandPaletteState {
  readonly open: boolean;
  readonly setOpen: Dispatch<SetStateAction<boolean>>;
}

const CommandPaletteContext = createContext<CommandPaletteState | null>(null);

/**
 * Provides the shared open/close state for the command palette.
 *
 * @param props - Provider props.
 * @param props.children - Nested content.
 * @returns The context provider.
 */
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
}

/**
 * Read/control the command palette's open state.
 *
 * @returns The current open state and setter.
 * @throws Error when used outside {@link CommandPaletteProvider}.
 */
export function useCommandPalette(): CommandPaletteState {
  const context = useContext(CommandPaletteContext);
  if (context === null) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
}
