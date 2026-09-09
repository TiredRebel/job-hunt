'use client';

/**
 * @module components/jobs/tags-input
 *
 * Free-text tag chips input (the FilterBar's "tags combobox" — job tags are
 * LLM-extracted free text, not a fixed dictionary, so there is no
 * autocomplete source to back a true combobox against).
 */
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type KeyboardEvent } from 'react';

/** Props accepted by {@link TagsInput}. */
export interface TagsInputProps {
  readonly value: readonly string[];
  readonly onChange: (tags: readonly string[]) => void;
  readonly placeholder?: string;
  readonly 'aria-label'?: string;
  /** Forwarded to the underlying text input, so an outer `<Label htmlFor>` resolves. */
  readonly id?: string;
}

/**
 * Chip-style tag input: type + Enter/comma to add, backspace on empty input
 * removes the last chip.
 *
 * @param props - Tags input props.
 * @returns The tags input control.
 */
export function TagsInput({
  value,
  onChange,
  placeholder,
  'aria-label': ariaLabel,
  id,
}: TagsInputProps) {
  const t = useTranslations('common');
  const [draft, setDraft] = useState('');

  const commit = (raw: string): void => {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setDraft('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit(draft);
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex min-h-8 flex-wrap items-center gap-1 rounded-[var(--radius-control)] border border-border bg-surface px-1.5 py-1">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-[calc(var(--radius-control)-2px)] bg-surface-elevated px-1.5 py-0.5 text-xs text-text-primary"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((item) => item !== tag))}
            aria-label={`${t('delete')} ${tag}`}
            className="text-text-muted hover:text-text-primary"
          >
            <X aria-hidden="true" size={10} />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(draft)}
        placeholder={value.length === 0 ? placeholder : undefined}
        aria-label={ariaLabel}
        className="min-w-16 flex-1 bg-transparent px-1 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
      />
    </div>
  );
}
