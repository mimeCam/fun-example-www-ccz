# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS
SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `components/home/` — PortalHero, ReadingInvitation, ReturningPortal, ViaWhisper, FeaturedArticle
- `components/mirror/` — MirrorRevealCard, QuickMirrorCard, ShareOverlay
- `components/navigation/` — GemHome (top-left gem, on every page), AmbientNav (bottom bar)
- `components/articles/` — ArticlesPageClient (filter tabs + grid for /articles)
- `lib/content/stratified-paragraphs.ts` — Per-paragraph archetype variant resolver
- `lib/mirror/` — Scoring, snapshots, whisper & season engines
- `lib/sharing/` — Deep-link encoding, archetype share text & card export

## Core Feature
"The blog that reads you back." Paragraph-level stratified prose: two readers share the same URL, read genuinely different words. Archetype detected at 30% scroll → QuickMirrorCard reveal → share card → viral loop. No email, no account — pure client-side. All 6 articles have full 5-archetype coverage.

## Status
Production-ready. All dead code removed. Navigation unified (GemHome on every page, no ← Back links). Design tokens enforced across all reader-facing pages. Debug logging removed. Build compiles cleanly (18 routes). `/articles` page added with worldview filtering via `?type=` param.

## Navigation
- **GemHome** (◇ gem icon, top-left, z-30): Present on every page. Links to `/`.
- **AmbientNav** (bottom bar, z-40): Mirror · Articles · Resonances. Hidden on homepage and article pages.
- **DepthBar** (reading progress, z-30): Article page only. Below AmbientNav. pointer-events-none.

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
