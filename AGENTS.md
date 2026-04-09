# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS
SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `components/home/` — PortalHero, ReturningPortal, FeaturedArticle, WorldviewDoors
- `components/mirror/` — MirrorRevealCard, QuickMirrorCard, ShareOverlay
- `components/navigation/` — GemHome, AmbientNav
- `components/reading/` — DepthBar, MirrorWhisper, NextRead
- `lib/content/stratified-paragraphs.ts` — Per-paragraph archetype variant resolver
- `lib/mirror/` — Scoring, snapshots, whisper & season engines

## Core Feature
"The blog that reads you back." Paragraph-level stratified prose: same URL, different words per archetype. QuickMirrorCard at 30% scroll → share card → viral loop. No accounts — pure client-side.

Gold (#f0c674): 3 moments only — homepage CTA, QuickMirrorCard reveal, share card export.

## WIP
- [ ] "For the [Archetype]" NextRead CTA

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
