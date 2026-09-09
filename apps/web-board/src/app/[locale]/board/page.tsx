import { StageBoard } from '@/components/board/stage-board';

/** Board is interaction-heavy and always hits the live API. */
export const dynamic = 'force-dynamic';

/**
 * Stage kanban board (`/board`).
 *
 * @returns The board page.
 */
export default function BoardPage() {
  return <StageBoard />;
}
