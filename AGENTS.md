# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — 8 ledgers + ambient-surfaces CSS + print-surface CSS + contrast helpers + worldview chip manifest
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG, toast-store
- `lib/mirror/` — archetype scoring + archetype-store
- `lib/return/` — recognition-surface selector: single arbiter for which return-recognition primitive paints (`letter` | `whisper` | `silent`); mutual-exclusion is a typed return value, not a vibe
- `lib/thread/` — ThreadPulse: RAF sub-pixel depth driver for Golden Thread
- `lib/hooks/` — phase-machine hooks (Threshold, Press, Field, useToast, useThreadDepth, useLoopFunnel, useScrollRise)
- `lib/content/` — single owner of "raw markdown → plain prose": `stripMarkdownTokens`, `collapseWhitespace`, `excerpt`. Centrality guarded — no other surface re-derives the strip pipeline.
- `lib/utils/reader-locale.ts` — single owner of reader-facing date formatting (`formatReaderShortDate` · `formatReaderMonthDay` · `formatReaderLongDate`). Centrality guarded — literal locales (`en-US`, …) are forbidden; `// reader-invariant: locale-independent` carves out shared artifacts (e.g. keepsake SVG ISO stamp).
- `components/shared/` — Threshold, Pressable, Field, TextLink, Skeleton, Toast, EmptySurface, SuspenseFade, CaptionMetric (one face for every metric caption: Mirror MetaLine, hero, Explore card, print)
- `components/reading/` — Golden Thread, ceremony, keepsake, ReadersMark, ArticleProvenance, ReadProgressCaption
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System
8 ledgers (motion · elevation · color · typography · spacing · radius · alpha · z-index). 8 shared primitives. Pair rule: adding a 9th ledger or primitive means shipping sync + adoption tests in the same PR. Accessibility queries flow through `// reader-invariant` surfaces — they clarify, they do not warm.

## WIP
- *(none)*

## Follow-ons (deferred)
- Worldview taxonomy decision (technical+philosophical share the `primary`
  family — four chips, three voices). Resolution would touch
  `types/filter.ts` + `lib/design/worldview.ts` together. Per Tanya UX #58 §4,
  chip stays the only surface that paints worldview hue — no smear into
  `ResonanceEntry` / `EvolutionThread` / Mirror.
- Audit small-radius pill shapes (chips, badges, tags, toast pills) for
  consistent `rounded-sys-soft` resolution (Tanya UX #58 §5 — flagged for a
  future polish pass, not this sprint).

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
