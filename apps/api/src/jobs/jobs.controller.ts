/**
 * @module jobs.controller
 *
 * REST controllers for the jobs bounded context: list/filter/search, detail,
 * and status updates.
 */
import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { JobsService } from './jobs.service';
import { ListJobsQueryDto, SetJobStatusDto } from './jobs.dto';
import { JobDetailResponse, JobResponse, PaginatedJobsResponse } from './jobs.response.dto';
import { DeletedResponse } from '../common/common.response.dto';

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
  @ApiQuery({
    name: 'sources',
    required: false,
    type: String,
    description: 'Comma-separated source ids.',
    example: '1,3',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: String,
    description: 'Comma-separated tags.',
    example: 'typescript,node',
  })
  @ApiQuery({
    name: 'remote',
    required: false,
    type: String,
    description: 'Comma-separated remote values.',
    example: 'remote,hybrid',
  })
  @ApiQuery({
    name: 'seniority',
    required: false,
    type: String,
    description: 'Comma-separated seniority values.',
    example: 'senior,lead',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Comma-separated status values.',
    example: 'new,processed',
  })
  @ApiQuery({
    name: 'reaction',
    required: false,
    type: String,
    description: 'Comma-separated reaction stage values.',
    example: 'saved,applied',
  })
  @ApiQuery({
    name: 'scoreMin',
    required: false,
    type: Number,
    description: 'Minimum match score (0–100).',
  })
  @ApiQuery({
    name: 'scoreMax',
    required: false,
    type: Number,
    description: 'Maximum match score (0–100).',
  })
  @ApiQuery({ name: 'salaryMin', required: false, type: Number, description: 'Minimum salary.' })
  @ApiQuery({ name: 'salaryMax', required: false, type: Number, description: 'Maximum salary.' })
  @ApiQuery({
    name: 'dateField',
    required: false,
    enum: ['posted', 'first_seen'],
    enumName: 'DateField',
    description: 'Date field for interval filtering.',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Start of date interval (ISO 8601).',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    format: 'date-time',
    description: 'End of date interval (ISO 8601).',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    type: String,
    description: 'Full-text query over title + company + description.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Page size.',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Page offset.',
    example: 0,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['score', 'posted', 'salary', 'lastSeen', 'board'],
    enumName: 'JobSortBy',
    description: 'Sort column.',
  })
  @ApiQuery({
    name: 'sortDir',
    required: false,
    enum: ['asc', 'desc'],
    enumName: 'SortDir',
    description: 'Sort direction.',
  })
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
  @ApiOkResponse({ type: JobDetailResponse })
  @ApiNotFoundResponse({ description: 'Job not found.' })
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

  /**
   * Permanently delete a normalized job.
   *
   * @param id - Job id (bigint as string).
   * @returns Deletion confirmation.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete a job' })
  @ApiParam({ name: 'id', description: 'Job id (bigint as string).', example: '42' })
  @ApiOkResponse({ type: DeletedResponse })
  @ApiNotFoundResponse({ description: 'Job not found.' })
  public async remove(@Param('id') id: string): Promise<DeletedResponse> {
    return this.service.delete(BigInt(id));
  }
}
