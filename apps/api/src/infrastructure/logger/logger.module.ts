/**
 * @module logger.module
 *
 * Global NestJS logging provider. Uses `nestjs-pino` to emit structured JSON
 * logs with request IDs, matching the observability contract in
 * docs/ARCHITECTURE.md §9.
 */
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import type { Params } from 'nestjs-pino';

import type { ApiConfig } from '../../config/api-config';

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
          return { pinoHttp: { level } };
        }
        return {
          pinoHttp: {
            level,
            transport: { target: 'pino-pretty', options: { singleLine: true } },
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
