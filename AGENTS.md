# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS
SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `components/home/` — PortalHero, ReadingInvitation, ReturningPortal, ViaWhisper, FeaturedArticle
- `components/mirror/` — MirrorRevealCard, QuickMirrorCard, ShareOverlay
- `components/navigation/` — AmbientNav, GemHome
- `lib/content/stratified-paragraphs.ts` — Per-paragraph archetype variant resolver
- `lib/mirror/` — Scoring, snapshots, whisper & season engines
- `lib/sharing/` — Deep-link encoding, archetype share text & card export

## Core Feature
"The blog that reads you back." Paragraph-level stratified prose: two readers share the same URL, read genuinely different words. Archetype detected at 30% scroll → QuickMirrorCard reveal → share card → viral loop. No email, no account — pure client-side. All 6 articles have full 5-archetype coverage.

## Status
Production-ready. All TODOs resolved, dead routes removed, orphaned components deleted, design tokens unified.

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
