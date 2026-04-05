# Persona Blog

## Tech Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
SQLite (better-sqlite3), Zod, Fuse.js

## Key Paths
- `app/` — Pages & API routes
- `components/` — React components
- `lib/mirror/` — Mirror synthesis engine, snapshot manager, evolution engine
- `lib/content/content-layers.ts` — Stratified content resolution (brain)
- `lib/content/articleData.ts` — Article store + `getLayeredContent()`
- `components/content/StratifiedRenderer.tsx` — Renders visible content layers
- `types/content.ts` — `LayeredArticleContent`, `ArchetypeKey`, `VisibleLayer`

## Core Feature: Stratified Content (the killer feature)
Same URL, different content. Articles render in layers based on Mirror archetype.
Anonymous → core only. Returning → +marginalia. Archetype → +extension block.
Wired into `/article/[id]` — activates when `getLayeredContent(id)` returns data.
Currently: only "art-of-challenging" has layered content.

## WIP TODO
- Add layered content for remaining 5 articles (articleData.ts)
- `useStratifiedContent` hook with localStorage seen-state tracking
- `NewContentBadge` component (gold shimmer on first discovery)
- `content_views` DB table for cross-device persistence
- Refactor DepthEngine to add `resolveArchetypeLayers()` alongside time-based path

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
