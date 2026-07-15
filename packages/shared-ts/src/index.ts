/**
 * @module shared-ts
 *
 * Shared TypeScript contracts between the API gateway and the web app.
 * Will host the OpenAPI-generated client (Phase 4) plus hand-written
 * cross-cutting types. Keep runtime code out of this package — types and
 * pure helpers only.
 */

/** Application stages a vacancy can be in (mirrors `job_reactions.stage`). */
export type ReactionStage = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

/** Supported UI locales. */
export type Locale = 'en' | 'uk';
