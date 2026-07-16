/**
 * @module jobs.controller
 *
 * REST controllers for the jobs bounded context: list/filter/search, detail,
 * and status updates.
 */
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';

import { JobsService } from './jobs.service';
import { ListJobsQueryDto, SetJobStatusDto } from './jobs.dto';

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
  @ApiQuery({ name: 'date_field', required: false, enum: ['posted', 'first_seen'] })
  @ApiQuery({ name: 'date_from', required: false })
  @ApiQuery({ name: 'date_to', required: false })
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
  public async setStatus(@Param('id') id: string, @Body() payload: SetJobStatusDto) {
    return this.service.setStatus(BigInt(id), payload.status);
  }
}
