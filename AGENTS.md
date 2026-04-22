# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — color constants
- `lib/sharing/` — clipboard, share cards, thread keepsake SVG/PNG
- `lib/mirror/` — archetype scoring
- `lib/utils/` — focus-utils, scroll-lock, isomorphic effect, reduced-motion, phase resolvers (press/field/animation) — shared primitives
- `components/reading/` — Golden Thread, ceremony, keepsake
- `components/resonances/` — resonance drawer & shimmer
- `components/shared/` — `<Threshold>`, `<Pressable>`, `<Field>`, gem icon, whisper footer
- `app/api/og/` — social unfurl endpoints
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — and the Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System
Four shared primitives, each with a phase machine, reduced-motion branch, and adoption guard that blocks raw alternatives:

- **`<Threshold>`** (`center`, `drawer-right`) — modals. Portal, backdrop, ARIA, focus trap, scroll-lock, ESC. Four-state exit choreography (staggered 150 ms). → `components/shared/Threshold.tsx`, phase constants in `lib/utils/animation-phase.ts`
- **`<Pressable>`** (`solid`, `ghost`, `icon` · `sm`/`md` · `asChild`) — buttons. Thermal-native accent, shared ease-out curve, 3-state press phase. → `components/shared/Pressable.tsx`, resolvers in `lib/utils/press-phase.ts`, hook in `lib/hooks/usePressPhase.ts`
- **`<Field>`** (`text`, `multiline` · `sm`/`md`) — inputs. Caret = accent, 120 ms border crossfade, 3-state field phase (rest → focus → rest + transient `error-held`). → `components/shared/Field.tsx`, resolvers in `lib/utils/field-phase.ts`, hook in `lib/hooks/useFieldPhase.ts`
- **`<TextLink>`** (`inline`, `passage`, `quiet`) — links. Internal = `next/link`, external = `<a target="_blank" rel="noopener noreferrer">` + tiny off-site glyph. 120 ms crossfade on `color`, `text-decoration-thickness`, `text-underline-offset`, `text-decoration-color` — one unified gesture. `passage` resolves destination accent from route (`/mirror` → gold, `/resonances` → rose) so hover previews the next room. 3-state link phase (idle → hover → idle + focus). → `components/shared/TextLink.tsx`, resolvers in `lib/utils/link-phase.ts`, hook in `lib/hooks/useLinkPhase.ts`

Shared: `prefers-reduced-motion` probe in `lib/utils/reduced-motion.ts`. WCAG contrast gates in `lib/utils/__tests__/contrast.test.ts` + `link-phase.test.ts`. Adoption guards: `pressable-adoption.test.ts`, `field-adoption.test.ts`, `textlink-adoption.test.ts`.

## WIP
_None_

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
