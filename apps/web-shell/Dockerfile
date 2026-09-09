# job-hunter web-shell (Next.js).
# Build context: repo root. This repo is an npm-workspaces monorepo, so
# `npm ci` needs the workspace package manifests + lockfile.
#
# Docker build-time env:
# - WEB_JOBS_ORIGIN / WEB_BOARD_ORIGIN / WEB_SETTINGS_ORIGIN must be set
#   because `apps/web-shell/next.config.ts` reads them when building the
#   rewrite table.

FROM node:22-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web-shell/package.json apps/web-shell/package.json
COPY apps/web-jobs/package.json apps/web-jobs/package.json
COPY apps/web-board/package.json apps/web-board/package.json
COPY apps/web-settings/package.json apps/web-settings/package.json
COPY packages/shared-ts/package.json packages/shared-ts/package.json
COPY packages/web-api/package.json packages/web-api/package.json
COPY packages/web-ui/package.json packages/web-ui/package.json
RUN npm ci

FROM deps AS build
COPY . .

ARG WEB_JOBS_ORIGIN
ENV WEB_JOBS_ORIGIN=${WEB_JOBS_ORIGIN}
ARG WEB_BOARD_ORIGIN
ENV WEB_BOARD_ORIGIN=${WEB_BOARD_ORIGIN}
ARG WEB_SETTINGS_ORIGIN
ENV WEB_SETTINGS_ORIGIN=${WEB_SETTINGS_ORIGIN}

RUN npx turbo run build --filter=...web-shell

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
RUN npm prune --omit=dev && chown -R node /app
USER node

WORKDIR /app/apps/web-shell
EXPOSE 3100
CMD ["npm", "start"]
