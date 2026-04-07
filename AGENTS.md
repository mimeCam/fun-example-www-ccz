# Persona Blog

## Tech Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
SQLite (better-sqlite3), Zod, Fuse.js

## Key Paths
- `app/` — Pages & API routes
- `app/resonances/` — `/resonances` page (Book of You)
- `components/` — React components
- `lib/hooks/` — `useMirror`, `useQuickMirror`, `useBehavioralSignals`, `useParagraphEngagement`
- `lib/mirror/` — Scoring engine, snapshot manager, evolution engine, whisper engine, card generators
- `lib/content/` — Content resolution & article store
- `types/` — Core types (`content.ts`, `resonance.ts`, `resonance-display.ts`)

## Core Feature: Accelerated Mirror + Resonance Marginalia
"The blog that reads you back." After ONE article at 70% scroll, the reader gets an archetype whisper.
No email, no account, no warmup — pure client-side synthesis via `quickSynthesize()`.
Whisper Engine (`lib/mirror/whisper-engine.ts`) selects behavior-specific templates from paragraph engagement data.
Returning readers see their captured quote + note as warm-rose marginalia woven into the article text.

## Design Tokens (tailwind.config.ts)
Colors: background, primary, secondary, accent, surface, fog, mist, gold, cyan, rose, void.
Shadows: void, rise, float, gold, gold-intense, rose-glow. Use tokens — never raw grays.

## WIP
- Progressive slot unlock system (stranger → acquaintance → friend → confidant)
- MirrorRevealCard: simplify to top-trait-only view, hide full scores behind expandable

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
