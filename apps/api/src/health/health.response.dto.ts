/**
 * @module health.response.dto
 *
 * Response DTO for the health endpoint. Mirrors the `HealthStatus` interface
 * for OpenAPI documentation only.
 */
import { ApiProperty } from '@nestjs/swagger';

/**
 * Health check response body.
 */
export class HealthStatusResponse {
  /** Static status marker; always `"ok"` when the process is serving. */
  @ApiProperty({
    description: 'Static status marker; always "ok" when the process is serving.',
    enum: ['ok'],
    example: 'ok',
  })
  public status!: 'ok';

  /** ISO-8601 timestamp of the response, for staleness checks in monitors. */
  @ApiProperty({
    description: 'ISO-8601 timestamp of the response, for staleness checks in monitors.',
    type: String,
    format: 'date-time',
  })
  public timestamp!: string;
}
