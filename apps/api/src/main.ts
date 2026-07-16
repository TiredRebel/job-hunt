/**
 * @module main
 *
 * API gateway entrypoint. Boots the NestJS application, wires global
 * configuration (port from `API_PORT`, default 4000), Swagger/OpenAPI,
 * validation pipe, structured logging, and starts the HTTP listener. All
 * feature modules are composed in {@link AppModule}.
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

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
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('job-hunter API')
    .setDescription(
      'Gateway for jobs, reactions, keyword dictionaries, profiles, LLM admin, and sources.',
    )
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = Number(process.env['API_PORT'] ?? 4000);
  await app.listen(port);
}

void bootstrap();
