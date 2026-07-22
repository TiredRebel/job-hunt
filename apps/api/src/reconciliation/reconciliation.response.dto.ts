/**
 * @module reconciliation.response.dto
 *
 * Response DTOs for the reconciliation endpoints. Mirror the runtime shapes
 * returned by the service (the {@link ReconciliationRow} and
 * {@link ReconciliationAggregate} domain types) for OpenAPI documentation
 * only; controllers return domain objects unchanged.
 */
import { ApiProperty } from '@nestjs/swagger';

/**
 * Per-source reconciliation buckets as returned by
 * `GET /v1/reconciliation/sources`.
 */
export class SourceReconciliationResponseDto {
  /** Source primary key. */
  @ApiProperty({ description: 'Source primary key.', type: Number, example: 1 })
  public sourceId!: number;

  /** Source slug (denormalized for display). */
  @ApiProperty({
    description: 'Source slug (denormalized for display).',
    type: String,
    example: 'dou',
  })
  public sourceSlug!: string;

  /** All `scraper.jobs_raw` rows for the source. */
  @ApiProperty({
    description: 'All scraper.jobs_raw rows for the source (cumulative across all runs).',
    type: Number,
    example: 42,
  })
  public rawTotal!: number;

  /** `jobs_raw` rows with `processing_status = 'done'`. */
  @ApiProperty({
    description: "jobs_raw rows with processing_status = 'done'.",
    type: Number,
    example: 28,
  })
  public processed!: number;

  /** `jobs_raw` rows with `processing_status IN ('pending','queued')`. */
  @ApiProperty({
    description: 'jobs_raw rows awaiting processing chain pickup.',
    type: Number,
    example: 2,
  })
  public pending!: number;

  /** `jobs_raw` rows with `processing_status = 'failed'`. */
  @ApiProperty({
    description: 'jobs_raw rows dead-lettered after repeated processing failures.',
    type: Number,
    example: 1,
  })
  public failed!: number;

  /** `core.jobs` rows joined via `raw_id` with `status <> 'hidden'`. */
  @ApiProperty({
    description: "core.jobs rows for this source with status <> 'hidden'.",
    type: Number,
    example: 27,
  })
  public visibleJobs!: number;

  /** `core.jobs` rows joined via `raw_id` with `status = 'hidden'`. */
  @ApiProperty({
    description: "core.jobs rows for this source with status = 'hidden'.",
    type: Number,
    example: 1,
  })
  public hiddenJobs!: number;
}

/**
 * Cross-source aggregate as returned by `GET /v1/reconciliation/jobs`.
 */
export class JobsReconciliationAggregateResponseDto {
  /** Sum of `rawTotal` across all sources. */
  @ApiProperty({
    description: 'Cumulative jobs_raw rows across all sources.',
    type: Number,
    example: 50,
  })
  public rawTotal!: number;

  /** Sum of `processed` across all sources. */
  @ApiProperty({
    description: 'Cumulative processed jobs_raw rows across all sources.',
    type: Number,
    example: 38,
  })
  public processed!: number;

  /** Sum of `pending` across all sources. */
  @ApiProperty({
    description: 'Cumulative pending/queued jobs_raw rows across all sources.',
    type: Number,
    example: 5,
  })
  public pending!: number;

  /** Sum of `failed` across all sources. */
  @ApiProperty({
    description: 'Cumulative failed jobs_raw rows across all sources.',
    type: Number,
    example: 2,
  })
  public failed!: number;

  /** Sum of `visibleJobs` across all sources. */
  @ApiProperty({
    description: 'Cumulative visible core.jobs rows across all sources.',
    type: Number,
    example: 35,
  })
  public visibleJobs!: number;

  /** Sum of `hiddenJobs` across all sources. */
  @ApiProperty({
    description: 'Cumulative hidden core.jobs rows across all sources.',
    type: Number,
    example: 1,
  })
  public hiddenJobs!: number;

  /**
   * `processed - (visibleJobs + hiddenJobs)`. Zero on a clean seed;
   * negative when `core.jobs` has rows without a `jobs_raw` parent.
   */
  @ApiProperty({
    description:
      'processed - (visibleJobs + hiddenJobs). Zero on a clean seed; negative when core.jobs has rows without a jobs_raw parent.',
    type: Number,
    example: 0,
  })
  public legacyDelta!: number;
}
