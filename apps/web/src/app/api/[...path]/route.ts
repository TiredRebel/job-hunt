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

/** Route context: catch-all segments of the requested API path. */
interface ProxyContext {
  readonly params: Promise<{ path: string[] }>;
}

/**
 * Forward one request to the gateway and stream the response back.
 *
 * Only the `Content-Type` header crosses the boundary in either direction —
 * the gateway needs nothing else from the browser, and hop-by-hop headers
 * must not be blindly copied.
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
  const body =
    request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();

  let response: Response;
  try {
    response = await fetch(target, {
      method: request.method,
      ...(contentType !== null ? { headers: { 'Content-Type': contentType } } : {}),
      ...(body !== undefined && body.byteLength > 0 ? { body } : {}),
    });
  } catch {
    return Response.json({ message: 'API gateway unreachable' }, { status: 502 });
  }

  const headers = new Headers();
  const responseType = response.headers.get('content-type');
  if (responseType !== null) {
    headers.set('content-type', responseType);
  }
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
