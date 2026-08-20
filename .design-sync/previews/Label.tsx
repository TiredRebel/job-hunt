import { Input, Label, Switch } from 'web';

/** Label above its control — the profile-form pattern. */
export function WithInput() {
  return (
    <div className="flex max-w-sm flex-col gap-1.5">
      <Label htmlFor="seniority">Seniority</Label>
      <Input id="seniority" defaultValue="Senior" />
    </div>
  );
}

/** Label beside a switch — the filter-bar pattern. */
export function WithSwitch() {
  return (
    <Label className="flex items-center gap-2">
      <Switch defaultChecked />
      Remote only
    </Label>
  );
}
