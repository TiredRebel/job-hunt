/**
 * @module paginated.response
 *
 * Reusable pagination wrapper factory for response DTOs. `openapi-typescript`
 * cannot express generics, so each paginated resource still needs a concrete
 * named class (for a named component schema) — but the wrapper shape is
 * defined once here and inherited:
 *
 * ```ts
 * export class PaginatedJobsResponse extends PaginatedResponse(JobResponse) {}
 * ```
 */
import type { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Shape produced by {@link PaginatedResponse}.
 */
export interface PaginatedShape<TItem> {
  /** Items on the current page. */
  items: TItem[];
  /** Total number of items matching the filter. */
  total: number;
}

/**
 * Builds a pagination wrapper class for the given item DTO. Extend the
 * result with a named class so the OpenAPI component schema gets a stable,
 * resource-specific name.
 *
 * @param itemClass - Response DTO class of the page items.
 * @returns An abstract wrapper class with `items` and `total`.
 */
export function PaginatedResponse<TItem>(itemClass: Type<TItem>): Type<PaginatedShape<TItem>> {
  class Paginated implements PaginatedShape<TItem> {
    /** Items on the current page. */
    @ApiProperty({ description: 'Items on the current page.', type: itemClass, isArray: true })
    public items!: TItem[];

    /** Total number of items matching the filter. */
    @ApiProperty({ description: 'Total number of items matching the filter.', type: Number })
    public total!: number;
  }
  return Paginated;
}
