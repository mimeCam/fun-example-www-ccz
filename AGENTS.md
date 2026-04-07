# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS
SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `app/` — Pages & API routes
- `app/resonances/` — `/resonances` (Book of You)
- `components/mirror/` — MirrorRevealCard, QuickMirrorCard
- `components/return/` — RecognitionWhisper, ReturnVisitorGreeting, ReturnLetter
- `lib/mirror/` — Scoring, snapshots, whisper & season engines, card generators, letter-engine
- `lib/hooks/` — useMirror, useQuickMirror, useReturnRecognition, useBehavioralSignals, useParagraphEngagement
- `types/` — content.ts, resonance.ts, book-narration.ts

## Core Feature: Accelerated Mirror + Resonance Marginalia + Return Letter
"The blog that reads you back." Scroll deep → archetype whisper. No email, no account — pure client-side. Returning readers see captured quote + note as warm-rose marginalia. Absent 3+ days → composed letter card on homepage (archetype/season/resonance-aware, shareable PNG).

## Design Tokens (tailwind.config.ts)
Colors: background, primary, secondary, accent, surface, fog, mist, gold, cyan, rose, void.
Shadows: void, rise, float, gold, gold-intense, rose-glow. Never raw grays.

## WIP
- Progressive slot unlock system (stranger → acquaintance → friend → confidant)
- MirrorRevealCard: simplify to top-trait-only view
- `/explore` page: unified discovery replacing `/categories`, `/worldview`, `/questions`, `/trails`
- Homepage redesign: single featured article experience
- Return Letter: future `/letters` archive, milestone/seasonal letter types

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
