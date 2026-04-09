# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS
SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `components/home/` — PortalHero, ReturningPortal, FeaturedArticle, WorldviewDoors
- `components/mirror/` — MirrorRevealCard, QuickMirrorCard, ShareOverlay (icon-based)
- `components/navigation/` — GemHome (every page), AmbientNav (bottom bar, 2 links)
- `components/shared/` — WhisperFooter (2-link footer: Mirror · Articles)
- `components/reading/` — DepthBar (positioned above AmbientNav at bottom-12)
- `lib/content/stratified-paragraphs.ts` — Per-paragraph archetype variant resolver
- `lib/mirror/` — Scoring, snapshots, whisper & season engines
- `lib/sharing/` — Deep-link encoding, archetype share text & card export

## Core Feature
"The blog that reads you back." Paragraph-level stratified prose: same URL, different words per archetype. QuickMirrorCard at 30% scroll → share card → viral loop. No accounts — pure client-side.

Gold (#f0c674): 3 moments only — homepage CTA, QuickMirrorCard reveal, share card export.

## Design Tokens
Tailwind tokens only (gold, mist, surface, background). No inline hex colors.

## WIP
- [ ] "For the [Archetype]" NextRead CTA
- [ ] Articles page consolidation (merge /explore, /trails, /categories)

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
