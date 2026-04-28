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
- **Settled-Rhythm Rung Lock** *(2026-04-28)*. Five `<ActionPressable>` carriers pin bounding boxes via `swapWidthClassOf(N)`; two icon-only hosts carry honest `// swap-width:exempt` tokens. Fence: `label-swap-width-fence` (4 axes). Settled-receipt verb lexicon (`SETTLED_RECEIPT_VERBS`) gates every `settledLabel` literal. Fence: `settled-label-lexicon-parity` (2 axes). Timing pins: 120 ms / 1000 ms / 1136 ms.
- **Selection Share — sender-side pulse symmetry** *(2026-04-28)*. The shared paragraph warms at both ends with the same gold primitive (`pulseElementGold` in `lib/sharing/highlight-pulse.ts` — `color-mix(in srgb, var(--gold) 10%, transparent)`, `pulse-highlight 1s ease-in-out × 2`, `PULSE_DWELL_MS = 3000` ms). Sender pulse fires after popover-exit completes (`MOTION.crossfade + MOTION_REDUCED_MS = 130 ms` — the witness gate); recipient pulse fires on rAF after paint. Reduced-motion drops the scale on both ends; color lands on both. Two callers, one source. Fence: `share-pulse-symmetry` (5 axes — importer set, color source, reduced-motion parity, witness gate, hold parity). Underlying URL contract from `share-links` + `highlight-finder` (orphan graduation), shell from `SelectionPopoverShell`, hook `useSharedHighlightOnLand`. Other fences: `orphan-graduates`, `share-links-roundtrip`, source-pin tests, `highlight-pulse` unit pin.
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
