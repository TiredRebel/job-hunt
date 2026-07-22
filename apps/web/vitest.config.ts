/**
 * @module vitest.config
 *
 * Vitest configuration for the web app: jsdom environment (React component
 * tests), spec files co-located with sources (`*.spec.ts` / `*.spec.tsx`).
 * Coverage is scoped to `src/lib/**` — API clients, formatters, and hooks,
 * the app's only currently-tested logic layer. Components, pages, and UI
 * primitives have zero tests today (a known gap tracked separately, not
 * this gate's job to paper over) and are excluded rather than dragging the
 * ratio to near-zero. See design.md D4 in openspec/changes/phase-7-hardening:
 * the threshold is set from measured coverage of this exact scope.
 */
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/**/*.spec.ts', 'src/lib/**/types.ts'],
      thresholds: {
        statements: 49,
        branches: 85,
        functions: 80,
        lines: 49,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
