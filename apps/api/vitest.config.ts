/**
 * @module vitest.config
 *
 * Vitest configuration for the API gateway: node environment, spec files
 * co-located with sources (`*.spec.ts`).
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
