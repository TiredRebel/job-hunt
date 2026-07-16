/**
 * @module sources.controller
 *
 * REST controllers for source administration and scrape run history.
 */
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { SourcesService } from './sources.service';
import { ListRunsQueryDto, SetSourceEnabledDto } from './sources.dto';
import { ScrapeRunResponse, SourceResponse } from './sources.response.dto';

/**
 * Sources API controller.
 */
@ApiTags('sources')
@Controller({ path: 'sources', version: '1' })
export class SourcesController {
  /**
   * Sources API controller.
   *
   * @param service - Sources application service.
   */
  public constructor(private readonly service: SourcesService) {}

  /**
   * List all sources.
   */
  @Get()
  @ApiOperation({ summary: 'List all sources' })
  @ApiOkResponse({ type: SourceResponse, isArray: true })
  public async list() {
    return this.service.list();
  }

  /**
   * Get a source by slug.
   *
   * @param slug - Source slug.
   */
  @Get(':slug')
  @ApiOperation({ summary: 'Get a source by slug' })
  @ApiParam({ name: 'slug', description: 'Source slug.', example: 'hh' })
  @ApiOkResponse({ type: SourceResponse })
  public async get(@Param('slug') slug: string) {
    return this.service.get(slug);
  }

  /**
   * Enable or disable a source.
   *
   * @param slug - Source slug.
   * @param payload - New enabled state.
   */
  @Patch(':slug/enabled')
  @ApiOperation({ summary: 'Enable or disable a source' })
  @ApiParam({ name: 'slug', description: 'Source slug.', example: 'hh' })
  @ApiBody({ type: SetSourceEnabledDto })
  @ApiOkResponse({ type: SourceResponse })
  public async setEnabled(@Param('slug') slug: string, @Body() payload: SetSourceEnabledDto) {
    return this.service.setEnabled(slug, payload.enabled);
  }

  /**
   * Trigger a scrape run for a source.
   *
   * @param slug - Source slug.
   */
  @Post(':slug/scrape')
  @ApiOperation({ summary: 'Trigger a scrape run for a source' })
  @ApiParam({ name: 'slug', description: 'Source slug.', example: 'hh' })
  @ApiCreatedResponse({ type: ScrapeRunResponse })
  public async triggerScrape(@Param('slug') slug: string) {
    return this.service.triggerScrape(slug);
  }

  /**
   * Get scrape run history for a source.
   *
   * @param slug - Source slug.
   * @param query - Pagination.
   */
  @Get(':slug/runs')
  @ApiOperation({ summary: 'Get scrape run history for a source' })
  @ApiParam({ name: 'slug', description: 'Source slug.', example: 'hh' })
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
  @ApiOkResponse({ type: ScrapeRunResponse, isArray: true })
  public async runs(@Param('slug') slug: string, @Query() query: ListRunsQueryDto) {
    const source = await this.service.get(slug);
    return this.service.runs(source.id, query.limit, query.offset);
  }
}
