/**
 * @module cover-letters.controller
 *
 * REST controller for reading and editing a job's cover-letter draft.
 * Nested under the jobs resource path but kept as its own bounded-context
 * module (mirrors the reactions/jobs split).
 */
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CoverLettersService } from './cover-letters.service';
import { SaveCoverLetterDto } from './cover-letters.dto';
import { CoverLetterResponse } from './cover-letters.response.dto';

/**
 * Cover-letters API controller.
 */
@ApiTags('cover-letters')
@Controller({ path: 'jobs/:jobId/cover-letter', version: '1' })
export class CoverLettersController {
  /**
   * Cover-letters API controller.
   *
   * @param service - Cover-letters application service.
   */
  public constructor(private readonly service: CoverLettersService) {}

  /**
   * Get the cover-letter draft for a job.
   *
   * @param jobId - Job id.
   * @returns The draft.
   */
  @Get()
  @ApiOperation({ summary: "Get a job's cover-letter draft" })
  @ApiParam({ name: 'jobId', description: 'Job id (bigint as string).', example: '42' })
  @ApiOkResponse({ type: CoverLetterResponse })
  @ApiNotFoundResponse({ description: 'No draft exists for this job yet.' })
  public async get(@Param('jobId') jobId: string) {
    return this.service.get(BigInt(jobId));
  }

  /**
   * Save an edited cover-letter draft body.
   *
   * @param jobId - Job id.
   * @param payload - Edited draft body.
   * @returns The saved draft.
   */
  @Put()
  @ApiOperation({ summary: 'Save an edited cover-letter draft body' })
  @ApiParam({ name: 'jobId', description: 'Job id (bigint as string).', example: '42' })
  @ApiBody({ type: SaveCoverLetterDto })
  @ApiOkResponse({ type: CoverLetterResponse })
  public async save(@Param('jobId') jobId: string, @Body() payload: SaveCoverLetterDto) {
    return this.service.save(BigInt(jobId), payload.body);
  }
}
