# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `components/home/` — Homepage components
- `components/mirror/` — Mirror/QuickMirrorCard/ShareOverlay
- `components/content/StratifiedRenderer.tsx` — Per-paragraph archetype variant renderer
- `lib/content/stratified-paragraphs.ts` — Archetype variant resolver
- `lib/content/archetype-recommendations.ts` — Archetype-aware article ranking
- `lib/mirror/` — Scoring, snapshots, whisper & season engines

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. QuickMirrorCard at 30% scroll → share card → viral loop. No accounts.

## WIP
- [ ] Colored whisper shadows on marginalia blocks

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
