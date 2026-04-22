# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — color constants
- `lib/sharing/` — clipboard, share cards, thread keepsake SVG/PNG
- `lib/mirror/` — archetype scoring
- `lib/utils/` — focus-utils, scroll-lock, isomorphic effect (shared primitives)
- `components/reading/` — Golden Thread, ceremony, keepsake
- `components/resonances/` — resonance drawer & shimmer
- `components/shared/` — `<Threshold>` modal primitive, gem icon, whisper footer
- `app/api/og/` — social unfurl endpoints
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — and the Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System
Modals use the shared `<Threshold>` primitive (two variants: `center`, `drawer-right`). It owns portal, backdrop, ARIA, focus trap, focus return, scroll-lock, ESC (topmost only), reduced-motion. Callers own chrome. See `components/shared/Threshold.tsx`.

## WIP
_None_

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
