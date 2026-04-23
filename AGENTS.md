# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — seven ledgers (motion, elevation, color, typography, spacing, radius, alpha) + ambient-surfaces CSS + contrast helpers
- `lib/sharing/` — clipboard, share cards, thread keepsake SVG/PNG
- `lib/mirror/` — archetype scoring
- `lib/utils/` — focus-utils, scroll-lock, reduced-motion, phase resolvers
- `components/shared/` — `<Threshold>`, `<Pressable>`, `<Field>`, `<TextLink>`, `<Skeleton>`
- `components/reading/` — Golden Thread, ceremony, keepsake
- `components/resonances/` — resonance drawer & shimmer
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — and the Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System
Five shared primitives: `<Threshold>`, `<Pressable>`, `<Field>`, `<TextLink>`, `<Skeleton>`. Seven ledgers, each owns its unit space — no cross-ledger metronome. `<Skeleton>` is a sealed composition of the Alpha (hairline↔muted) and Motion (linger) ledgers — no new rungs, three variants (`line`·`block`·`card`).

| Ledger | File | Rungs | Unit |
|---|---|---|---|
| Motion | `lib/design/motion.ts` | 8 beats + ceremony | ms |
| Elevation | `lib/design/elevation.ts` | 6 beats (rest→radiance) | gold-α |
| Color | `lib/design/color-constants.ts` | CSS token mirror | — |
| Typography | `lib/design/typography.ts` | 6 beats (caption→display) | `--sys-tick` 4px |
| Spacing | `lib/design/spacing.ts` | 12 numeric rungs (4px→96px) | rem |
| Radius | `lib/design/radius.ts` | 4 rungs (soft·medium·wide·full) | rem + pill |
| Alpha | `lib/design/alpha.ts` | 4 rungs (hairline·muted·recede·quiet) | role-in-attention α |

Radius does not warm with engagement — the room's constant posture. One carve-out: `mirrorRadiusBreathe` hero keyframe. Alpha does not warm either — Motion owns the `opacity-0` / `opacity-100` fade endpoints (allow-list: `lib/utils/animation-phase.ts`). Exemptions use `// <ledger-name>:exempt` comments.

## WIP
- _(none — all ledgers sealed)_

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
