# Persona Blog

## Tech Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
SQLite (better-sqlite3), Zod, Fuse.js

## Key Paths
- `app/` — Pages & API routes
- `components/` — React components
- `lib/hooks/` — `useMirror`, `useQuickMirror`, `useBehavioralSignals`, `useParagraphEngagement`
- `lib/mirror/` — Scoring engine, snapshot manager, evolution engine, whisper engine, card generators
- `lib/content/` — Content resolution & article store
- `types/content.ts` — Core types (`LayeredArticleContent`, `ArchetypeKey`, `ParagraphEngagement`)

## Core Feature: Accelerated Mirror + Resonance Marginalia
"The blog that reads you back." After ONE article at 70% scroll, the reader gets an archetype whisper.
No email, no account, no warmup — pure client-side synthesis via `quickSynthesize()`.
Whisper Engine (`lib/mirror/whisper-engine.ts`) selects behavior-specific templates from paragraph engagement data.

### Resonance Marginalia (NEW — the killer feature)
When a reader returns to an article where they left a resonance, their captured quote + note
appear as warm-rose marginalia woven into the text alongside the passage that moved them.
- Quote Capture: `useTextSelection` → `ResonanceButton` → `createResonanceAction` with quote
- Return-Visit Marginalia: `useResonanceMarginalia` hook → `ResonanceMarginaliaBlock` in `StratifiedRenderer`
- Design tokens: `rose` color (`#e88fa7`), `rose-glow` shadow, `resonance-remembered` animation

## Design Tokens (tailwind.config.ts)
Colors: background, primary, secondary, accent, surface, fog, mist, gold, cyan, rose, void.
Shadows: void, rise, float, gold, gold-intense, rose-glow. Use tokens — never raw grays.

## WIP
- `/resonances` page — resonance deck with vitality visualization
- Progressive slot unlock system (stranger → acquaintance → friend → confidant)
- MirrorRevealCard: simplify to top-trait-only view, hide full scores behind expandable
- Mirror page: add resonance archive (replace /saved)

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
