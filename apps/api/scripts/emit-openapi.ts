/**
 * @module emit-openapi
 *
 * Emits the OpenAPI document for the API gateway to `apps/api/openapi.json`
 * without starting an HTTP listener. Boots the Nest application context with
 * placeholder environment values (the `pg` pool is lazy, so no database
 * connection is made), builds the Swagger document with the same settings as
 * `main.ts`, and writes it to disk. Consumed by
 * `packages/shared-ts` to generate the typed client.
 *
 * Usage: `npm run openapi:emit` (from `apps/api`). Runs via `@swc-node/register`
 * so Nest constructor DI receives `design:paramtypes` (tsx/esbuild cannot).
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '../src/app.module';

/** Placeholder env values satisfying the config schema; never used for I/O. */
const PLACEHOLDER_ENV: Readonly<Record<string, string>> = {
  DATABASE_URL: 'postgres://placeholder:placeholder@localhost:5432/jobhunter',
  SCRAPER_BASE_URL: 'http://localhost:8001',
  LLM_BASE_URL: 'http://localhost:8002',
  INTERNAL_API_TOKEN: 'openapi-emit-placeholder-token',
};

/**
 * Build the OpenAPI document and write it to `apps/api/openapi.json`.
 *
 * @returns Promise resolving once the file is written and the app is closed.
 */
async function emit(): Promise<void> {
  for (const [key, value] of Object.entries(PLACEHOLDER_ENV)) {
    process.env[key] ??= value;
  }

  const app = await NestFactory.create(AppModule, { logger: false });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const config = new DocumentBuilder()
    .setTitle('job-hunter API')
    .setDescription(
      'Gateway for jobs, reactions, keyword dictionaries, profiles, LLM admin, and sources.',
    )
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Resolved from the package cwd (`npm run openapi:emit -w apps/api`),
  // not `import.meta.dirname` — that only works under ESM runners.
  const outPath = resolve(process.cwd(), 'openapi.json');
  writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await app.close();

  process.stdout.write(`OpenAPI document written to ${outPath}\n`);
}

void emit().catch((err: unknown) => {
  // NestFactory is created with `logger: false`, so DI/boot failures would
  // otherwise exit 1 with an empty console — print them explicitly.
  console.error(err);
  process.exitCode = 1;
});
