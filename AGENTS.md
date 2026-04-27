# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/design/` — design ledgers, gesture atlas, chrome paint
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/detection/` — first-paint archetype heuristic
- `lib/mirror/` — Mirror snapshot store, `__rt=1` returner sentinel
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG
- `lib/return/` — recognition surface selector, recognition timeline, recognition paint (phase → opacity rung), recognition tempo (thermal-state → approach modulation)
- `lib/hooks/` — shared React hooks
- `lib/engagement/` — loop-funnel, archetype-bucket
- `components/shared/` — shared primitives
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible.

## Design System Conventions
All design rules are enforced by fence tests (`*.fence.test.ts`, `*-fence.test.ts`). Key primitives: `ActionPressable`, `alphaClassOf()`, `swapWidthClassOf()`, `DismissButton`, `OverlayHeader`, `Divider`, `chromeMutedBorder()`. Voice ledger in `lib/design/`. Gesture atlas at `lib/design/gestures.ts`. Fence walker kernel at `lib/design/__tests__/_fence.ts` is the single import surface for every fence test (two APIs: `runLinePatterns` for grep-shape line fences, `runJsxBlocks` for JSX `style={…}` block fences). The two prior shims (`_adoption-fence`, `_jsx-fence-walker`) have been retired.

## WIP
_(none — the fence-kernel sweep landed; future fences extend `_fence.ts` directly.)_

## Deployment
Docker on port 7200. Volumes: `persona-blog-db`, `persona-blog-logs`.
