/**
 * @module repository.error
 *
 * Typed errors returned by repository implementations, kept framework-free so
 * controllers can map them to HTTP status codes.
 */

/**
 * Base class for repository-level failures.
 */
export class RepositoryError extends Error {}

/**
 * No row matched the requested identifier.
 */
export class NotFoundError extends RepositoryError {}

/**
 * A unique constraint or business rule was violated.
 */
export class ConflictError extends RepositoryError {}
