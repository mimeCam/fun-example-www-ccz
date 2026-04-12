# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens (16 CSS vars), animation, history, dwell gate
- `lib/mirror/` — scoring, snapshots, quiet-zone logic
- `lib/content/` — stratified paragraphs, archetype recommendations
- `components/thermal/` — ThermalProvider, ThermalLayout
- `components/shared/GemIcon.tsx` — unified gem diamond (xs/sm/md/lg sizes)
- `components/content/StratifiedRenderer.tsx` — archetype variant renderer
- `components/reading/GoldenThread.tsx` — vertical reading spine
- `components/navigation/GemHome.tsx` — thermal-aware home link (quiet on article pages)
- `components/resonances/ResonanceDrawer.tsx` — slide-in side panel for resonance capture

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — a spine of light that climbs and glows.

## WIP
- [ ] QuickMirrorCard: move from mid-prose to end-of-section
- [ ] Extract `useMirrorPhases` hook from QuickMirrorCard + MirrorRevealCard
- [ ] Nav active state: thermal-aware dot indicator

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
