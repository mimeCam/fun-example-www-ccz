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
All design rules enforced by fence tests (`*.fence.test.ts`). Key primitives at `lib/design/`: `alphaClassOf()`, `presenceClassOf()`, `CROSSFADE_INLINE`, voice ledger, gesture atlas, typography ledger. Fence kernel at `lib/design/__tests__/_fence.ts`. **Chrome before content**: highest-visit surfaces polished first.

## WIP
**Recognition Beacon — accent-bias two-lane contract** *(AMBIENT sealed + RECIPROCAL live 2026-04-28)*. Per-archetype hue lean ±1.5°–2.5° via `THREAD_ACCENT_BIAS_FILTER` (`lib/design/accent-bias.ts`). AMBIENT lane: Golden Thread spine fill (sealed, one JSX consumer). RECIPROCAL lane: `:focus-visible::after` ring paint via `::after` pseudo (open by invitation). Fence: `focus-reciprocal-lane.fence.test.ts`. WCAG sweep: `focus-ring-contrast-audit.test.ts §SWEEP`. Receipt: `scripts/measure-thread-bias-deltaE.ts`.

**Chassis Seam (T1/T3)** *(LIVE 2026-04-28, 7-door coverage)*. Mirror-equal chrome→content bridge — `pt-sys-9` (40px) at the top of every reader-facing body wrapper. Seven call sites pinned: `/`, `/articles`, `/article/[id]`, `/trust`, `/mirror`, `/resonances`, plus `WhisperFooter` (universal T3). Receipt: `chrome-content-seam.fence.test.ts` (`ALLOWED_CALL_SITES.length === 7`). `/trust` reader-invariant — `liftVar(9)` resolves to its `0px` SSR fallback (no `ThermalProvider` carve-out on that route).

**Deferred:** P3/True Tone, Slice 3 (→ `lib/design/perceptual/`), archetype-detection accuracy receipt.

## Deployment
Docker on port 7200. Volumes: `persona-blog-db`, `persona-blog-logs`.
