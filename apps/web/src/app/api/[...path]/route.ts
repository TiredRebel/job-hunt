/**
 * @module app/api/[...path]/route
 *
 * Same-origin proxy for browser → gateway calls. Client Components fetch
 * relative `/api/...` paths (so CORS never applies, whatever port the web
 * app runs on) and this handler forwards them to the gateway using the
 * server-side `API_URL` — read per request, not baked into the bundle at
 * build time the way `NEXT_PUBLIC_*` values are. Server Components keep
 * calling the gateway directly and never pass through here.
 */
import { getServerApiBaseUrl } from '@/lib/env';

/** Header name carrying the correlation id across every service hop. */
const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Safe correlation-id format: bounded length, restricted to characters that
 * cannot inject a forged header value or a fake log field further down the
 * chain. A browser-supplied value that doesn't match this is discarded in
 * favor of a freshly minted id, rather than forwarded verbatim.
 */
const VALID_CORRELATION_ID = /^[A-Za-z0-9_-]{1,128}$/;

/** Route context: catch-all segments of the requested API path. */
interface ProxyContext {
  readonly params: Promise<{ path: string[] }>;
}

/**
 * Forward one request to the gateway and stream the response back.
 *
 * `Content-Type` and the correlation id cross the boundary in either
 * direction — the gateway needs nothing else from the browser, and
 * hop-by-hop headers must not be blindly copied. A browser request with no
 * correlation id gets one minted here, so the id is present at the earliest
 * possible hop and shared by the gateway and everything it calls.
 *
 * @param request - Incoming request (standard `Request`; no Next specifics).
 * @param context - Route context carrying the catch-all path segments.
 * @returns The gateway response, or a 502 when the gateway is unreachable.
 */
async function proxyRequest(request: Request, context: ProxyContext): Promise<Response> {
  const { path } = await context.params;
  const base = getServerApiBaseUrl().replace(/\/$/, '');
  const { search } = new URL(request.url);
  const target = `${base}/${path.map(encodeURIComponent).join('/')}${search}`;

  const contentType = request.headers.get('content-type');
  const incomingCorrelationId = request.headers.get(CORRELATION_ID_HEADER);
  const correlationId =
    incomingCorrelationId !== null && VALID_CORRELATION_ID.test(incomingCorrelationId)
      ? incomingCorrelationId
      : crypto.randomUUID();
  const body =
    request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();

  let response: Response;
  try {
    response = await fetch(target, {
      method: request.method,
      headers: {
        [CORRELATION_ID_HEADER]: correlationId,
        ...(contentType !== null ? { 'Content-Type': contentType } : {}),
      },
      ...(body !== undefined && body.byteLength > 0 ? { body } : {}),
    });
  } catch {
    return Response.json(
      { message: 'API gateway unreachable' },
      { status: 502, headers: { [CORRELATION_ID_HEADER]: correlationId } },
    );
  }

  const headers = new Headers();
  const responseType = response.headers.get('content-type');
  if (responseType !== null) {
    headers.set('content-type', responseType);
  }
  headers.set(CORRELATION_ID_HEADER, response.headers.get(CORRELATION_ID_HEADER) ?? correlationId);
  return new Response(response.body, { status: response.status, headers });
}

/** Proxy GET requests to the gateway. */
export const GET = proxyRequest;

/** Proxy POST requests to the gateway. */
export const POST = proxyRequest;

/** Proxy PUT requests to the gateway. */
export const PUT = proxyRequest;

/** Proxy PATCH requests to the gateway. */
export const PATCH = proxyRequest;

/** Proxy DELETE requests to the gateway. */
export const DELETE = proxyRequest;
