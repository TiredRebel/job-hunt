/**
 * @module reactions.controller
 *
 * REST controllers for per-vacancy reaction tracking: single, bulk, and
 * timeline.
 */
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { ReactionsService } from './reactions.service';
import { AppendReactionDto, BulkReactionsDto } from './reactions.dto';
import { JobReactionEventResponse } from './reactions.response.dto';

/**
 * Reactions API controller.
 */
@ApiTags('reactions')
@Controller({ path: 'reactions', version: '1' })
export class ReactionsController {
  /**
   * Reactions API controller.
   *
   * @param service - Reactions application service.
   */
  public constructor(private readonly service: ReactionsService) {}

  /**
   * Append a reaction to a job.
   *
   * @param payload - Reaction data.
   */
  @Post()
  @ApiOperation({ summary: 'Append a reaction to a job' })
  @ApiBody({ type: AppendReactionDto })
  @ApiCreatedResponse({ type: JobReactionEventResponse })
  public async add(@Body() payload: AppendReactionDto) {
    return this.service.add({
      jobId: BigInt(payload.jobId),
      profileId: payload.profileId,
      reaction: payload.reaction,
      note: payload.note ?? null,
      ...(payload.occurredAt === undefined ? {} : { occurredAt: payload.occurredAt }),
    });
  }

  /**
   * Bulk-set a reaction for selected jobs.
   *
   * @param payload - Bulk reaction data.
   */
  @Post('bulk')
  @ApiOperation({ summary: 'Bulk-set a reaction for selected jobs' })
  @ApiBody({ type: BulkReactionsDto })
  @ApiCreatedResponse({ type: Number, description: 'Number of reaction rows inserted.' })
  public async addBulk(@Body() payload: BulkReactionsDto) {
    return this.service.addBulk(
      payload.jobIds.map((id) => BigInt(id)),
      payload.profileId,
      payload.reaction,
      payload.note,
      payload.occurredAt,
    );
  }

  /**
   * Get the reaction timeline for a job/profile pair.
   *
   * @param jobId - Job id.
   * @param profileId - Profile id.
   */
  @Get(':jobId/timeline')
  @ApiOperation({ summary: 'Get the reaction timeline for a job/profile pair' })
  @ApiParam({ name: 'jobId', description: 'Job id (bigint as string).', example: '42' })
  @ApiQuery({ name: 'profileId', description: 'Profile id.', required: true, type: Number })
  @ApiOkResponse({ type: JobReactionEventResponse, isArray: true })
  public async timeline(@Param('jobId') jobId: string, @Query('profileId') profileId: string) {
    return this.service.timeline(BigInt(jobId), Number(profileId));
  }
}
