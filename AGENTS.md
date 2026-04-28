# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/design/` — design ledgers, gesture atlas, chrome paint
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/detection/` — first-paint archetype heuristic
- `lib/mirror/` — Mirror snapshot store, `__rt=1` returner sentinel
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG
- `lib/return/` — recognition timeline, paint, tempo, beacon
- `lib/hooks/` — shared React hooks
- `lib/engagement/` — loop-funnel, archetype-bucket
- `components/shared/` — shared primitives
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible.

## Design System Conventions
All design rules enforced by fence tests (`*.fence.test.ts`). Key primitives: `ActionPressable`, `alphaClassOf()`, `swapWidthClassOf()`, `presenceClassOf()` (chrome-rhythm opacity gate — `gone | attentive | gifted`), `CROSSFADE_INLINE` (verb-named crossfade carrier — chrome-rhythm continuity contract, four call sites), `DismissButton`, `OverlayHeader`, `Divider`, `chromeMutedBorder()`. Voice ledger, gesture atlas, typography ledger (`wrapClassOf`, `FILLED_GLYPH_OPTICAL_LIFT_CLASS`, `EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE`), presence ledger (`presence.ts`) — all at `lib/design/`. Fence kernel at `lib/design/__tests__/_fence.ts` (`runLinePatterns` + `runJsxBlocks`). **Chrome before content**: highest-visit surfaces polished first; chrome-rhythm harness at `lib/design/presence.ts`.

## WIP
**Recognition Beacon — accent-bias on Golden Thread spine** *(rung 2 LIVE; dual baselines + warm-side white-point sensitivity pinned 2026-04-28)*. Per-archetype hue lean ±1.5°–2.5° via `THREAD_ACCENT_BIAS_FILTER` (`lib/design/accent-bias.ts`); warm whisper budget `[0.8, 1.8]` ΔE holds at D50/D55/D75; cool-side mirror deferred (D75 drift). Receipt: `scripts/measure-thread-bias-deltaE.ts`. **Deferred:** cool-side white-point re-scope, P3/True Tone, Slice 3 (→ `lib/design/perceptual/`), Tanya UIX #30 T1/T3 chassis polish.

## Deployment
Docker on port 7200. Volumes: `persona-blog-db`, `persona-blog-logs`.
