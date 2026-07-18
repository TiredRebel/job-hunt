/**
 * @module llm-admin.controller
 *
 * REST controllers for LLM provider administration.
 */
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { LlmAdminService } from './llm-admin.service';
import { CreateLlmProviderDto, SetActiveProviderDto, UpdateLlmProviderDto } from './llm-admin.dto';
import {
  LlmProviderResponse,
  ModelListResponse,
  ProviderTestResponse,
} from './llm-admin.response.dto';

/**
 * LLM administration API controller.
 */
@ApiTags('llm-admin')
@Controller({ path: 'llm', version: '1' })
export class LlmAdminController {
  /**
   * LLM administration API controller.
   *
   * @param service - LLM administration application service.
   */
  public constructor(private readonly service: LlmAdminService) {}

  /**
   * List registered providers.
   */
  @Get('providers')
  @ApiOperation({ summary: 'List registered LLM providers' })
  @ApiOkResponse({ type: LlmProviderResponse, isArray: true })
  public async listProviders() {
    return this.service.listProviders();
  }

  /**
   * Switch the active provider.
   *
   * @param payload - Target provider slug.
   */
  @Put('providers/active')
  @ApiOperation({ summary: 'Switch the active LLM provider' })
  @ApiBody({ type: SetActiveProviderDto })
  @ApiOkResponse({ type: LlmProviderResponse })
  public async setActiveProvider(@Body() payload: SetActiveProviderDto) {
    return this.service.setActiveProvider(payload.slug);
  }

  /**
   * Register a new provider. Always created inactive.
   *
   * @param payload - New provider fields.
   */
  @Post('providers')
  @ApiOperation({ summary: 'Register a new LLM provider (created inactive)' })
  @ApiBody({ type: CreateLlmProviderDto })
  @ApiCreatedResponse({ type: LlmProviderResponse })
  public async createProvider(@Body() payload: CreateLlmProviderDto) {
    return this.service.createProvider(payload);
  }

  /**
   * Probe one provider's real backend, without touching the active row.
   *
   * @param slug - Provider slug.
   */
  @Post('providers/:slug/test')
  @HttpCode(200)
  @ApiOperation({ summary: 'Test connectivity for one LLM provider' })
  @ApiOkResponse({ type: ProviderTestResponse })
  public async testProvider(@Param('slug') slug: string) {
    return this.service.testProvider(slug);
  }

  /**
   * List models the provider currently reports.
   *
   * @param slug - Provider slug.
   */
  @Get('providers/:slug/models')
  @ApiOperation({ summary: 'List models available from one LLM provider' })
  @ApiOkResponse({ type: ModelListResponse })
  public async listModels(@Param('slug') slug: string) {
    return this.service.listModels(slug);
  }

  /**
   * Update a provider's configuration.
   *
   * @param slug - Provider slug.
   * @param payload - Fields to change.
   */
  @Patch('providers/:slug')
  @ApiOperation({ summary: 'Update an LLM provider configuration' })
  @ApiBody({ type: UpdateLlmProviderDto })
  @ApiOkResponse({ type: LlmProviderResponse })
  public async updateProvider(@Param('slug') slug: string, @Body() payload: UpdateLlmProviderDto) {
    return this.service.updateProvider(slug, payload);
  }

  /**
   * Permanently delete a provider. The active provider cannot be deleted.
   *
   * @param slug - Provider slug.
   */
  @Delete('providers/:slug')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an LLM provider (rejected for the active provider)' })
  @ApiNoContentResponse()
  public async deleteProvider(@Param('slug') slug: string): Promise<void> {
    await this.service.deleteProvider(slug);
  }
}
