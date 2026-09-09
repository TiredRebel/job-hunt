# job-hunter web-board (Next.js remote).
# Build context: repo root.

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

ARG API_URL
ENV API_URL=${API_URL}
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npx turbo run build --filter=...web-board

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
RUN npm prune --omit=dev && chown -R node /app
USER node

WORKDIR /app/apps/web-board
EXPOSE 3002
CMD ["npm", "start"]
