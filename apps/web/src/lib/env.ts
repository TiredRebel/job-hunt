/**
 * @module lib/env
 *
 * Zod-validated environment contract for the web app. Two base URLs are
 * required because Next.js only inlines `NEXT_PUBLIC_*` vars into the
 * browser bundle; server-only code should prefer {@link getServerApiBaseUrl}
 * so the value never needs to be public.
 */
import { z } from 'zod';

const serverEnvSchema = z.object({
  API_URL: z.string().url(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
});

/**
 * Resolve the API base URL for use in Server Components, route handlers, and
 * other code that only ever runs on the server.
 *
 * @returns The validated `API_URL` value.
 * @throws Error when `API_URL` is missing or not a valid URL.
 */
export function getServerApiBaseUrl(): string {
  const parsed = serverEnvSchema.safeParse({ API_URL: process.env['API_URL'] });
  if (!parsed.success) {
    throw new Error(
      `Invalid web environment: ${parsed.error.issues.map((issue) => issue.message).join(', ')}`,
    );
  }
  return parsed.data.API_URL;
}

/**
 * Resolve the API base URL for use in Client Components (browser-executed
 * code). Backed by the build-time inlined `NEXT_PUBLIC_API_URL` value.
 *
 * @returns The validated `NEXT_PUBLIC_API_URL` value.
 * @throws Error when `NEXT_PUBLIC_API_URL` is missing or not a valid URL.
 */
export function getClientApiBaseUrl(): string {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'],
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid web environment: ${parsed.error.issues.map((issue) => issue.message).join(', ')}`,
    );
  }
  return parsed.data.NEXT_PUBLIC_API_URL;
}

/**
 * Resolve the API base URL appropriate for the current execution context
 * (server vs. browser).
 *
 * @returns The API base URL.
 */
export function getApiBaseUrl(): string {
  return typeof window === 'undefined' ? getServerApiBaseUrl() : getClientApiBaseUrl();
}
