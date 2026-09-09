# job-hunter web-jobs (Next.js remote).
# Build context: repo root.

FROM node:22-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/*/package.json ./apps/
COPY packages/*/package.json ./packages/
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY . .

ARG API_URL
ENV API_URL=${API_URL}
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npx turbo run build --filter=...web-jobs

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
RUN npm prune --omit=dev && chown -R node /app
USER node

WORKDIR /app/apps/web-jobs
EXPOSE 3001
CMD ["npm", "start"]

