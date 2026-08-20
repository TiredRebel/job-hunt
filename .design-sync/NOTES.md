# design-sync notes — job-hunter

Repo-specific gotchas for future syncs. Read this before re-running.

## What the design system is here

`apps/web` is a **Next.js application, not a published component library**. There is no
component `dist/`, so this sync does not follow the usual "point at the built package" path:

- `apps/web/ds-entry.mjs` (committed) is the DS's public surface — the 18 `ui/` primitives
  plus `ScoreBadge` / `StageBadge`, which carry the score-tier and reaction-stage scales.
  Passed as `--entry`, which also anchors `PKG_DIR` to `apps/web` (without it the converter
  looks for `node_modules/web` and every package-relative config path shifts).
- `apps/web/ds-preview-shim.tsx` (committed) exports `DsPreviewProvider` — `next-intl` +
  `TooltipProvider`. `cfg.provider.component` must name a **bundle export**, which is why the
  shim is re-exported from `ds-entry.mjs` rather than wired through `extraEntries`.
  Messages are imported inside the shim, not passed as config props, so the locale JSON
  exists once in the bundle instead of being inlined into every card.
- Deliberately narrow: the converter's synth-entry fallback re-exports every `.tsx` under
  `src/`, which drags Next routing, TanStack Query and the API client into the bundle.

## The build loop — three commands, in this order

```sh
# 1. compile the stylesheet (cssEntry must exist before the converter runs)
node .ds-sync/node_modules/@tailwindcss/cli/dist/index.mjs \
  -i apps/web/ds-tailwind.css -o apps/web/.ds-styles.css
# 2. full build (also COPIES the stylesheet into the bundle)
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules E:/job-hunter/node_modules --out ./ds-bundle
# 3. validate
node .ds-sync/package-validate.mjs ./ds-bundle
```

- **`--node-modules` is the repo root, not `apps/web/node_modules`.** npm workspaces hoist
  everything; `apps/web/node_modules` has no `react`.
- **`preview-rebuild.mjs` does NOT re-copy the stylesheet.** This cost a debugging cycle:
  after authoring previews that introduced classes the app itself never uses (`gap-2.5`,
  `max-w-sm`), the cards rendered with the stylesheet compiled _before_ those previews
  existed, so the rules were missing and `gap` computed as `normal` despite the utility
  being present in `apps/web/.ds-styles.css`. **After authoring or editing any preview, run
  the full `package-build.mjs`, not just `preview-rebuild.mjs`.**
- `ds-tailwind.css` carries `@source '../../.design-sync/previews'` so classes used only in
  preview cards get generated. Without it the same failure returns.
- Playwright: chromium **1228** is already cached and matches the repo's `@playwright/test`
  pin (1.61.1). No install needed. `playwright` resolves from the repo root into `.ds-sync/`.

## Fonts

`next/font/google` self-hosts Geist Sans + JetBrains Mono into `.next/static/media/`, which
is gitignored — so the woff2 files and a rewritten `@font-face` sheet were copied into
`.design-sync/assets/fonts/` (13 rules, 11 files, 178 KB) and committed. **The Cyrillic
`unicode-range` blocks are load-bearing** — the UK locale renders through them.

## Pre-existing repo issues found during this sync (NOT caused by it)

- **`next build` fails on `master`.** `apps/web/src/components/dictionaries/dict-editor.tsx:38`
  uses the dictionary kind `'exclude_employer'`, which exists in the API domain model
  (`apps/api/src/domain/keyword-dictionary.model.ts`) but is **absent from `openapi.json`**,
  so the generated types reject it. Verified present at `2194591` too — it predates the
  design-sync work and the `fix/jobs-triage-metrics-search-sort` branch. Turbo's cached
  `tsc --noEmit` hides it, which is why CI stays green. This is why the stylesheet is
  compiled with the Tailwind CLI rather than harvested from a Next build.
- **`Checkbox` renders the same icon for `checked` and `indeterminate`.**
  `ui/checkbox.tsx` always renders `<Check>` inside `CheckboxPrimitive.Indicator` with no
  branch on `data-state`. In the jobs table header this makes "some rows selected" visually
  identical to "all rows selected". The preview shows this honestly rather than faking a
  dash. A one-line fix in the component (render `<Minus>` when indeterminate) would resolve it.

## Known render warns

None outstanding — the final validate run was clean (20/20, zero warnings). Two things a
future run might flag that are legitimate:

- `Badge` `Variants`: `default` (filled) and `outline` (border only) are a deliberately
  subtle axis in `badge.tsx`. Faithful, not a broken preview.
- `Command` `NoResults`: cmdk ignores `defaultValue` on `CommandInput`, so the field shows
  its placeholder. The empty branch — the point of the cell — still renders.

## Re-sync risks

- **`apps/web/.ds-styles.css` is gitignored and must be recompiled** before every build.
  A re-sync that skips step 1 either fails on a missing `cssEntry` or ships a stale sheet.
- **`ds-entry.mjs` and `componentSrcMap` must stay in step.** Adding a `ui/` component
  requires editing both; the entry controls what is in the bundle, the map controls what
  gets a card.
- **The shim duplicates app knowledge.** `DsPreviewProvider` hardcodes `locale="en"` and
  `timeZone="Europe/Kyiv"`. If the app's provider setup changes materially, this drifts.
- **Fonts are a point-in-time copy** from a July 2026 `next build`. If the app changes font
  families or `next/font` re-hashes the files, re-harvest from `.next/static/media/`.
- Grades live in the gitignored `.design-sync/.cache/`, but durable verification state is
  the `_ds_sync.json` uploaded to project `c5cb6399-984c-4e88-a33b-41cdebf496c7` (pinned as
  `projectId` in config.json). A re-sync fetches it to
  `.design-sync/.cache/remote-sync.json` and skips unchanged components — on any machine,
  cache or no cache. Re-sync is one command:
  `node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules E:/job-hunter/node_modules --entry apps/web/ds-entry.mjs --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json`
  **Recompile the stylesheet (step 1 above) before it** — the driver does not do that for you.
- The converter dep install warns that esbuild's postinstall was blocked; esbuild still
  works (the platform binary package installs directly). Not an error.
