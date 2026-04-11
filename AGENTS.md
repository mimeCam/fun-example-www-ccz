# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, animation, history, dwell gate
- `lib/content/` — stratified paragraphs, archetype recommendations
- `lib/mirror/` — scoring, snapshots, whisper & season engines
- `components/thermal/` — ThermalProvider, ThermalLayout
- `components/content/StratifiedRenderer.tsx` — archetype variant renderer
- `components/reading/GoldenThread.tsx` — vertical reading spine

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — a spine of light that climbs and glows.

## WIP
- [ ] QuickMirrorCard collision prevention (quiet zone after mirror reveal)
- [ ] Mirror page progressive disclosure
- [ ] Resonances page: collapse export behind action link, section header restyle
- [ ] Articles page: card hover -translate-y-px, curated divider max-w-divider

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
