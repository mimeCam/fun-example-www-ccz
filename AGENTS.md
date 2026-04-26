# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — 8 ledgers (motion · elevation · color · typography · spacing · radius · alpha · z-index) + ambient-surfaces CSS + print-surface CSS + contrast helpers + worldview chip manifest + voice-ledger (Surface→Voice fence) + WCAG contrast pairs (`CONTRAST_PAIRS`)
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG, toast-store
- `lib/mirror/` — archetype scoring + archetype-store
- `lib/return/` — recognition-surface selector (`letter` | `whisper` | `silent`)
- `lib/thread/` — ThreadPulse: RAF sub-pixel depth driver for Golden Thread
- `lib/hooks/` — phase-machine hooks (Threshold, Press, Field, useToast, useThreadDepth, useLoopFunnel, useScrollRise)
- `lib/content/` — markdown stripping pipeline (`stripMarkdownTokens`, `collapseWhitespace`, `excerpt`)
- `lib/source-scan/` — build-time source scanners (`stripCommentsAndStrings`); shared substrate for `scripts/audit-*`
- `lib/utils/reader-locale.ts` — reader-facing date formatting
- `components/shared/` — Threshold, Pressable, Field, TextLink, Skeleton, Toast, EmptySurface, SuspenseFade, CaptionMetric, CollapsibleSlot
- `components/reading/` — Golden Thread, ceremony, keepsake, ReadersMark, ArticleProvenance, ReadProgressCaption
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System
8 ledgers, 9 shared primitives. Pair rule: adding the next one means shipping sync + adoption tests in the same PR. Radius rungs carry a typed `posture` field (`label · held · ceremony · closure`). Accessibility flows through `// reader-invariant` surfaces.

**Posture suggests, posture does not dictate.** Do not add `motionByPosture()` or cross-ledger accessors — the correlation lives in the reviewer's head, not in the type system.

**Margins for a collapsible portal live on the portal's envelope, not on its siblings.** If a child may render `null` for one reader class, wrap it in `<CollapsibleSlot top? bottom?>` — the envelope SSRs whether the inner paints or not. Spacing math may not silently assume the recognition-positive case (Tanya #3 §5, Mike #2 §5). `scripts/audit-spacing-collapse.ts` is the local guardrail; run it before sending a portal-shape PR.

## WIP
- *(none)*

## Follow-ons (deferred)
- Worldview taxonomy decision (4 chips, still arguably 3 voices). Chip glyph (`WORLDVIEW_GLYPHS` in `lib/design/worldview.ts`) carries the discriminator; collapse to 3 remains a future option touching `types/filter.ts` + `lib/design/worldview.ts` + glyph map.

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
