# Persona Blog

## Tech Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
SQLite (better-sqlite3), Zod, Fuse.js

## Key Paths
- `app/` — Pages & API routes
- `components/` — React components
- `lib/mirror/` — Mirror synthesis engine, snapshot manager, evolution engine
- `lib/search/` — Fuse.js fuzzy search
- `lib/hooks/` — Custom hooks
- `types/mirror.ts` — Mirror system types

## Core Feature: Reading Mirror
`GET /api/mirror` → archetype, whisper, topic DNA, scores, resonance themes, evolution.
UI: `/mirror` page (cinematic reveal card), AmbientMirror sidebar on articles, PNG export.

## Mirror Progression System (wip)
Backend done: `mirror_snapshots` table, snapshot manager (1/day throttle), evolution engine (shift detection, trajectory).
Next: dynamic whispers, reading challenges, evolution UI in MirrorRevealCard.

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
