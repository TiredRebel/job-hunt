import { Checkbox, Label } from 'web';

/** All three states, including the indeterminate header state. */
export function States() {
  return (
    <div className="flex items-center gap-4">
      <Checkbox defaultChecked aria-label="Checked" />
      <Checkbox aria-label="Unchecked" />
      <Checkbox checked="indeterminate" aria-label="Some selected" />
      <Checkbox disabled aria-label="Disabled" />
    </div>
  );
}

/** Row selection in the jobs table — header plus rows. */
export function RowSelection() {
  return (
    <div className="flex max-w-sm flex-col gap-2.5">
      <Label className="flex items-center gap-2.5 text-xs text-text-muted">
        <Checkbox checked="indeterminate" /> 2 of 4 selected
      </Label>
      {[
        { t: 'Senior QA Engineer', on: true },
        { t: 'Automation QA Engineer', on: true },
        { t: 'Backend Engineer', on: false },
      ].map((r) => (
        <Label key={r.t} className="flex items-center gap-2.5 text-sm text-text-primary">
          <Checkbox defaultChecked={r.on} /> {r.t}
        </Label>
      ))}
    </div>
  );
}
