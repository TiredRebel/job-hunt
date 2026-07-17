# job-hunter web dashboard (Next.js).
# Build context: repo root, e.g. `docker build -f apps/web/Dockerfile .`
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
# NEXT_PUBLIC_* vars are inlined into the browser bundle at build time, not
# read at container runtime — setting this only in docker-compose.yml's
# `environment:` block (i.e. after the image is built) has no effect on the
# shipped client bundle. Must be passed as a --build-arg.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# `...web` builds web AND its workspace dependency (@job-hunter/shared-ts)
# first, per turbo.json's build.dependsOn=["^build"].
RUN npx turbo run build --filter=...web

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
RUN npm prune --omit=dev && chown -R node /app
USER node

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "start"]
