/**
 * @module sources.controller
 *
 * REST controllers for source administration and scrape run history.
 */
import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
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
import {
  CreateSourceDto,
  ListRunsQueryDto,
  SetSourceEnabledDto,
  UpdateSourceDto,
} from './sources.dto';
import {
  AdapterListResponse,
  ScrapeRunResponse,
  SourceResponse,
  SourceTestResponse,
} from './sources.response.dto';

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
   * List source slugs with a registered scraper adapter.
   *
   * Declared before `GET :slug` — a static segment after a dynamic one in
   * the same controller only routes correctly if it's registered first,
   * otherwise Nest would treat "adapters" as a `:slug` value.
   */
  @Get('adapters')
  @ApiOperation({ summary: 'List source slugs with a registered scraper adapter' })
  @ApiOkResponse({ type: AdapterListResponse })
  public async adapters() {
    return { slugs: await this.service.adapters() };
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
   * Create a source.
   *
   * @param payload - New source data.
   */
  @Post()
  @ApiOperation({ summary: 'Create a source' })
  @ApiBody({ type: CreateSourceDto })
  @ApiCreatedResponse({ type: SourceResponse })
  public async create(@Body() payload: CreateSourceDto) {
    return this.service.create(payload);
  }

  /**
   * Update a source's fields (slug excluded — immutable).
   *
   * @param slug - Source slug.
   * @param payload - Fields to change.
   */
  @Patch(':slug')
  @ApiOperation({ summary: "Update a source's fields" })
  @ApiParam({ name: 'slug', description: 'Source slug.', example: 'hh' })
  @ApiBody({ type: UpdateSourceDto })
  @ApiOkResponse({ type: SourceResponse })
  public async update(@Param('slug') slug: string, @Body() payload: UpdateSourceDto) {
    return this.service.update(slug, payload);
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
   * Test connectivity for a source, without persisting anything.
   *
   * A failing outcome (`no_adapter`/`unsupported_strategy`/`blocked`/
   * `failed`) is still an HTTP 200 — the test itself succeeded in producing
   * an answer; only an unreachable scraper service maps to 502.
   *
   * @param slug - Source slug.
   */
  @Post(':slug/test')
  @HttpCode(200)
  @ApiOperation({ summary: 'Test connectivity for a source' })
  @ApiParam({ name: 'slug', description: 'Source slug.', example: 'hh' })
  @ApiOkResponse({ type: SourceTestResponse })
  public async test(@Param('slug') slug: string) {
    return this.service.test(slug);
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
