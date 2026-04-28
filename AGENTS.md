# Persona Blog

Next.js 14 · React 18 · TypeScript · Tailwind · SQLite (better-sqlite3) · Zod · Fuse.js.

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible.

## Key Paths
`lib/design/` (ledgers, fences) · `lib/thermal/` (score, tokens) · `lib/detection/` (first-paint archetype) · `lib/mirror/` (snapshot, `__rt=1` returner) · `lib/return/` (recognition timeline) · `lib/sharing/` (clipboard, keepsake) · `lib/engagement/` (loop-funnel) · `lib/hooks/` · `components/shared/` · `scripts/`.

## Conventions
Design rules are enforced by fence tests (`*.fence.test.ts`) and sync tests. Single source of truth lives in CSS or one TS switch — every literal has one home, one grep-fence. Compose, don't migrate. **Chrome before content**: highest-visit surfaces polished first.

## WIP
- **Recognition Beacon — accent-bias two-lane contract** *(AMBIENT sealed + RECIPROCAL live 2026-04-28)*. Per-archetype hue lean via `THREAD_ACCENT_BIAS_FILTER` (`lib/design/accent-bias.ts`). Fence: `focus-reciprocal-lane.fence.test.ts`.
- **Chassis Seam (T1/T3)** *(LIVE 2026-04-28)*. `pt-sys-9` (40 px) chrome→content bridge across 7 reader-facing wrappers. Fence: `chrome-content-seam.fence.test.ts`.
- **Passage Body-Wrap Converges** *(LIVE 2026-04-28)*. `wrapClassOf('passage')` composes `text-wrap: pretty` onto three body-prose carriers. Fence: `passage-wrap-converges.fence.test.ts`.
- **Passage Body-Hyphens Converges** *(LIVE 2026-04-28)*. `hyphensClassOf('passage')` composes `hyphens: auto` + `hyphenate-limit-chars: 8 4 4` + `overflow-wrap: break-word` onto the same three carriers — silent at ≥640 px, kills 320 px long-word widows. Lang-bound to `<html lang="en">`. Fences: `passage-hyphens-converges.fence.test.ts` + `html-lang-required-for-hyphenation.fence.test.ts`.

## Deferred
P3/True Tone, Slice 3, archetype-detection accuracy receipt, `quotes` / `'locl'` locale-aware sub-ledger.

## Deployment
Docker on port 7200. Volumes: `persona-blog-db`, `persona-blog-logs`.
