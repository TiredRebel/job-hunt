# web-settings

Settings multi-zone **remote** — owns `/{locale}/sources`, `/dictionaries`,
`/profile`, and `/settings/llm`. Real feature UI (migrated from `apps/web`).

|                 |                                       |
| --------------- | ------------------------------------- |
| **Port**        | `3003`                                |
| **basePath**    | _(none; routes include `[locale]/…`)_ |
| **assetPrefix** | `/settings-static`                    |

# Messages

Full `messages/en.json` and `messages/uk.json` catalogs are **duplicated** into
this remote (same pattern as `web-jobs` / `web-board`) for next-intl. Prefer
extracting a shared `packages/web-i18n` in a later cutover; until then keep
catalogs in sync when editing copy.

## Dev

```bash
npm run dev --workspace=web-settings
```

Reachable via shell at `http://localhost:3100/en/sources` (and related settings
paths) when `web-shell` is running.
