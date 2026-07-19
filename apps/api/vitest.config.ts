/**
 * @module vitest.config
 *
 * Vitest configuration for the API gateway: node environment, spec files
 * co-located with sources (`*.spec.ts`). Coverage is scoped to the
 * application/domain business logic — `*.service.ts` (the actual decision
 * logic per bounded context), guards, and cross-cutting interceptors —
 * mirroring CODING_STANDARDS.md's "supertest for controllers" split:
 * controllers, DTOs, modules, and infrastructure adapters are thin wiring
 * covered by a different (not-yet-added) test layer, not this gate. See
 * design.md D4 in openspec/changes/phase-7-hardening: thresholds are set
 * from measured coverage of this exact scope, not guessed.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/**/*.service.ts', 'src/**/*.guard.ts', 'src/common/**/*.interceptor.ts'],
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
    },
  },
});
