/**
 * @module lib/api/query-keys
 *
 * Centralized TanStack Query key factory so cache invalidation stays
 * consistent across pages/mutations. Filter objects are included verbatim
 * in list keys — Query does a structural compare, so equivalent filters
 * dedupe automatically.
 */
import type { JobsListParams } from './jobs';

/** Query key factory, namespaced by resource. */
export const queryKeys = {
  jobs: {
    all: ['jobs'] as const,
    list: (params: JobsListParams) => ['jobs', 'list', params] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
    coverLetter: (id: string) => ['jobs', 'cover-letter', id] as const,
  },
  reactions: {
    timeline: (jobId: string, profileId: string) =>
      ['reactions', 'timeline', jobId, profileId] as const,
  },
  profiles: {
    all: ['profiles'] as const,
    active: ['profiles', 'active'] as const,
    detail: (id: string) => ['profiles', 'detail', id] as const,
  },
  dictionaries: {
    all: ['dictionaries'] as const,
    list: (kind?: string) => ['dictionaries', 'list', kind] as const,
    detail: (slug: string) => ['dictionaries', 'detail', slug] as const,
  },
  llm: {
    providers: ['llm', 'providers'] as const,
    models: (slug: string) => ['llm', 'models', slug] as const,
  },
  sources: {
    all: ['sources'] as const,
    detail: (slug: string) => ['sources', 'detail', slug] as const,
    runs: (slug: string, params: { limit?: number; offset?: number }) =>
      ['sources', 'runs', slug, params] as const,
    adapters: ['sources', 'adapters'] as const,
  },
  settings: {
    notifications: ['settings', 'notifications'] as const,
  },
} as const;
