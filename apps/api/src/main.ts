/**
 * @module main
 *
 * API gateway entrypoint. Boots the NestJS application, wires global
 * configuration (port from `API_PORT`, default 4000) and starts the HTTP
 * listener. All feature modules are composed in {@link AppModule}.
 */
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

/**
 * Bootstraps the NestJS HTTP application.
 *
 * Reads the listen port from the `API_PORT` environment variable
 * (falling back to `4000`) and starts the server.
 *
 * @returns A promise that resolves once the HTTP listener is bound.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env['API_PORT'] ?? 4000);
  await app.listen(port);
}

void bootstrap();
