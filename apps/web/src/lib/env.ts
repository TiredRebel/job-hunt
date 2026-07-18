/**
 * @module lib/env
 *
 * Environment contract for the web app's two API base URLs. Server-side
 * code talks to the gateway directly via `API_URL`; the browser defaults to
 * the same-origin `/api` proxy (see `app/api/[...path]/route.ts`), which
 * forwards to `API_URL` at request time — so no gateway address is baked
 * into the browser bundle and CORS never applies. `NEXT_PUBLIC_API_URL`
 * remains an optional override for pointing the browser straight at the
 * gateway (build-time inlined, requires the gateway's `WEB_ORIGIN` to allow
 * the web app's origin).
 */
import { z } from 'zod';

const DEFAULT_SERVER_API_URL = 'http://localhost:4000/v1';
const CLIENT_PROXY_BASE = '/api';

const urlSchema = z.string().url();

/**
 * Resolve the API base URL for use in Server Components, route handlers, and
 * other code that only ever runs on the server.
 *
 * @returns The validated `API_URL` value, defaulting to the local gateway.
 * @throws Error when `API_URL` is set but not a valid URL.
 */
export function getServerApiBaseUrl(): string {
  const value = process.env['API_URL'];
  if (value === undefined || value === '') {
    return DEFAULT_SERVER_API_URL;
  }
  const parsed = urlSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      `Invalid web environment: API_URL ${parsed.error.issues.map((issue) => issue.message).join(', ')}`,
    );
  }
  return parsed.data;
}

/**
 * Resolve the API base URL for use in Client Components (browser-executed
 * code). Defaults to the same-origin `/api` proxy; `NEXT_PUBLIC_API_URL`
 * (build-time inlined) overrides it for direct-to-gateway setups.
 *
 * @returns The browser-facing API base URL.
 * @throws Error when `NEXT_PUBLIC_API_URL` is set but not a valid URL.
 */
export function getClientApiBaseUrl(): string {
  const value = process.env['NEXT_PUBLIC_API_URL'];
  if (value === undefined || value === '') {
    return CLIENT_PROXY_BASE;
  }
  const parsed = urlSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      `Invalid web environment: NEXT_PUBLIC_API_URL ${parsed.error.issues.map((issue) => issue.message).join(', ')}`,
    );
  }
  return parsed.data;
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
