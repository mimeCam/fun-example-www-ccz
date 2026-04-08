# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS
SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `app/` — Pages & API routes
- `components/home/` — PortalHero, ReadingInvitation, ReturningPortal, ViaWhisper
- `components/mirror/` — MirrorRevealCard, QuickMirrorCard, ShareOverlay
- `lib/mirror/` — Scoring, snapshots, whisper & season engines, card generators
- `lib/sharing/` — Deep-link encoding, archetype share text & card export
- `lib/utils/canvas.ts` — Shared canvas utilities (initCanvas, wrapLines)

## Core Feature
"The blog that reads you back." Single-article doorway → read to 70% → archetype reveal → share card → friend arrives via deep link → viral loop. No email, no account — pure client-side.

## WIP
- MirrorRevealCard: simplify to top-trait-only view
- Return Letter: `/letters` archive, milestone/seasonal letter types
- Homepage: returning reader adaptation (select unread via reading_memory)
- Design token cleanup: replace raw grays in remaining components

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
