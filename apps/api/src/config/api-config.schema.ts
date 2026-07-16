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
});

/** Inferred environment type. */
export type ApiEnv = z.infer<typeof apiEnvSchema>;
