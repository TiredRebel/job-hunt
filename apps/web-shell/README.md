# web-shell

Multi-zone **host** for the Job Hunter dashboard. Proxies locale-prefixed domain paths to remotes via Next.js `rewrites`. Not Module Federation. Not iframes.

|                  |                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Port (local)** | `3100` (preferred `3000` is held by Docker `jh-web`; `infra/docker-compose.yml` already allows `WEB_ORIGIN=…:3100`) |
| **basePath**     | _(none — host)_                                                                                                     |
| **assetPrefix**  | _(none — host)_                                                                                                     |

## Dev

```bash
npm run dev --workspace=web-shell
# or all MFE apps:
npm run dev:mfe
```

Override remote origins with `WEB_JOBS_ORIGIN`, `WEB_BOARD_ORIGIN`, `WEB_SETTINGS_ORIGIN` (defaults `http://localhost:3001|3002|3003`).

## Rewrite map

| Public path                                                    | Destination                             |
| -------------------------------------------------------------- | --------------------------------------- |
| `/api`, `/api/*`                                               | **this app** (`src/app/api/[...path]`)  |
| `/:locale/jobs`, `/:locale/jobs/*`                             | `web-jobs` (+ `/jobs-static/*`)         |
| `/:locale/board`, `/:locale/board/*`                           | `web-board` (+ `/board-static/*`)       |
| `/:locale/sources`, `/dictionaries`, `/profile`, `/settings/*` | `web-settings` (+ `/settings-static/*`) |

Monolith `apps/web` local dev uses port **3010** so it does not collide with the shell or Docker `:3000`. Playwright e2e for composed flows lives here (`npm run test:e2e`); default `PLAYWRIGHT_BASE_URL` is `http://localhost:3100`.
