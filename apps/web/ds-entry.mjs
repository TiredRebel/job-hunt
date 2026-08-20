// Design-system entry for the `/design-sync` skill.
//
// apps/web is a Next.js app, not a published component library, so there is no
// `dist/` to point the converter at. This file is the design system's public
// surface: the shadcn/ui primitives plus the two components that carry Job
// Hunter's own visual language (score tiers, reaction-stage colors).
//
// Deliberately narrow. The converter's fallback would re-export every .tsx
// under src/, dragging Next routing, TanStack Query and the API client into
// the bundle — none of which a design agent can use.
//
// Keep in sync with `componentSrcMap` in .design-sync/config.json.

export * from './src/components/ui/badge.tsx';
export * from './src/components/ui/button.tsx';
export * from './src/components/ui/checkbox.tsx';
export * from './src/components/ui/command.tsx';
export * from './src/components/ui/dialog.tsx';
export * from './src/components/ui/dropdown-menu.tsx';
export * from './src/components/ui/input.tsx';
export * from './src/components/ui/label.tsx';
export * from './src/components/ui/popover.tsx';
export * from './src/components/ui/select.tsx';
export * from './src/components/ui/separator.tsx';
export * from './src/components/ui/sheet.tsx';
export * from './src/components/ui/skeleton.tsx';
export * from './src/components/ui/slider.tsx';
export * from './src/components/ui/switch.tsx';
export * from './src/components/ui/table.tsx';
export * from './src/components/ui/textarea.tsx';
export * from './src/components/ui/tooltip.tsx';

export * from './src/components/score-badge.tsx';
export * from './src/components/stage-badge.tsx';

// Preview context (next-intl + TooltipProvider) — referenced by cfg.provider,
// which requires its component to be an export of this bundle.
export * from './ds-preview-shim.tsx';
