/**
 * @module sources.controller
 *
 * REST controllers for source administration and scrape run history.
 */
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { SourcesService } from './sources.service';
import { ListRunsQueryDto, SetSourceEnabledDto } from './sources.dto';

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
  public async list() {
    return this.service.list();
  }

  /**
   * Get a source by slug.
   *
   * @param slug - Source slug.
   */
  @Get(':slug')
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
  public async setEnabled(@Param('slug') slug: string, @Body() payload: SetSourceEnabledDto) {
    return this.service.setEnabled(slug, payload.enabled);
  }

  /**
   * Trigger a scrape run for a source.
   *
   * @param slug - Source slug.
   */
  @Post(':slug/scrape')
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
  public async runs(@Param('slug') slug: string, @Query() query: ListRunsQueryDto) {
    const source = await this.service.get(slug);
    return this.service.runs(source.id, query.limit, query.offset);
  }
}
