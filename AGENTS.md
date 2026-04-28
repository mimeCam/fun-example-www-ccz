# Persona Blog

Next.js 14 · React 18 · TypeScript · Tailwind · SQLite (better-sqlite3) · Zod · Fuse.js.

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible.

## Key Paths
`lib/design/` (ledgers, fences) · `lib/thermal/` (score, tokens) · `lib/detection/` (first-paint archetype) · `lib/mirror/` (snapshot, `__rt=1` returner) · `lib/return/` (recognition timeline) · `lib/sharing/` (clipboard, keepsake) · `lib/engagement/` (loop-funnel) · `lib/hooks/` · `components/shared/` · `scripts/`.

## Conventions
Design rules are enforced by fence tests (`*.fence.test.ts`) and sync tests. Single source of truth lives in CSS or one TS switch — every literal has one home, one grep-fence. Compose, don't migrate. **Chrome before content**: highest-visit surfaces polished first.

## WIP
- **Passage Body-Hang** *(WIP 2026-04-28)*. `hangPunctClassOf('passage')` → `hanging-punctuation: first last allow-end` on three body-prose carriers. Safari-only. Fences: `passage-hang-converges` + `hang-progressive-enhancement`.

## Live
- **Caption-Chrome Register** *(2026-04-28)*. `CAPTION_CHROME_CARRIERS` (5) in `lib/design/typography.ts` names the implicit register `<CaptionMetric>` already enforces (`tracking-sys-caption + tabular-nums + text-mist/70 + text-sys-(micro|caption)`). `ResonanceEntry` timeAgo migrated; digits stop dancing on /resonances. Fence: `caption-chrome-adoption`. Print/SVG carve-out: surfaces routing through `numericFeatureStyle()` are NOT carriers (own register, pinned by `numeric-features-adoption`).
- **Recognition Beacon accent-bias** *(2026-04-28)*. Two-lane contract via `THREAD_ACCENT_BIAS_FILTER`. Fence: `focus-reciprocal-lane`.
- **Chassis Seam** *(2026-04-28)*. `pt-sys-9` (40 px) chrome→content bridge × 7 doors. Fence: `chrome-content-seam`.
- **Passage Body-Wrap** *(2026-04-28)*. `wrapClassOf('passage')` → `text-wrap: pretty` × 3 carriers. Fence: `passage-wrap-converges`.
- **Passage Body-Hyphens** *(2026-04-28)*. `hyphensClassOf('passage')` × 3 carriers. Fences: `passage-hyphens-converges` + `html-lang-required-for-hyphenation`.
- **Body-prose carriers named** *(2026-04-28)*. `PASSAGE_BODY_CARRIERS` (3) in `lib/design/typography.ts` — one tuple, three fences (wrap / hyphens / hang) consume.

## Deferred
P3/True Tone, Slice 3, archetype-detection accuracy receipt, `quotes` / `'locl'` locale-aware sub-ledger. Body-prose typography ledger converged on three carriers (wrap, hyphens, hang) — new sub-ledgers must justify a fourth disjoint property.

## Deployment
Docker on port 7200. Volumes: `persona-blog-db`, `persona-blog-logs`.
