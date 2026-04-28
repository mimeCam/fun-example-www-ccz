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

**Passage Body-Wrap Converges — third perimeter on the wrap kernel** *(LIVE 2026-04-28)*. `wrapClassOf('passage')` (→ `typo-wrap-passage`, `text-wrap: pretty`) composes onto the `thermal-typography` carrier at three body-prose call sites — `app/article/[id]/page.tsx`, `components/return/ReturnLetter.tsx` (opening + body siblings), `components/home/PortalHero.tsx`. Compose, NOT migrate (Mike #26, Tanya UX #85): the thermal contract (line-height + font-weight + text-shadow halo + paragraph translateY rhythm + print-pin) stays intact on the marquee surface; the widow goes. Fence: `lib/design/__tests__/passage-wrap-converges.fence.test.ts` (mirrors `caption-heading-wrap-converges` byte-for-byte; §1 every site imports `wrapClassOf` + calls it with literal `'passage'`, §2 no site inlines `text-wrap-*` or `typo-wrap-<beat>`, §3 the resolved-byte pin). One byte (`'typo-wrap-passage'`), three perimeters (caption labels, whisper carriers, body prose), one home (`wrapClassOf` switch in `lib/design/typography.ts`).

**Deferred:** P3/True Tone, Slice 3 (→ `lib/design/perceptual/`), archetype-detection accuracy receipt.

## Deployment
Docker on port 7200. Volumes: `persona-blog-db`, `persona-blog-logs`.
