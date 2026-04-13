# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, inline restore, apply-tokens
- `lib/mirror/` — scoring, snapshots
- `lib/content/` — stratified paragraphs, archetype recommendations
- `components/thermal/` — ThermalProvider, ThermalLayout
- `components/navigation/` — AmbientNav, GemHome
- `app/globals.css` + `tailwind.config.ts` — design system (`sys-*` tokens)

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible.

## WIP
_None_

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
