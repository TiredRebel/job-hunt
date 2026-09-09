# web-board

Board multi-zone **remote** — owns `/{locale}/board`. Real feature UI (migrated from `apps/web`).

|                 |                                           |
| --------------- | ----------------------------------------- |
| **Port**        | `3002`                                    |
| **basePath**    | _(none; routes include `[locale]/board`)_ |
| **assetPrefix** | `/board-static`                           |

# Messages

Full `messages/en.json` and `messages/uk.json` catalogs are **duplicated** into
this remote (and `web-jobs`) for next-intl. Prefer extracting a shared
`packages/web-i18n` in a later cutover; until then keep catalogs in sync when
editing copy.

## Dev

```bash
npm run dev --workspace=web-board
```

Reachable via shell at `http://localhost:3100/en/board` when `web-shell` is running.
