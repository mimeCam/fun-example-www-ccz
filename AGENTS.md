# Persona Blog

## Tech Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
SQLite (better-sqlite3), Zod, Fuse.js

## Key Paths
- `app/` — Pages & API routes
- `components/` — React components
- `lib/hooks/` — `useMirror`, `useQuickMirror`, `useBehavioralSignals`, `useParagraphEngagement`
- `lib/mirror/` — Scoring engine, snapshot manager, evolution engine, card generators
- `lib/content/` — Content resolution & article store
- `types/content.ts` — Core types (`LayeredArticleContent`, `ArchetypeKey`, `ParagraphEngagement`)

## Core Feature: Accelerated Mirror
"The blog that reads you back." After ONE article at 70% scroll, the reader gets an archetype whisper.
No email, no account, no warmup — pure client-side synthesis via `quickSynthesize()`.

## Paragraph-Level Engagement
Pipeline: `StratifiedRenderer` → `useParagraphEngagement` → `useBehavioralSignals` → `quickSynthesize`

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
