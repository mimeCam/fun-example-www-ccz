# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/design/` — design ledgers, gesture atlas, chrome paint
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/detection/` — first-paint archetype heuristic
- `lib/mirror/` — Mirror snapshot store, `__rt=1` returner sentinel
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG
- `lib/return/` — recognition surface selector, recognition timeline, recognition paint (phase → opacity rung), recognition tempo (thermal-state → approach modulation), recognition beacon (paint-zero archetype/tier primer → `<html>` data-attrs)
- `lib/hooks/` — shared React hooks
- `lib/engagement/` — loop-funnel, archetype-bucket
- `components/shared/` — shared primitives
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible.

## Design System Conventions
All design rules enforced by fence tests (`*.fence.test.ts`). Key primitives: `ActionPressable`, `alphaClassOf()`, `swapWidthClassOf()`, `presenceClassOf()` (chrome-rhythm opacity gate — `gone | attentive | gifted`), `CROSSFADE_INLINE` (verb-named crossfade carrier — chrome-rhythm continuity contract, four call sites), `DismissButton`, `OverlayHeader`, `Divider`, `chromeMutedBorder()`. Voice ledger, gesture atlas, typography ledger (`wrapClassOf`, `FILLED_GLYPH_OPTICAL_LIFT_CLASS`, `EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE`), presence ledger (`presence.ts`) — all at `lib/design/`. Fence kernel at `lib/design/__tests__/_fence.ts` (`runLinePatterns` + `runJsxBlocks`). **Chrome before content**: highest-visit surfaces polished first; chrome-rhythm harness at `lib/design/presence.ts`.

## WIP
**Recognition Beacon — paint-zero contract shipped, surfaces pending.** `lib/return/recognition-beacon.ts` writes `data-recognition-tier` / `data-archetype` / `--accent-bias` / `--thread-alpha-pre` on `<html>` < 5 ms before paint. CSS variables are reserved but **dormant**. Follow-up: wire `--thread-alpha-pre` into `GoldenThread` gone-state opacity; apply `--accent-bias` to archetype-tinted chrome.

## Deployment
Docker on port 7200. Volumes: `persona-blog-db`, `persona-blog-logs`.
