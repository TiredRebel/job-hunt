/**
 * @module reconciliation.controller
 *
 * REST controllers for the reconciliation read model: per-source and
 * cross-source aggregate endpoints explaining the numerical gap between
 * scraper-discovered postings and visible processed jobs, plus a public
 * dead-letter listing surfaced for the dashboard (the automation module's
 * equivalent is internal-token-guarded).
 */
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ReconciliationService } from './reconciliation.service';
import {
  JobsReconciliationAggregateResponseDto,
  SourceReconciliationResponseDto,
} from './reconciliation.response.dto';
import { DeadLetterJobsQueryDto } from '../automation/automation.dto';
import { DeadLetterJobResponse } from '../automation/automation.response.dto';
import type { DeadLetterJob } from '../application/ports/scraper-client.port';

/**
 * Reconciliation API controller.
 */
@ApiTags('Reconciliation')
@Controller({ path: 'reconciliation', version: '1' })
export class ReconciliationController {
  /**
   * Reconciliation API controller.
   *
   * @param service - Reconciliation application service.
   */
  public constructor(private readonly service: ReconciliationService) {}

  /**
   * List per-source reconciliation buckets.
   *
   * @returns One row per source, ordered by `sourceSlug` ascending.
   */
  @Get('sources')
  @ApiOperation({
    summary:
      'Per-source jobs-health reconciliation (raw / processed / pending / failed / visible / hidden)',
  })
  @ApiOkResponse({
    type: SourceReconciliationResponseDto,
    isArray: true,
    description: 'Per-source reconciliation buckets.',
  })
  public async listBySource(): Promise<readonly SourceReconciliationResponseDto[]> {
    return this.service.listBySource();
  }

  /**
   * Get the cross-source aggregate reconciliation.
   *
   * @returns Aggregate buckets across all sources.
   */
  @Get('jobs')
  @ApiOperation({
    summary:
      'Cross-source jobs reconciliation aggregate (raw / processed / pending / failed / visible / hidden + legacyDelta)',
  })
  @ApiOkResponse({
    type: JobsReconciliationAggregateResponseDto,
    description: 'Aggregate reconciliation buckets across all sources.',
  })
  public async aggregate(): Promise<JobsReconciliationAggregateResponseDto> {
    return this.service.aggregate();
  }

  /**
   * List dead-lettered raw jobs. Public dashboard-facing mirror of the
   * internal-token-guarded `GET /v1/automation/jobs/dead-letter`.
   *
   * @param query - Validated feed size (`limit`, default 50, capped at 200).
   * @returns Dead-lettered raw jobs, newest first.
   */
  @Get('dead-letter')
  @ApiOperation({
    summary:
      'List dead-lettered raw jobs (public dashboard-facing mirror of the automation endpoint)',
  })
  @ApiOkResponse({
    type: DeadLetterJobResponse,
    isArray: true,
    description: 'Dead-lettered raw jobs.',
  })
  public async deadLetterJobs(
    @Query() query: DeadLetterJobsQueryDto,
  ): Promise<readonly DeadLetterJob[]> {
    return this.service.deadLetterJobs(query.limit);
  }
}
