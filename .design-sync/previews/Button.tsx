import { Button } from 'web';

/** Every variant — the axis that most changes appearance. */
export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button>Open pipeline</Button>
      <Button variant="outline">Columns</Button>
      <Button variant="ghost">Reset</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="link">Open original</Button>
    </div>
  );
}

/** The four sizes. `icon` is square and used for topbar controls. */
export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Toggle theme">
        ☾
      </Button>
    </div>
  );
}

/** Disabled state across the variants that carry weight. */
export function Disabled() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button disabled>Mark applied</Button>
      <Button variant="outline" disabled>
        Previous
      </Button>
      <Button variant="destructive" disabled>
        Reject
      </Button>
    </div>
  );
}
