/**
 * @module jobs-route-bundle
 *
 * Build the web workspace, serve its production output, and measure the
 * compressed JavaScript referenced by the initial `/en/jobs` response.
 * Emit exactly one JSON object to stdout for the autoresearch metric parser.
 */

import { spawn, spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const evaluatorDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evaluatorDirectory, '..', '..');
const webRoot = path.join(projectRoot, 'apps', 'web');
const nextBinary = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
const port = Number.parseInt(process.env['AUTORESEARCH_PORT'] ?? '3137', 10);
const origin = `http://127.0.0.1:${port}`;

/** Return an environment that prevents network-dependent build behavior. */
function controlledEnvironment() {
  return {
    ...process.env,
    API_URL: 'http://127.0.0.1:9/v1',
    NEXT_PUBLIC_API_URL: 'http://127.0.0.1:9/v1',
    NEXT_TELEMETRY_DISABLED: '1',
    NODE_ENV: 'production',
  };
}

/** Build the web workspace and fail with a concise diagnostic. */
function buildWebApplication() {
  const executable = process.platform === 'win32' ? (process.env['ComSpec'] ?? 'cmd.exe') : 'npm';
  const arguments_ =
    process.platform === 'win32'
      ? ['/d', '/s', '/c', 'npm run build --workspace web']
      : ['run', 'build', '--workspace', 'web'];
  const result = spawnSync(executable, arguments_, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: controlledEnvironment(),
    timeout: 720_000,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const diagnostic = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim().slice(-8_000);
    throw new Error(`Production build failed.\n${diagnostic}`);
  }
}

/** Poll the jobs route until the production server returns HTML. */
async function waitForJobsPage(server) {
  const deadline = Date.now() + 90_000;
  let lastError;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Production server exited early with code ${server.exitCode}.`);
    }
    try {
      const response = await fetch(`${origin}/en/jobs`, { signal: AbortSignal.timeout(15_000) });
      if (response.ok) {
        return await response.text();
      }
      lastError = new Error(`Jobs route returned HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Production server did not become ready: ${String(lastError)}`);
}

/** Extract unique local JavaScript assets from the initial HTML response. */
function extractJavaScriptPaths(html) {
  const sources = new Set();
  const scriptPattern = /<script\b[^>]*\bsrc=["']([^"']+\.js(?:\?[^"']*)?)["'][^>]*>/giu;

  for (const match of html.matchAll(scriptPattern)) {
    const source = match[1];
    if (source.startsWith('/_next/')) {
      sources.add(source.split('?', 1)[0]);
    }
  }
  if (sources.size === 0) {
    throw new Error('No local JavaScript assets were found in the jobs response.');
  }
  return [...sources].sort();
}

/** Measure raw and deterministic gzip byte counts for route assets. */
async function measureAssets(assetPaths) {
  let rawBytes = 0;
  let gzipBytes = 0;

  for (const assetPath of assetPaths) {
    const relativePath = assetPath.replace(/^\/_next\//u, '');
    const filePath = path.join(webRoot, '.next', relativePath);
    await access(filePath);
    const content = await readFile(filePath);
    rawBytes += content.byteLength;
    gzipBytes += gzipSync(content, { level: 9, mtime: 0 }).byteLength;
  }
  return { rawBytes, gzipBytes };
}

/** Run the fixed evaluator and print its machine-readable summary. */
async function main() {
  if (!Number.isInteger(port) || port < 1024 || port > 65_535) {
    throw new Error(`AUTORESEARCH_PORT must be an integer from 1024 to 65535; received ${port}.`);
  }

  buildWebApplication();
  const server = spawn(process.execPath, [nextBinary, 'start', '--port', String(port)], {
    cwd: webRoot,
    env: controlledEnvironment(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    const html = await waitForJobsPage(server);
    const assets = extractJavaScriptPaths(html);
    const measurement = await measureAssets(assets);
    process.stdout.write(
      `${JSON.stringify({
        metrics: { jobs_route_gzip_bytes: measurement.gzipBytes },
        secondary: {
          jobs_route_raw_bytes: measurement.rawBytes,
          script_count: assets.length,
        },
        route: '/en/jobs',
      })}\n`,
    );
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
