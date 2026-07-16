/**
 * @module keyword-dictionaries.controller
 *
 * REST controllers for keyword dictionary CRUD.
 */
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import type { DictionaryKind } from '../domain/keyword-dictionary.model';
import { KeywordDictionariesService } from './keyword-dictionaries.service';
import { CreateKeywordDictionaryDto, UpdateKeywordDictionaryDto } from './keyword-dictionaries.dto';
import { KeywordDictionaryResponse } from './keyword-dictionaries.response.dto';

/**
 * Keyword dictionaries API controller.
 */
@ApiTags('keyword-dictionaries')
@Controller({ path: 'keyword-dictionaries', version: '1' })
export class KeywordDictionariesController {
  /**
   * Keyword dictionaries API controller.
   *
   * @param service - Keyword dictionaries application service.
   */
  public constructor(private readonly service: KeywordDictionariesService) {}

  /**
   * List all dictionaries, optionally filtered by kind.
   *
   * @param kind - Optional kind filter.
   */
  @Get()
  @ApiOperation({ summary: 'List all dictionaries, optionally filtered by kind' })
  @ApiQuery({
    name: 'kind',
    required: false,
    enum: ['search', 'include', 'exclude', 'alias'],
    enumName: 'DictionaryKind',
    description: 'Optional kind filter.',
  })
  @ApiOkResponse({ type: KeywordDictionaryResponse, isArray: true })
  public async list(@Query('kind') kind?: DictionaryKind) {
    return this.service.list(kind);
  }

  /**
   * Get a dictionary by slug.
   *
   * @param slug - Dictionary slug.
   */
  @Get(':slug')
  @ApiOperation({ summary: 'Get a dictionary by slug' })
  @ApiParam({ name: 'slug', description: 'Dictionary slug.' })
  @ApiOkResponse({ type: KeywordDictionaryResponse })
  public async get(@Param('slug') slug: string) {
    return this.service.get(slug);
  }

  /**
   * Create a dictionary.
   *
   * @param payload - Dictionary data.
   */
  @Post()
  @ApiOperation({ summary: 'Create a dictionary' })
  @ApiBody({ type: CreateKeywordDictionaryDto })
  @ApiCreatedResponse({ type: KeywordDictionaryResponse })
  public async create(@Body() payload: CreateKeywordDictionaryDto) {
    return this.service.create(payload);
  }

  /**
   * Update a dictionary.
   *
   * @param slug - Dictionary slug.
   * @param payload - Partial update.
   */
  @Patch(':slug')
  @ApiOperation({ summary: 'Update a dictionary' })
  @ApiParam({ name: 'slug', description: 'Dictionary slug.' })
  @ApiBody({ type: UpdateKeywordDictionaryDto })
  @ApiOkResponse({ type: KeywordDictionaryResponse })
  public async update(@Param('slug') slug: string, @Body() payload: UpdateKeywordDictionaryDto) {
    return this.service.update(slug, payload);
  }

  /**
   * Delete a dictionary.
   *
   * @param slug - Dictionary slug.
   */
  @Delete(':slug')
  @ApiOperation({ summary: 'Delete a dictionary' })
  @ApiParam({ name: 'slug', description: 'Dictionary slug.' })
  @ApiOkResponse({ type: Boolean, description: '`true` on success.' })
  public async remove(@Param('slug') slug: string) {
    return this.service.remove(slug);
  }
}
