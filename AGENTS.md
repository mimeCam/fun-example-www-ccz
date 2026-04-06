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

## WIP
- **QuickMirrorCard** — ✅ Save as Image wired via `quick-mirror-card-generator.ts` (1080×1080 Canvas PNG)
- **Enhanced behavioral signals** — ✅ `useBehavioralSignals` hook + `enhancedScoring` pure function wired into `quickSynthesize()` (5-signal pipeline: depth, velocity, re-reads, dwell, pace)
- **ContentLock component** — extract inline lock teaser into shimmer blocks with layer labels
- Article page surgical cleanup (655→~200 LOC) — per Tanya's spec, gut to 10 elements
- Shared scroll depth context to avoid duplicate IntersectionObserver instances

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
