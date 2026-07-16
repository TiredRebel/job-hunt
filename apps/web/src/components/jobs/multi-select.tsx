'use client';

/**
 * @module components/jobs/multi-select
 *
 * Small checkbox-list multi-select used by the FilterBar for source/stage
 * filters (docs/UI_DESIGN.md §5.1). A Popover + Checkbox list rather than a
 * full combobox — the option sets here are short and don't need search.
 */
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/** A single selectable option. */
export interface MultiSelectOption {
  readonly value: string;
  readonly label: string;
}

/** Props accepted by {@link MultiSelect}. */
export interface MultiSelectProps {
  readonly label: string;
  readonly options: readonly MultiSelectOption[];
  readonly selected: readonly string[];
  readonly onChange: (values: readonly string[]) => void;
}

/**
 * Checkbox-list multi-select in a popover, with a badge count on the
 * trigger when any option is selected.
 *
 * @param props - Multi-select props.
 * @returns The multi-select control.
 */
export function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const toggle = (value: string): void => {
    onChange(
      selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5 text-text-primary">
          {label}
          {selected.length > 0 && (
            <span className="tabular-nums rounded-full bg-accent px-1.5 text-[11px] text-accent-foreground">
              {selected.length}
            </span>
          )}
          <ChevronDown aria-hidden="true" size={14} className="text-text-muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1">
        <ul className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
          {options.map((option) => (
            <li key={option.value}>
              <label className="flex cursor-pointer items-center gap-2 rounded-[calc(var(--radius-control)-4px)] px-2 py-1.5 text-sm hover:bg-surface">
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => toggle(option.value)}
                />
                <span className="truncate">{option.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
