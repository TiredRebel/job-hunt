import { ScoreBadge } from 'web';

/**
 * The full semantic scale, in tier order. These four token pairs are the
 * design system's match-fit language: >= 80 accent-green, 60-79 lime,
 * 40-59 amber, < 40 muted grey (docs/UI_DESIGN.md 2.1).
 */
export function Tiers() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ScoreBadge score={92} />
      <ScoreBadge score={71} />
      <ScoreBadge score={48} />
      <ScoreBadge score={12} />
    </div>
  );
}

/** `null` is not zero — an unscored job says so rather than showing a real 0. */
export function Unscored() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ScoreBadge score={0} />
      <ScoreBadge score={null} />
    </div>
  );
}

/** In situ: the score column of the jobs table, mono digits aligned. */
export function InTable() {
  const rows = [
    { score: 88, title: 'Senior QA Engineer' },
    { score: 64, title: 'Automation QA Engineer' },
    { score: 41, title: 'Backend Engineer' },
    { score: null, title: 'Junior QA Engineer' },
  ];
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.title} className="flex items-center gap-3">
          <ScoreBadge score={row.score} />
          <span className="text-sm text-text-primary">{row.title}</span>
        </div>
      ))}
    </div>
  );
}
