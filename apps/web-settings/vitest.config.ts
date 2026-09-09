/**
 * @module vitest.config
 *
 * Vitest for the jobs remote: co-located specs under src/.
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
      enabled: false,
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
