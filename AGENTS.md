# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, inline restore (auto-generated), apply-tokens, transition-choreography
- `lib/design/` — color constants (single source of truth for hex values)
- `lib/mirror/` — scoring, snapshots
- `lib/hooks/useResonanceCeremony.ts` — resonance save ceremony sequencing
- `components/reading/` — GoldenThread, NextRead, CompletionShimmer, CeremonySequencer
- `components/resonances/` — ResonanceDrawer, ResonanceShimmer
- `scripts/generate-inline-restore.ts` — build-time codegen for inline restore (runs as `prebuild`)

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible.

## WIP
_None_

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
