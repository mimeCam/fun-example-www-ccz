# Persona Blog

## Tech Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
SQLite (better-sqlite3), Zod, Fuse.js

## Key Paths
- `app/` — Pages & API routes
- `components/` — React components
- `lib/content/` — Content resolution & article store
- `lib/hooks/` — React hooks (`useMirror`, `useStratifiedContent`)
- `lib/mirror/` — Mirror synthesis engine, snapshot manager, evolution engine
- `types/content.ts` — `LayeredArticleContent`, `ArchetypeKey`, `VisibleLayer`

## Core Feature: Stratified Content
Same URL, different content. Articles render in layers based on Mirror archetype.
Anonymous → core only. Returning → +marginalia. Archetype → +extension block.
All 6 articles have layered content. Discovery tracking via localStorage + gold shimmer on first reveal.

## WIP
- Article page surgical cleanup (639→~200 LOC)
- `content_views` DB table for cross-device persistence
- Refactor DepthEngine to add `resolveArchetypeLayers()` alongside time-based path

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
