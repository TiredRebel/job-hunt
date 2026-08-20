import { Slider } from 'web';

/** The min-score filter — 0-100 in steps of 5. */
export function MinScore() {
  return (
    <div className="flex w-64 items-center gap-2">
      <span className="shrink-0 text-xs text-text-muted">Min score</span>
      <Slider defaultValue={[60]} min={0} max={100} step={5} aria-label="Min score" />
      <span className="tabular-nums w-6 shrink-0 text-right text-xs text-text-muted">60</span>
    </div>
  );
}

/** Range positions across the track. */
export function Positions() {
  return (
    <div className="flex w-64 flex-col gap-4">
      <Slider defaultValue={[0]} max={100} aria-label="Zero" />
      <Slider defaultValue={[45]} max={100} aria-label="Middle" />
      <Slider defaultValue={[100]} max={100} aria-label="Full" />
    </div>
  );
}
