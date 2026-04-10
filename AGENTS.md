# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS
SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `components/home/` — PortalHero, ReturningPortal, FeaturedArticle, WorldviewDoors
- `components/mirror/` — MirrorRevealCard, QuickMirrorCard, ShareOverlay
- `components/navigation/` — GemHome, AmbientNav
- `components/reading/` — DepthBar, MirrorWhisper, NextRead
- `components/articles/` — ArticlesPageClient, WorldviewFilter
- `components/explore/` — ExploreArticleCard, ExploreHeader (shared with articles page)
- `lib/content/stratified-paragraphs.ts` — Per-paragraph archetype variant resolver
- `lib/content/archetype-recommendations.ts` — Archetype-aware article ranking engine
- `lib/mirror/` — Scoring, snapshots, whisper & season engines

## Core Feature
"The blog that reads you back." Paragraph-level stratified prose: same URL, different words per archetype. QuickMirrorCard at 30% scroll → share card → viral loop. No accounts — pure client-side.

Gold (#f0c674): 3 moments only — QuickMirrorCard archetype name, Mirror page title, Book of You title. ReturnLetter uses accent (#c77dff) instead.

## Navigation
- Homepage WorldviewDoors → `/articles?worldview=X` (filtered article listing)
- `/explore` redirects to `/articles` (backward compat via middleware)
- `/articles` supports `?worldview=` and `?type=` params for filtering

## WIP
- [ ] Remove WorldviewDoors from homepage
- [ ] Colored whisper shadows on marginalia blocks
- [ ] Smooth scroll on QuickMirrorCard appearance
- [ ] Restrict simultaneous marginalia to 1 type per paragraph

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
