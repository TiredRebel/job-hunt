import {
  ScoreBadge,
  StageBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'web';

const ROWS = [
  {
    score: 88,
    title: 'Senior QA Engineer — Backend Services',
    company: 'uSoftware / Botim',
    source: 'dou',
    posted: 'Aug 12, 2026',
    stage: 'applied',
  },
  {
    score: 71,
    title: 'Automation QA Engineer (Python)',
    company: 'Volpis',
    source: 'dou',
    posted: 'Aug 17, 2026',
    stage: 'interview',
  },
  {
    score: 54,
    title: 'Middle Automation QA Engineer',
    company: 'PettersonApps',
    source: 'djinni',
    posted: 'Aug 13, 2026',
    stage: 'saved',
  },
  {
    score: null,
    title: 'Junior QA Engineer (Back-end)',
    company: 'Ajax Systems',
    source: 'dou',
    posted: '—',
    stage: null,
  },
];

/** The jobs triage table — the design system's densest, most-used surface. */
export function TriageTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Score</TableHead>
          <TableHead>Job</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Posted</TableHead>
          <TableHead>Stage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map((row) => (
          <TableRow key={row.title}>
            <TableCell>
              <ScoreBadge score={row.score} />
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-text-primary">{row.title}</span>
                <span className="text-xs text-text-muted">{row.company}</span>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-text-muted">{row.source}</span>
            </TableCell>
            <TableCell>
              <span className="tabular-nums text-text-muted">{row.posted}</span>
            </TableCell>
            <TableCell>
              <StageBadge stage={row.stage} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Minimal shape — header plus two columns, for reference. */
export function Basic() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead>Roles</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>dou</TableCell>
          <TableCell className="tabular-nums">142</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>djinni</TableCell>
          <TableCell className="tabular-nums">47</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
