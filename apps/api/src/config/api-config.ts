/**
 * @module api-config
 *
 * NestJS configuration provider built from the validated environment schema.
 */
import { registerAs } from '@nestjs/config';

import { apiEnvSchema } from './api-config.schema';

/**
 * Configuration namespace used by {@link registerAs}.
 */
export const API_CONFIG_NAMESPACE = 'api';

/**
 * Validates `process.env` once and exposes a typed config object under the
 * `api` namespace. Fails fast at bootstrap if required variables are missing.
 */
export const apiConfig = registerAs(API_CONFIG_NAMESPACE, () => {
  const parsed = apiEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid API environment:\n${issues.join('\n')}`);
  }
  return parsed.data;
});

/** Convenience type alias for the validated config payload. */
export type ApiConfig = ReturnType<typeof apiConfig> extends infer R ? R : never;
