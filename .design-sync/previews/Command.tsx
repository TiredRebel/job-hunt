import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'web';

/** The global command palette (Cmd-K), inline. */
export function Palette() {
  return (
    <div className="w-80 overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      <Command>
        <CommandInput placeholder="Type a command or search jobs…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            <CommandItem>Jobs</CommandItem>
            <CommandItem>Board</CommandItem>
            <CommandItem>Sources</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem>Run all sources now</CommandItem>
            <CommandItem>Reset filters</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

/** Empty state when a query matches nothing. */
export function NoResults() {
  return (
    <div className="w-80 overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      <Command>
        <CommandInput placeholder="Search…" defaultValue="zzzz" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
        </CommandList>
      </Command>
    </div>
  );
}
