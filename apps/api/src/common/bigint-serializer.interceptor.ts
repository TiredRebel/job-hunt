/**
 * @module bigint-serializer.interceptor
 *
 * Global response interceptor that converts `bigint` values to strings
 * before JSON serialization. Domain models use `bigint` for Postgres
 * `BIGINT` primary keys, but `JSON.stringify` throws a `TypeError` on
 * bigints — without this interceptor any endpoint returning a domain object
 * with a bigint id would crash at serialization time.
 *
 * Strings are used (rather than numbers) because bigints may exceed
 * `Number.MAX_SAFE_INTEGER`; response DTOs document these fields as
 * `type: String`.
 */
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Recursively converts every `bigint` in a value to its decimal string
 * representation, leaving all other values untouched.
 *
 * `Date` instances are returned as-is so `JSON.stringify` can apply their
 * native `toJSON` (converting them to plain objects would break ISO
 * serialization).
 *
 * @param value - Arbitrary response payload.
 * @returns The payload with all bigints replaced by strings.
 */
export function serializeBigInts(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeBigInts);
  }
  if (value instanceof Date) {
    return value;
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serializeBigInts(entry)]),
    );
  }
  return value;
}

/**
 * Interceptor applying {@link serializeBigInts} to every response payload.
 * Registered globally via `APP_INTERCEPTOR` in the root module.
 */
@Injectable()
export class BigIntSerializerInterceptor implements NestInterceptor {
  /**
   * Maps the handler's response stream through {@link serializeBigInts}.
   *
   * @param _context - Execution context (unused).
   * @param next - Downstream handler.
   * @returns The response stream with bigints stringified.
   */
  public intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data: unknown) => serializeBigInts(data)));
  }
}
