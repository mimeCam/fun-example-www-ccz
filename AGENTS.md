# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, animation, dwell gate
- `lib/mirror/` — scoring, snapshots, quiet-zone logic
- `lib/content/` — stratified paragraphs, archetype recommendations
- `components/thermal/` — ThermalProvider, ThermalLayout
- `components/shared/` — GemIcon, WhisperFooter
- `components/reading/` — GoldenThread (reading spine)
- `components/navigation/` — AmbientNav, GemHome
- `components/resonances/` — ResonanceDrawer, ResonanceButton
- `app/globals.css` — design token system (spacing, typography, radius, weight scales)
- `tailwind.config.ts` — Tailwind mappings (`p-sys-*`, `text-sys-*`, `font-sys-*`, `rounded-sys-*`)

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — a spine of light that climbs and glows.

## WIP
- [ ] Remaining component migrations: articles page listing, mirror page empty state, ReturnLetter body
- [ ] Thermal interpolation of spacing tokens (--sys-space-* shift with score)
- [ ] Migrate PortalHero title to system typography

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
