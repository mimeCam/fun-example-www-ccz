# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens (HSL interpolation), animation, history, dwell gate
- `lib/content/` — stratified paragraphs, archetype recommendations
- `lib/mirror/` — scoring, snapshots, whisper & season engines
- `components/thermal/` — ThermalProvider (context), ThermalLayout (DOM bridge)
- `components/content/StratifiedRenderer.tsx` — per-paragraph archetype variant renderer

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal reading system warms the site's atmosphere as engagement deepens.

## WIP
- [ ] Dwell-gated QuickMirror trigger (dwell-gate.ts ready, needs useQuickMirror integration)
- [ ] Favicon and OG image assets

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
