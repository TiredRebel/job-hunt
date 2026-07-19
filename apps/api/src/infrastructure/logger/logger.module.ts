/**
 * @module logger.module
 *
 * Global NestJS logging provider. Uses `nestjs-pino` to emit structured JSON
 * logs with request IDs, matching the observability contract in
 * docs/ARCHITECTURE.md §9.
 */
import type { ServerResponse } from 'node:http';

import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import type { Params } from 'nestjs-pino';

import type { ApiConfig } from '../../config/api-config';
import { CORRELATION_ID_HEADER, resolveCorrelationId } from './correlation-id';

/**
 * Adopt the incoming (or minted) correlation id as pino's request id, and
 * echo it on the response so the id is visible to the caller too.
 *
 * @param req - Incoming HTTP request.
 * @param res - Outgoing HTTP response.
 * @returns The resolved correlation id, used by pino as `req.id`.
 */
function genReqId(req: Parameters<typeof resolveCorrelationId>[0], res: ServerResponse): string {
  const id = resolveCorrelationId(req);
  res.setHeader(CORRELATION_ID_HEADER, id);
  return id;
}

/**
 * Global module wiring pino as the application logger.
 */
@Global()
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): Params => {
        const level = config.get<ApiConfig['LOG_LEVEL']>('api.LOG_LEVEL') ?? 'info';
        if (process.env['NODE_ENV'] === 'production') {
          return { pinoHttp: { level, genReqId } };
        }
        return {
          pinoHttp: {
            level,
            genReqId,
            transport: { target: 'pino-pretty', options: { singleLine: true } },
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
