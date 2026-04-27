# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/design/` — design ledgers, gesture atlas, chrome paint
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/detection/` — first-paint archetype heuristic
- `lib/mirror/` — Mirror snapshot store, `__rt=1` returner sentinel
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG
- `lib/return/` — recognition surface selector, recognition timeline, recognition paint (phase → opacity rung)
- `lib/hooks/` — shared React hooks
- `lib/engagement/` — loop-funnel, archetype-bucket
- `components/shared/` — shared primitives
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible.

## Design System Conventions
All design rules are enforced by fence tests (`*.fence.test.ts`, `*-fence.test.ts`). Key primitives: `ActionPressable`, `alphaClassOf()`, `swapWidthClassOf()`, `DismissButton`, `OverlayHeader`, `Divider`, `chromeMutedBorder()`. Voice ledger in `lib/design/`. Gesture atlas at `lib/design/gestures.ts`. Fence walker kernel at `lib/design/__tests__/_fence.ts` (two API surfaces: `runLinePatterns`, `runJsxBlocks`); old `_adoption-fence` / `_jsx-fence-walker` are now re-export shims.

## WIP
- Mechanical sweep: re-point ~13 remaining fence callers (caption-metric, numeric-features, filled-glyph-lift, swap-width on the line-pattern side; voice-call-site, alpha-call-site, divider, dismiss-verb, overlay-header, gesture-call-site, label-swap-width, action-receipt + allowlist on the jsx-call-site side) at the canonical `_fence.ts` and delete the two shims. Independent, mechanical, low-risk — out of scope for the consolidation commit.

## Deployment
Docker on port 7200. Volumes: `persona-blog-db`, `persona-blog-logs`.
