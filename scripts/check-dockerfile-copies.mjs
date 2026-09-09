#!/usr/bin/env node
/**
 * Guard Docker COPY sources so workspace manifests stay aligned with the
 * repo tree. The MFE cutover left `apps/api/Dockerfile` copying retired
 * `apps/web/package.json`, which fails the Compose build immediately.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_WORKSPACE_MANIFESTS = [
  'apps/api/package.json',
  'apps/web-shell/package.json',
  'apps/web-jobs/package.json',
  'apps/web-board/package.json',
  'apps/web-settings/package.json',
  'packages/shared-ts/package.json',
  'packages/web-api/package.json',
  'packages/web-ui/package.json',
];

const NPM_WORKSPACE_DOCKERFILES = [
  'apps/api/Dockerfile',
  'apps/web-shell/Dockerfile',
  'apps/web-jobs/Dockerfile',
  'apps/web-board/Dockerfile',
  'apps/web-settings/Dockerfile',
];

/**
 * Recursively find Dockerfiles under `dir`.
 *
 * @param {string} dir - Directory to search.
 * @returns {string[]} Relative paths from the repo root.
 */
function findDockerfiles(dir) {
  /** @type {string[]} */
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'graphify-out') {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findDockerfiles(full));
      continue;
    }
    if (entry.name === 'Dockerfile' || entry.name.endsWith('.Dockerfile')) {
      found.push(full.slice(ROOT.length + 1).replaceAll('\\', '/'));
    }
  }
  return found;
}

/**
 * Parse COPY sources that come from the build context (not `--from`).
 *
 * @param {string} contents - Dockerfile text.
 * @returns {string[]} Source paths as written in the Dockerfile.
 */
function parseContextCopySources(contents) {
  /** @type {string[]} */
  const sources = [];
  const withoutLineContinuations = contents.replaceAll(/\\\r?\n/g, ' ');
  for (const line of withoutLineContinuations.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('COPY ') || trimmed.includes('--from=')) {
      continue;
    }
    const tokens = trimmed
      .slice('COPY '.length)
      .split(/\s+/)
      .filter((token) => token && !token.startsWith('--'));
    if (tokens.length < 2) {
      continue;
    }
    sources.push(...tokens.slice(0, -1));
  }
  return sources;
}

const errors = [];

for (const relative of findDockerfiles(ROOT)) {
  const contents = readFileSync(join(ROOT, relative), 'utf8');
  if (contents.includes('apps/web/package.json') || /COPY\s+apps\/web\//.test(contents)) {
    errors.push(`${relative} still references retired apps/web`);
  }
  if (/COPY\s+apps\/\*\/package\.json\s+\.\/apps\//.test(contents)) {
    errors.push(
      `${relative} flattens workspace manifests into ./apps/ (loses apps/<name>/package.json)`,
    );
  }
  if (/COPY\s+packages\/\*\/package\.json\s+\.\/packages\//.test(contents)) {
    errors.push(
      `${relative} flattens workspace manifests into ./packages/ (loses packages/<name>/package.json)`,
    );
  }
  // Compose uses the repo root as context for apps/* images and the service
  // directory for services/* images — resolve COPY sources the same way.
  const contextRoot = relative.startsWith('services/') ? dirname(join(ROOT, relative)) : ROOT;
  for (const source of parseContextCopySources(contents)) {
    if (source.includes('*') || source.startsWith('http')) {
      continue;
    }
    const abs = join(contextRoot, source);
    try {
      statSync(abs);
    } catch {
      errors.push(`${relative} COPY source does not exist: ${source}`);
    }
  }
}

for (const relative of NPM_WORKSPACE_DOCKERFILES) {
  const contents = readFileSync(join(ROOT, relative), 'utf8');
  if (!/^FROM deps AS build$/m.test(contents)) {
    errors.push(`${relative} must reuse the deps stage (\`FROM deps AS build\`) so npm ci is not discarded`);
  }
  for (const manifest of REQUIRED_WORKSPACE_MANIFESTS) {
    const copyLine = `COPY ${manifest} ${manifest}`;
    if (!contents.includes(copyLine)) {
      errors.push(`${relative} missing workspace manifest copy: ${copyLine}`);
    }
  }
}

if (errors.length > 0) {
  console.error('Dockerfile COPY check failed:\n' + errors.map((error) => `  - ${error}`).join('\n'));
  process.exit(1);
}

console.log(
  `Dockerfile COPY check passed (${NPM_WORKSPACE_DOCKERFILES.length} npm-workspace images, ${REQUIRED_WORKSPACE_MANIFESTS.length} manifests).`,
);
