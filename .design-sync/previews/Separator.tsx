import { Separator } from 'web';

/** Horizontal rule between stacked sections. */
export function Horizontal() {
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <span className="text-sm text-text-primary">Match explanation</span>
      <Separator />
      <span className="text-sm text-text-muted">Reaction timeline</span>
    </div>
  );
}

/** Vertical rule between inline items — the drawer header meta row. */
export function Vertical() {
  return (
    <div className="flex h-5 items-center gap-3 text-xs text-text-muted">
      <span>dou</span>
      <Separator orientation="vertical" />
      <span className="tabular-nums">Aug 17, 2026</span>
      <Separator orientation="vertical" />
      <span>Remote</span>
    </div>
  );
}
