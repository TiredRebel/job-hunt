/**
 * @module llm-admin.controller
 *
 * REST controllers for LLM provider administration.
 */
import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { LlmAdminService } from './llm-admin.service';
import { SetActiveProviderDto } from './llm-admin.dto';
import { LlmProviderResponse, TestConnectionResponse } from './llm-admin.response.dto';

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
   * Test connection to the active provider.
   */
  @Post('providers/test-connection')
  @ApiOperation({ summary: 'Test connection to the active LLM provider' })
  @ApiCreatedResponse({ type: TestConnectionResponse })
  public async testConnection() {
    const ok = await this.service.testConnection();
    return { ok };
  }
}
