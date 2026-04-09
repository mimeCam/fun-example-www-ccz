# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS
SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `app/` — Pages & API routes
- `components/home/` — PortalHero, ReadingInvitation, ReturningPortal, ViaWhisper, FeaturedArticle
- `components/mirror/` — MirrorRevealCard, QuickMirrorCard, ShareOverlay
- `lib/content/stratified-paragraphs.ts` — Per-paragraph archetype variant resolver
- `lib/mirror/` — Scoring, snapshots, whisper & season engines, card generators
- `lib/sharing/` — Deep-link encoding, archetype share text & card export

## Core Feature
"The blog that reads you back." Paragraph-level stratified prose: two readers share the same URL, read genuinely different words. Archetype detected at 30% scroll → QuickMirrorCard reveal → share card → viral loop. No email, no account — pure client-side.

## WIP
- Paragraph variants: only `systems-thinking` has full 5-archetype coverage. Other 5 articles need variants — the resolver works, just needs data.
- Return Letter: `/letters` archive, milestone/seasonal letter types
- Journey page: frozen as "Coming Soon" (runs on mock data)

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
