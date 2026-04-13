# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, inline restore, apply-tokens
- `lib/mirror/` — scoring, snapshots
- `lib/content/` — stratified paragraphs, archetype recommendations
- `lib/detection/completion-detector.ts` — genuine read detection (confidence scoring)
- `lib/hooks/useGenuineCompletion.ts` — ceremony trigger hook (gates on ≥70% confidence)
- `components/reading/` — GoldenThread, NextRead, CompletionShimmer
- `components/thermal/` — ThermalProvider, ThermalLayout
- `components/navigation/` — AmbientNav, GemHome
- `app/globals.css` + `tailwind.config.ts` — design system (`sys-*` tokens)

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible. Perceptual boost curve (t^0.66) front-loads the dormant→stirring color shift so first-time readers feel the warmth sooner.

## Article Completion Ceremony
When a reader genuinely finishes (confidence ≥ 70%), a gold shimmer sweeps across the final divider, the GoldenThread glows brighter, the room warms via thermal refresh, and NextRead fades in after 700ms. Skimmers get nothing — the ceremony rewards reading, not scrolling.

## WIP
_None_

## TODOs for Tomorrow
- `CompletionShimmer` could accept `confidence` to vary shimmer intensity (high confidence = brighter sweep)
- Resonance ceremony (4.3 in UX spec): gold shimmer on quote border after saving, extended drawer auto-close
- Slot indicator (4.4 in UX spec): replace text diamonds with archetype-colored circles

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
