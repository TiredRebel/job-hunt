/**
 * @module lib/slug
 *
 * Shared slug validation for admin create forms (sources, LLM providers).
 * Mirrors the gateway DTOs' `@Matches(/^[a-z0-9-]+$/)` rule so invalid slugs
 * fail inline instead of round-tripping to a 400.
 */

/** Allowed slug shape: lowercase letters, digits, and hyphens only. */
export const SLUG_PATTERN = /^[a-z0-9-]+$/;
