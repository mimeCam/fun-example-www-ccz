# Persona Blog

## Tech Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
SQLite with better-sqlite3, Server Actions, Zod validation, Fuse.js

## Key Paths
`app/` — Pages and API routes
`components/` — React components
`lib/search/` — Fuse.js fuzzy search engine
`lib/hooks/` — Custom hooks (milestones, scroll, completion detection)
`lib/detection/` — Reading behavior analysis
`lib/mirror/` — Reading Mirror synthesis engine **[WIP]**

## Reading Mirror [WIP]
Core killer-feature: synthesizes reader data into a reader identity.
`GET /api/mirror` → archetype, whisper, topic DNA, scores, resonance themes.
Done: types, synthesizer, API endpoint, useMirror hook (`lib/hooks/useMirror.ts`).
TODO: AmbientMirror UI strip (article pages), DeepMirror UI (journey page).

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
Winston logging in `/app/logs`.
