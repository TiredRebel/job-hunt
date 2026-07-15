/**
 * @module health.controller
 *
 * Liveness endpoint used by docker-compose healthchecks and n8n workflows
 * to verify the gateway is up before triggering pipelines.
 */
import { Controller, Get } from '@nestjs/common';

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
@Controller('health')
export class HealthController {
  /**
   * Reports gateway liveness.
   *
   * @returns Current status and server timestamp.
   */
  @Get()
  public check(): HealthStatus {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
