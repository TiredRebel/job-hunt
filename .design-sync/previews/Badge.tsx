import { Badge } from 'web';

/** Both variants side by side — the whole variant axis. */
export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Remote</Badge>
      <Badge variant="outline">Hybrid</Badge>
    </div>
  );
}

/** How the jobs table actually uses it: a truncated tag list plus an overflow count. */
export function TagList() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge>TypeScript</Badge>
      <Badge>React</Badge>
      <Badge>PostgreSQL</Badge>
      <Badge variant="outline">+4</Badge>
    </div>
  );
}

/** Long labels: badges never wrap internally, they stay on one line and the row wraps. */
export function LongLabels() {
  return (
    <div className="flex max-w-sm flex-wrap items-center gap-1.5">
      <Badge>Senior Full-Stack Engineer</Badge>
      <Badge variant="outline">Київ, Україна</Badge>
      <Badge>Node.js / NestJS</Badge>
    </div>
  );
}
