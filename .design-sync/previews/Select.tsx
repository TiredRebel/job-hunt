import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'web';

/** Closed trigger with a value — how it sits in the filter bar. */
export function Closed() {
  return (
    <div className="w-40">
      <Select defaultValue="posted">
        <SelectTrigger aria-label="Date field">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="posted">Posted</SelectItem>
          <SelectItem value="first_seen">First seen</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/** Open, showing the option list. */
export function Open() {
  return (
    <div className="min-h-48 w-40">
      <Select defaultValue="posted" defaultOpen>
        <SelectTrigger aria-label="Date field">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="posted">Posted</SelectItem>
          <SelectItem value="first_seen">First seen</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
