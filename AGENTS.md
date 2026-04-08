# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS
SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `app/` — Pages & API routes
- `app/page.tsx` — **The Threshold**: single-article immersive homepage (Portal)
- `components/home/` — PortalHero, ReadingInvitation, ReturningPortal
- `components/mirror/` — MirrorRevealCard, QuickMirrorCard
- `components/return/` — RecognitionWhisper, ReturnVisitorGreeting, ReturnLetter
- `lib/content/featured.ts` — Pure featured article selector (seed + unread-aware)
- `lib/mirror/` — Scoring, snapshots, whisper & season engines, card generators, letter-engine
- `lib/hooks/` — useMirror, useQuickMirror, useReturnRecognition, useBehavioralSignals, useParagraphEngagement
- `types/` — content.ts, resonance.ts, book-narration.ts

## Core Feature: The Portal + Archetype Reveal + Resonance Marginalia
"The blog that reads you back." Homepage is a single-article doorway → read to 70% → archetype reveal. No email, no account — pure client-side. Returning readers see composed letter card. Resonances become rose marginalia on return visits.

## Design Tokens (tailwind.config.ts)
Colors: background, primary, secondary, accent, surface, fog, mist, gold, cyan, rose, void.
Shadows: void, rise, float, gold, gold-intense, rose-glow. Never raw grays.

## WIP
- `/explore` page: unified discovery replacing `/categories`, `/worldview`, `/questions`, `/trails`
- MirrorRevealCard: simplify to top-trait-only view
- Return Letter: future `/letters` archive, milestone/seasonal letter types
- Homepage: returning reader adaptation (select unread article via reading_memory)

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
