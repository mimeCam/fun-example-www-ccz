# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, inline restore, apply-tokens, transition-choreography
- `lib/mirror/` — scoring, snapshots
- `lib/content/` — stratified paragraphs, archetype recommendations
- `lib/detection/completion-detector.ts` — genuine read detection (confidence scoring)
- `lib/hooks/useGenuineCompletion.ts` — ceremony trigger hook (gates on ≥70% confidence)
- `components/reading/` — GoldenThread, NextRead, CompletionShimmer, CeremonySequencer
- `components/thermal/` — ThermalProvider, ThermalLayout
- `components/navigation/` — AmbientNav, GemHome
- `app/globals.css` + `tailwind.config.ts` — design system (`sys-*` tokens)

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible. Perceptual boost curve (t^0.66) front-loads the dormant→stirring color shift so first-time readers feel the warmth sooner.

## Article Completion Ceremony
CeremonySequencer orchestrates 5 steps when confidence ≥ 70%: breath pause → shimmer (subtle/present/radiant by confidence) → golden thread glow → thermal refresh → NextRead gift. Intensity scales: 70-79% whisper, 80-89% acknowledgment, 90-99% radiant.

## WIP
_None_

## TODOs for Tomorrow
- Resonance ceremony (4.3 in UX spec): gold shimmer on quote border after saving, extended drawer auto-close
- Slot indicator (4.4 in UX spec): replace text diamonds with archetype-colored circles
- Verify `prose prose-invert` vs `thermal-typography` CSS specificity (Tanya #27 Tier 1 item #2)
- Scan for hardcoded colors (`#` in components) — Tanya #27 Tier 4 item #10
- Consider `display: 'optional'` for Space Grotesk font loading

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
