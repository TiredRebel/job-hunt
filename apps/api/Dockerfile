# job-hunter API gateway (NestJS).
# Build context: repo root, e.g. `docker build -f apps/api/Dockerfile .`
# (needed because this is an npm-workspaces monorepo — `npm ci` requires the
# root lockfile plus every workspace's package.json to resolve correctly).

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-ts/package.json packages/shared-ts/package.json
RUN npm ci

FROM deps AS build
COPY . .
RUN npx turbo run build --filter=@job-hunter/api

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
RUN npm prune --omit=dev && chown -R node /app
USER node

EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
