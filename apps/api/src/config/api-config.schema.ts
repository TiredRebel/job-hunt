/**
 * @module api-config.schema
 *
 * Typed, validated environment contract for the API gateway. Uses Zod for
 * runtime parsing and TypeScript inference. All secrets are referenced by
 * name in the DB; env vars are the only place values live.
 */
import { z } from 'zod';

/**
 * Environment schema for the API gateway.
 */
export const apiEnvSchema = z.object({
  /** HTTP port the gateway listens on. */
  API_PORT: z
    .string()
    .default('4000')
    .transform((value) => Number.parseInt(value, 10))
    .pipe(z.number().int().min(1).max(65_535)),

  /** Full Postgres connection URL (database `jobhunter`). */
  DATABASE_URL: z.string().url().startsWith('postgres://'),

  /** Base URLs for downstream services. */
  SCRAPER_BASE_URL: z.string().url(),
  LLM_BASE_URL: z.string().url(),

  /** Shared secret for internal service calls. */
  INTERNAL_API_TOKEN: z.string().min(16),

  /** Log level (pino). */
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  /** Rate-limit window, in milliseconds (see `@nestjs/throttler`). */
  RATE_LIMIT_TTL: z
    .string()
    .default('60000')
    .transform((value) => Number.parseInt(value, 10))
    .pipe(z.number().int().positive()),

  /** Maximum requests per window per client, on public (non-internal-token) routes. */
  RATE_LIMIT_LIMIT: z
    .string()
    .default('120')
    .transform((value) => Number.parseInt(value, 10))
    .pipe(z.number().int().positive()),

  /** Max attempts for safe/idempotent downstream calls (scraper/LLM services). */
  DOWNSTREAM_RETRY_ATTEMPTS: z
    .string()
    .default('3')
    .transform((value) => Number.parseInt(value, 10))
    .pipe(z.number().int().positive()),
});

/** Inferred environment type. */
export type ApiEnv = z.infer<typeof apiEnvSchema>;
