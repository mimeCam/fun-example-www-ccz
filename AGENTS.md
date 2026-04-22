# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — color constants, motion tokens, contrast helpers, ambient-surfaces CSS
- `lib/sharing/` — clipboard, share cards, thread keepsake SVG/PNG
- `lib/mirror/` — archetype scoring
- `lib/utils/` — focus-utils, scroll-lock, reduced-motion, phase resolvers (press/field/animation/link)
- `components/shared/` — `<Threshold>`, `<Pressable>`, `<Field>`, `<TextLink>`
- `components/reading/` — Golden Thread, ceremony, keepsake
- `components/resonances/` — resonance drawer & shimmer
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — and the Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System
Four shared primitives with phase machines, reduced-motion branches, and adoption guards: `<Threshold>`, `<Pressable>`, `<Field>`, `<TextLink>`. **Five ledgers, each owns its unit space — no cross-ledger metronome.**

- **Motion** — `lib/design/motion.ts`. 8 beats (crossfade→settle) + ceremony namespace. Unit: ms.
- **Elevation** — `lib/design/elevation.ts`. 6 beats (rest · rise · float · whisper · bloom · radiance — depth/glow split). Unit: gold-α.
- **Color Constants** — `lib/design/color-constants.ts`. Canvas mirror of CSS tokens.
- **Typography** — `lib/design/typography.ts`. 6 beats (caption · body · lede · passage · heading · display). Unit: 4px tick (`--sys-tick`); leading = integer × tick. Per-beat `text-wrap` (auto/pretty/balance) and optical kerning baked into `.typo-<beat>` utility classes; helper `classesOf(beat)` returns the bundle.
- **Spacing** — `lib/design/spacing.ts`. 12 numeric rungs (`sys-space-1…12`, 4px → 96px, tightest → loosest). Unit: rem. Thermal carve-out `--token-space-lift-N` is a first-class citizen (`liftVar(n)`) — macro rungs open ~8px at luminous, zero at dormant, 0px SSR fallback. No literary beat names: `passage` belongs to Typography, and 12→6 is lossy for the 70+ live `sys-{6,9,11,12}` call-sites.

Gesture chrome in `lib/design/ambient-surfaces.css`. WCAG helpers in `lib/design/contrast.ts`.

## WIP
- _(none — Spacing Ledger sealed this sprint; Elevation Ledger sealed earlier. See Design System note.)_

## Design constraints
- Each ledger owns its unit space — no cross-ledger metronome: Motion (ms), Elevation (gold-α), Typography (`--sys-tick` 4px), Spacing (rem). Mixing units between ledgers is a category error.
- Exemptions use `// <ledger-name>:exempt` comments, searchable and adoption-guard-respected. Icon glyphs with `leading-none`, foreign-DOM clipboard HTML, keyframe tweens — all documented.
- Tinted reader accents (`rose-glow`, `cyan-whisper`) live outside the Elevation Ledger by design — reader-authored warmth, not room temperature.

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
