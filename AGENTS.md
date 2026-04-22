# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — color constants, motion tokens, contrast helpers, ambient-surfaces CSS
- `lib/sharing/` — clipboard, share cards, thread keepsake SVG/PNG
- `lib/mirror/` — archetype scoring
- `lib/utils/` — focus-utils, scroll-lock, reduced-motion, phase resolvers (press/field/animation/link)
- `components/shared/` — `<Threshold>`, `<Pressable>`, `<Field>`, `<TextLink>`
- `components/reading/` — Golden Thread, ceremony, keepsake
- `components/resonances/` — resonance drawer & shimmer
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — and the Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System
Four shared primitives with phase machines, reduced-motion branches, and adoption guards: `<Threshold>`, `<Pressable>`, `<Field>`, `<TextLink>`. Timing owned by `lib/design/motion.ts` (8 beats: crossfade→settle + ceremony namespace). Depth owned by `lib/design/elevation.ts` (6 beats: rest · rise · float · whisper · bloom · radiance — depth/glow split). Gesture chrome in `lib/design/ambient-surfaces.css`. WCAG helpers in `lib/design/contrast.ts`.

## WIP
- **Elevation Ledger** — guard live, six high-traffic surfaces migrated. Legacy `shadow-void/rise/float/gold/*` Tailwind aliases pending migration; keyframe tweens stay inline by design.

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
