import { Input, Label } from 'web';

/** The jobs search field — the filter bar's primary control. */
export function Default() {
  return (
    <div className="max-w-sm">
      <Input placeholder="Search jobs…" aria-label="Search jobs" />
    </div>
  );
}

/** With a value, and paired with its label. */
export function Labelled() {
  return (
    <div className="flex max-w-sm flex-col gap-1.5">
      <Label htmlFor="salary-min">Min salary</Label>
      <Input id="salary-min" type="number" defaultValue={3500} />
    </div>
  );
}

/** Disabled and read-only states. */
export function States() {
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Input defaultValue="Senior QA Engineer" />
      <Input defaultValue="Locked while a run is in flight" disabled />
    </div>
  );
}
