import { StageBadge } from 'web';

/**
 * The five canonical pipeline stages, in board order. Each owns a token pair
 * (UI_DESIGN 2.1); these colors appear only on badges and column headers.
 */
export function Stages() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StageBadge stage="saved" />
      <StageBadge stage="applied" />
      <StageBadge stage="interview" />
      <StageBadge stage="offer" />
      <StageBadge stage="rejected" />
    </div>
  );
}

/** Non-canonical reactions fold onto the nearest canonical color. */
export function ExtendedReactions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StageBadge stage="viewed_by_employer" />
      <StageBadge stage="replied" />
      <StageBadge stage="test_task" />
      <StageBadge stage="withdrawn" />
    </div>
  );
}

/** No reaction recorded yet — the default for every freshly scraped role. */
export function NoReaction() {
  return <StageBadge stage={null} />;
}
