# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS
SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `app/` — Pages & API routes
- `app/resonances/` — `/resonances` (Book of You)
- `components/mirror/` — MirrorRevealCard, QuickMirrorCard
- `lib/mirror/` — Scoring, snapshots, evolution, whisper engine, book-whisper-engine, season-engine, closing-line-engine, card generators
- `lib/hooks/` — useMirror, useQuickMirror, useBehavioralSignals, useParagraphEngagement
- `types/` — content.ts, resonance.ts, resonance-display.ts, book-narration.ts

## Core Feature: Accelerated Mirror + Resonance Marginalia
"The blog that reads you back." One article at 70% scroll → archetype whisper. No email, no account — pure client-side `quickSynthesize()`. Returning readers see captured quote + note as warm-rose marginalia.

## Design Tokens (tailwind.config.ts)
Colors: background, primary, secondary, accent, surface, fog, mist, gold, cyan, rose, void.
Shadows: void, rise, float, gold, gold-intense, rose-glow. Never raw grays.

## WIP
- Progressive slot unlock system (stranger → acquaintance → friend → confidant)
- MirrorRevealCard: simplify to top-trait-only view, hide full scores behind expandable
- `/explore` page: unified discovery replacing `/categories`, `/worldview`, `/questions`, `/trails`
- Homepage redesign: single featured article experience

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
