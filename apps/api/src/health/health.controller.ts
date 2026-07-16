/**
 * @module health.controller
 *
 * Liveness endpoint used by docker-compose healthchecks and n8n workflows
 * to verify the gateway is up before triggering pipelines.
 */
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { HealthStatusResponse } from './health.response.dto';

/** Shape of the health check response body. */
export interface HealthStatus {
  /** Static status marker; always `"ok"` when the process is serving. */
  readonly status: 'ok';
  /** ISO-8601 timestamp of the response, for staleness checks in monitors. */
  readonly timestamp: string;
}

/**
 * Exposes `GET /health` returning process liveness.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  /**
   * Reports gateway liveness.
   *
   * @returns Current status and server timestamp.
   */
  @Get()
  @ApiOperation({ summary: 'Report gateway liveness' })
  @ApiOkResponse({ type: HealthStatusResponse })
  public check(): HealthStatus {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
