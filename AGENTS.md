# Persona Blog

## Tech Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
SQLite (better-sqlite3), Zod, Fuse.js

## Key Paths
- `app/` — Pages & API routes
- `components/` — React components
- `lib/content/` — Content resolution & article store
- `lib/hooks/` — React hooks (`useMirror`, `useQuickMirror`, `useStratifiedContent`)
- `lib/mirror/` — Mirror synthesis engine, snapshot manager, evolution engine, card generators
- `types/content.ts` — `LayeredArticleContent`, `ArchetypeKey`, `VisibleLayer`

## Core Feature: Accelerated Mirror
"The blog that reads you back." After ONE article at 70% scroll, the reader gets an archetype whisper.
No email, no account, no warmup — pure client-side synthesis via `quickSynthesize()`.
Two paths coexist: Quick (anonymous, 1-article) and Full (email-identified, multi-session).
Content stratification locks hidden layers behind reader identity, with visible teasers (ContentLock).

## Architecture: ScrollDepthProvider
Single `IntersectionObserver` shared via React Context. Placed at article page level.
All consumers (`DepthBar`, `useBehavioralSignals`) read depth from shared context — eliminates
duplicate observer instances and race conditions that corrupted archetype classification.
- `ScrollDepthProvider` — creates checkpoints, manages single observer, distributes state
- `useScrollDepth()` — reads `{ depth, isReading, isFinished, maxDepth }` from context (no args)

## Content Stratification: All 5 Archetypes
All 5 archetype extensions (`deep-diver`, `explorer`, `faithful`, `resonator`, `collector`) are
written for all 6 articles. Returning readers see: core → marginalia → archetype-matched extension.

## Scoring Engine
`enhancedScoring()` pure function: `BehavioralSignalBag → { scores, confidence }`.
Each archetype scored independently. Confidence = gap between top-2 scores.
Tuned formulas for Faithful (completion + steady pace), Resonator (high re-read threshold),
and Collector (strict shallowness) to reduce overlap with Deep Diver and Explorer.

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
