# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — color constants
- `lib/sharing/` — clipboard, share cards, thread keepsake SVG/PNG
- `lib/mirror/` — archetype scoring
- `lib/utils/` — focus-utils, scroll-lock, isomorphic effect (shared primitives)
- `components/reading/` — Golden Thread, ceremony, keepsake
- `components/resonances/` — resonance drawer & shimmer
- `components/shared/` — `<Threshold>` modal primitive, gem icon, whisper footer
- `app/api/og/` — social unfurl endpoints
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — and the Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System
Modals use the shared `<Threshold>` primitive (two variants: `center`, `drawer-right`). It owns portal, backdrop, ARIA, focus trap, focus return, scroll-lock, ESC (topmost only), reduced-motion, and a four-state **phase machine** (`closed → opening → open → closing → closed`) with deferred unmount — exit plays a staggered 150 ms choreography (chamber recedes; backdrop dims 60 ms later; both finish together). Callers own chrome. Phase/class/stagger constants live in `lib/utils/animation-phase.ts`. See `components/shared/Threshold.tsx`.

Buttons use the shared `<Pressable>` primitive (three variants: `solid`, `ghost`, `icon`; two sizes: `sm`, `md`; `asChild` slot for non-`<button>` triggers). It reads `--token-accent` for focus via the global `:focus-visible` rule (never overrides), pulls 35% of the *current* accent into the disabled tint, and shares the `cubic-bezier(0, 0, 0.2, 1)` ease-out curve with every thermal transition (shared easing, not shared duration — press is ~80ms). A three-state **press phase** (`idle → down → settling → idle`) drives the tactile scale/opacity swap with a reduced-motion branch that collapses to opacity-only. Style/phase resolvers live in `lib/utils/press-phase.ts`; the hook is `lib/hooks/usePressPhase.ts`. See `components/shared/Pressable.tsx`. Contrast of the global focus ring is gated by `lib/utils/__tests__/contrast.test.ts` (WCAG 1.4.11 across thermal scores 0/25/50/75/100).

## WIP
_None_

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
