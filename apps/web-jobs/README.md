# web-jobs

Jobs multi-zone **remote** — owns `/{locale}/jobs` (list, detail, dead-letter). Real feature UI (migrated from `apps/web`).

|                 |                                          |
| --------------- | ---------------------------------------- |
| **Port**        | `3001`                                   |
| **basePath**    | _(none; routes include `[locale]/jobs`)_ |
| **assetPrefix** | `/jobs-static`                           |

# Messages

Full `messages/en.json` and `messages/uk.json` catalogs are **duplicated** into
this remote (and `web-board`) for next-intl. Prefer extracting a shared
`packages/web-i18n` in a later cutover; until then keep catalogs in sync when
editing copy.

## Dev

```bash
npm run dev --workspace=web-jobs
```

Reachable via shell at `http://localhost:3100/en/jobs` when `web-shell` is running.
