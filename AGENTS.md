# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — eight ledgers + ambient-surfaces CSS + contrast helpers + focus mirror
- `lib/sharing/` — clipboard, share cards, thread keepsake SVG/PNG, toast-store + reply-lexicon
- `lib/mirror/` — archetype scoring
- `lib/thread/` — ThreadPulse: RAF-driven sub-pixel depth driver powering Golden Thread
- `lib/utils/` — focus-utils, scroll-lock, reduced-motion, phase resolvers
- `lib/hooks/` — phase-machine hooks (Threshold, Press, Field, useToast, useThreadDepth)
- `components/shared/` — Threshold, Pressable, Field, TextLink, Skeleton, Toast (+ ToastHost)
- `components/reading/` — Golden Thread, ceremony, keepsake
- `components/resonances/` — resonance drawer & shimmer
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — and the Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System
Eight ledgers (motion · elevation · color · typography · spacing · radius · alpha · z-index), each owns its unit space. Six shared primitives: Threshold, Pressable, Field, TextLink, Skeleton, Toast. Reader-invariant surfaces (e.g. focus ring in `lib/design/focus.ts`) are tagged `// reader-invariant` — they never warm, personalize, or archetype-fork. Pair rule: adding a 9th ledger means shipping sync + adoption tests in the same PR.

## WIP
- _(none — all 8 ledgers sealed; 6 shared primitives shipped)_

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
