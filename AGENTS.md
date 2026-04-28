# Persona Blog

Next.js 14 · React 18 · TypeScript · Tailwind · SQLite (better-sqlite3) · Zod · Fuse.js.

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible.

## Key Paths
`lib/design/` (ledgers, fences) · `lib/thermal/` (score, tokens) · `lib/detection/` (first-paint archetype) · `lib/mirror/` (snapshot, `__rt=1` returner) · `lib/return/` (recognition timeline) · `lib/sharing/` (clipboard, keepsake) · `lib/engagement/` (loop-funnel) · `lib/hooks/` · `components/shared/` · `scripts/`.

## Conventions
Design rules are enforced by fence tests (`*.fence.test.ts`) and sync tests. Single source of truth lives in CSS or one TS switch — every literal has one home, one grep-fence. Compose, don't migrate. **Chrome before content**: highest-visit surfaces polished first.

## WIP
_None._

## Live
- **Selection Share** *(2026-04-28)*. Select a sentence → press the link icon → `#highlight=HASH&text=ENC` hits the clipboard. Recipient lands centered on that paragraph with a one-shot pulse. Orphan graduation (`share-links` + `highlight-finder` get their first non-test callers). Shell extracted from `SelectionPopoverTrigger` → `SelectionPopoverShell` (one paint, many actions). Hook: `useSharedHighlightOnLand`. Fences: `orphan-graduates`, `share-links-roundtrip`, source-pin tests.
- **Passage Body-Hang** *(2026-04-28)*. `hangPunctClassOf('passage')` → `hanging-punctuation: first last allow-end` × 3 carriers. Safari-only. Fences: `passage-hang-converges` + `hang-progressive-enhancement` + `passage-trinity-disjoint`.
- **Caption-Chrome Register** *(2026-04-28)*. `CAPTION_CHROME_CARRIERS` (5). Fence: `caption-chrome-adoption`.
- **Recognition Beacon accent-bias** *(2026-04-28)*. Two-lane contract. Fence: `focus-reciprocal-lane`.
- **Chassis Seam** *(2026-04-28)*. `pt-sys-9` (40 px) × 7 doors. Fence: `chrome-content-seam`.
- **Passage Body-Wrap** *(2026-04-28)*. `wrapClassOf('passage')` × 3 carriers. Fence: `passage-wrap-converges`.
- **Passage Body-Hyphens** *(2026-04-28)*. `hyphensClassOf('passage')` × 3 carriers. Fences: `passage-hyphens-converges` + `html-lang-required-for-hyphenation`.
- **Body-prose carriers named** *(2026-04-28)*. `PASSAGE_BODY_CARRIERS` (3) — one tuple, three fences.

## Deferred
P3/True Tone, Slice 3, archetype-detection accuracy receipt, `quotes` / `'locl'` locale-aware sub-ledger. Body-prose typography ledger converged on three carriers (wrap, hyphens, hang) — new sub-ledgers must justify a fourth disjoint property.

## Deployment
Docker on port 7200. Volumes: `persona-blog-db`, `persona-blog-logs`.
