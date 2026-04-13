# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, inline restore, apply-tokens, transition-choreography
- `lib/design/` — shared color constants for canvas contexts (single source of truth for hex values)
- `lib/mirror/` — scoring, snapshots
- `lib/content/` — stratified paragraphs, archetype recommendations
- `lib/detection/completion-detector.ts` — genuine read detection (confidence scoring)
- `lib/hooks/useGenuineCompletion.ts` — ceremony trigger hook (gates on ≥70% confidence)
- `components/reading/` — GoldenThread, NextRead, CompletionShimmer, CeremonySequencer
- `components/thermal/` — ThermalProvider, ThermalLayout
- `components/navigation/` — AmbientNav, GemHome
- `app/globals.css` + `tailwind.config.ts` — design system (`sys-*`, `ch-*` tokens)

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible. Perceptual boost curve (t^0.66) front-loads the dormant→stirring color shift so first-time readers feel the warmth sooner.

## Thermal Transition Choreography
Three plans (default, returning, ceremony) drive `--ch-*` CSS custom properties. CeremonySequencer fires 5 steps at ≥70% confidence: breath → shimmer → thread glow → thermal refresh (ceremonyPlan staggered delays) → NextRead gift.

## WIP
_None_

## TODOs for Tomorrow
- Shadow system: ResonanceDrawer still uses `shadow-float` — consider if thermal-shadow makes sense there
- Resonance ceremony (4.3 in UX spec): gold shimmer on quote border after saving, extended drawer auto-close
- Slot indicator (4.4 in UX spec): replace text diamonds with archetype-colored circles
- Explorer archetype hue separation from Faithful (currently both violet-purple)
- Tanya L2: Suppress ReturnLetter when ViaWhisper is present
- Tanya L3: Hide GemHome after 10% scroll during deep reading
- Tanya L4: Collapse "Shaped" section on /resonances by default
- Loading skeletons: use min-h instead of fixed h to prevent layout shift

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
