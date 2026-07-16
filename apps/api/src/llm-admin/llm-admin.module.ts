/**
 * @module llm-admin.module
 *
 * Bounded context: LLM provider administration. Proxies list, active switch,
 * and connection test to the LLM service.
 */
import { Module } from '@nestjs/common';

import { LLM_ADMIN_CLIENT } from '../application/ports/llm-client.port';
import { HttpLlmAdminClient } from '../infrastructure/clients/http-llm-admin.client';
import { LlmAdminController } from './llm-admin.controller';
import { LlmAdminService } from './llm-admin.service';

/**
 * LLM administration bounded-context module.
 */
@Module({
  controllers: [LlmAdminController],
  providers: [
    LlmAdminService,
    {
      provide: LLM_ADMIN_CLIENT,
      useClass: HttpLlmAdminClient,
    },
  ],
})
export class LlmAdminModule {}
