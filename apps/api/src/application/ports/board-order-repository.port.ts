/**
 * @module board-order-repository.port
 *
 * Port for persisting manual within-column card order on the board
 * (design.md D3/D5 in openspec/changes/notification-settings-and-board-reorder).
 * A dedicated port, not an extension of {@link JobReactionRepository}
 * (job-reaction-repository.port.ts) — ordering and reaction events are
 * different concerns backed by different tables, even though both are
 * exposed from the reactions bounded context.
 */

/**
 * Repository contract for board card ordering.
 */
export interface BoardOrderRepository {
  /**
   * Rewrite the stored position for exactly the given jobs, in the given
   * order, within one stage. Idempotent — a stale or repeated call simply
   * renormalizes positions rather than corrupting order (D3).
   *
   * @param profileId - Active profile id.
   * @param stage - The stage column the reorder happened in (advisory only, D5).
   * @param jobIds - Job ids in their new order.
   */
  setStageOrder(profileId: number, stage: string, jobIds: readonly bigint[]): Promise<void>;
}

/**
 * Injection token for the board order repository port.
 */
export const BOARD_ORDER_REPOSITORY = Symbol('BOARD_ORDER_REPOSITORY');
