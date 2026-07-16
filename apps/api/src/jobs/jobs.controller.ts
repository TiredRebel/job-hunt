/**
 * @module jobs.controller
 *
 * REST controllers for the jobs bounded context: list/filter/search, detail,
 * and status updates.
 */
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { JobsService } from './jobs.service';
import { ListJobsQueryDto, SetJobStatusDto } from './jobs.dto';
import { JobResponse, PaginatedJobsResponse } from './jobs.response.dto';

/**
 * Jobs API controller.
 */
@ApiTags('jobs')
@Controller({ path: 'jobs', version: '1' })
export class JobsController {
  /**
   * Jobs API controller.
   *
   * @param service - Jobs application service.
   */
  public constructor(private readonly service: JobsService) {}

  /**
   * List jobs with filters, date-interval filtering, full-text search, and
   * pagination.
   *
   * @param query - Query parameters.
   * @returns Paginated job list.
   */
  @Get()
  @ApiOperation({ summary: 'List jobs with filters, full-text search, and pagination' })
  @ApiOkResponse({ type: PaginatedJobsResponse })
  public async list(@Query() query: ListJobsQueryDto) {
    return this.service.list(query.toFilter());
  }

  /**
   * Get a single job by id.
   *
   * @param id - Job id.
   * @returns Job detail.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single job by id' })
  @ApiParam({ name: 'id', description: 'Job id (bigint as string).', example: '42' })
  @ApiOkResponse({ type: JobResponse })
  public async detail(@Param('id') id: string) {
    return this.service.detail(BigInt(id));
  }

  /**
   * Update the status of a job (archive, hide, restore).
   *
   * @param id - Job id.
   * @param payload - New status.
   * @returns Updated job.
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a job (archive, hide, restore)' })
  @ApiParam({ name: 'id', description: 'Job id (bigint as string).', example: '42' })
  @ApiBody({ type: SetJobStatusDto })
  @ApiOkResponse({ type: JobResponse })
  public async setStatus(@Param('id') id: string, @Body() payload: SetJobStatusDto) {
    return this.service.setStatus(BigInt(id), payload.status);
  }
}
