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
All design rules enforced by fence tests (`*.fence.test.ts`). Key primitives: `ActionPressable`, `alphaClassOf()`, `swapWidthClassOf()`, `presenceClassOf()` (chrome-rhythm opacity gate — `gone | attentive | gifted`), `CROSSFADE_INLINE` (verb-named crossfade carrier — chrome-rhythm continuity contract, four call sites), `DismissButton`, `OverlayHeader`, `Divider`, `chromeMutedBorder()`. Voice ledger, gesture atlas, typography ledger (`wrapClassOf`, `FILLED_GLYPH_OPTICAL_LIFT_CLASS`, `BASELINE_NUDGE_BY_GLYPH` — typed N=2 map keyed `externalGlyph` / `middleDot`), presence ledger (`presence.ts`) — all at `lib/design/`. Fence kernel at `lib/design/__tests__/_fence.ts` (`runLinePatterns` + `runJsxBlocks`). **Chrome before content**: highest-visit surfaces polished first; chrome-rhythm harness at `lib/design/presence.ts`.

## WIP
**Recognition Beacon — accent-bias on Golden Thread spine** *(rung 2 LIVE; cool-side closure tri-illuminant 2026-04-28)*. Per-archetype hue lean ±1.5°–2.5° via `THREAD_ACCENT_BIAS_FILTER` (`lib/design/accent-bias.ts`). Receipt: `scripts/measure-thread-bias-deltaE.ts`.

**Chassis Seam (T1/T3) — chrome→content bridge** *(LIVE 2026-04-28)*. `CHASSIS_SEAM_RUNG = 9` (40 px+) at the top edge of every route body and at `WhisperFooter`'s top — mirror-equal across `/`, `/articles`, `/article/[id]`. One handle (`CHASSIS_SEAM_TOP_CLASS`), four call sites, pinned by `chrome-content-seam.fence.test.ts`. Footer owns T3 ("not both" rule); article-detail wraps-and-strips TopBar's `pt-sys-7`.

**Deferred:** P3/True Tone, Slice 3 (→ `lib/design/perceptual/`), archetype-detection accuracy receipt.

## Deployment
Docker on port 7200. Volumes: `persona-blog-db`, `persona-blog-logs`.
