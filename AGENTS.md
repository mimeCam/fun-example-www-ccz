# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — six ledgers (motion, elevation, color, typography, spacing, radius) + ambient-surfaces CSS + contrast helpers
- `lib/sharing/` — clipboard, share cards, thread keepsake SVG/PNG
- `lib/mirror/` — archetype scoring
- `lib/utils/` — focus-utils, scroll-lock, reduced-motion, phase resolvers
- `components/shared/` — `<Threshold>`, `<Pressable>`, `<Field>`, `<TextLink>`
- `components/reading/` — Golden Thread, ceremony, keepsake
- `components/resonances/` — resonance drawer & shimmer
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — and the Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System
Four shared primitives: `<Threshold>`, `<Pressable>`, `<Field>`, `<TextLink>`. Six ledgers, each owns its unit space — no cross-ledger metronome.

| Ledger | File | Rungs | Unit |
|---|---|---|---|
| Motion | `lib/design/motion.ts` | 8 beats + ceremony | ms |
| Elevation | `lib/design/elevation.ts` | 6 beats (rest→radiance) | gold-α |
| Color | `lib/design/color-constants.ts` | CSS token mirror | — |
| Typography | `lib/design/typography.ts` | 6 beats (caption→display) | `--sys-tick` 4px |
| Spacing | `lib/design/spacing.ts` | 12 numeric rungs (4px→96px) | rem |
| Radius | `lib/design/radius.ts` | 4 rungs (soft·medium·wide·full) | rem + pill |

Radius does not warm with engagement — the room's constant posture. One carve-out: `mirrorRadiusBreathe` hero keyframe. Exemptions use `// <ledger-name>:exempt` comments.

## WIP
- _(none — all ledgers sealed)_

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
