# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — 8 ledgers + ambient-surfaces CSS + print-surface CSS + contrast helpers
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG, toast-store
- `lib/mirror/` — archetype scoring + archetype-store
- `lib/thread/` — ThreadPulse: RAF sub-pixel depth driver for Golden Thread
- `lib/hooks/` — phase-machine hooks (Threshold, Press, Field, useToast, useThreadDepth, useLoopFunnel, useScrollRise)
- `components/shared/` — Threshold, Pressable, Field, TextLink, Skeleton, Toast, EmptySurface, SuspenseFade
- `components/reading/` — Golden Thread, ceremony, keepsake, ReadersMark
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System
8 ledgers (motion · elevation · color · typography · spacing · radius · alpha · z-index). 8 shared primitives. Pair rule: adding a 9th ledger or primitive means shipping sync + adoption tests in the same PR. Accessibility queries flow through `// reader-invariant` surfaces — they clarify, they do not warm.

## WIP
- `lib/design/print-surface.css` — @media print sheet (subtraction, paper hygiene, opt-out hooks); `components/reading/ReadersMark.tsx` — paper-only colophon glyph
- _(all 8 ledgers sealed; 8 primitives shipped; OS-Honor Register at 6; voice parity, SuspenseFade, loop funnel, focus-ring corner-parity, `/trust`, crossing micro-ceremonies, Golden Thread tide mark, motion beat integrity, right-edge stillness — all shipped)_

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
