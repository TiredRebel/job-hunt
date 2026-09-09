/**
 * @module vitest.setup
 *
 * Registers Testing Library's DOM cleanup after each test. `vitest.config.ts`
 * runs with `globals: false`, so `@testing-library/react`'s cleanup
 * auto-detection (which checks for a global `afterEach`) never fires;
 * without this, a component test's `render()` output leaks into the next
 * test in the same file, breaking any query that expects a single match.
 */
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);
