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
Four shared primitives with phase machines, reduced-motion branches, and adoption guards: `<Threshold>`, `<Pressable>`, `<Field>`, `<TextLink>`. **Four ledgers, each owns its unit space — no cross-ledger metronome.**

- **Motion** — `lib/design/motion.ts`. 8 beats (crossfade→settle) + ceremony namespace. Unit: ms.
- **Elevation** — `lib/design/elevation.ts`. 6 beats (rest · rise · float · whisper · bloom · radiance — depth/glow split). Unit: gold-α.
- **Color Constants** — `lib/design/color-constants.ts`. Canvas mirror of CSS tokens.
- **Typography** — `lib/design/typography.ts`. 6 beats (caption · body · lede · passage · heading · display). Unit: 4px tick (`--sys-tick`); leading = integer × tick. Per-beat `text-wrap` (auto/pretty/balance) and optical kerning baked into `.typo-<beat>` utility classes; helper `classesOf(beat)` returns the bundle.

Gesture chrome in `lib/design/ambient-surfaces.css`. WCAG helpers in `lib/design/contrast.ts`.

## WIP
- _(none — Elevation Ledger sealed; see Design System note.)_

## Design notes
- **Elevation Ledger — one voice.** Six-beat ledger is the single dialect; legacy `void/rise/float/gold/gold-intense` Tailwind aliases deleted. Tinted accents `rose-glow` (remembered) and `cyan-whisper` (discovery) live **outside** the ledger by design — reader-authored warmth, not site-authored room temperature — and are allow-listed per-file by the adoption guard (`StratifiedRenderer.tsx`, `ResonanceEntry.tsx`). Keyframe tweens stay inline by design.
- **Typography Ledger — name the family, not the use.** Six leading-beats live in `lib/design/typography.ts`; raw `leading-tight|relaxed|none|<n>` and arbitrary `leading-[…]` are guard-failed in components. The two allowed arbitraries are `leading-[var(--sys-lead-*)]` (the ledger) and `leading-[var(--token-line-height)]` (thermal carve-out — continuous scalar, not a beat). Icon glyphs (`leading-none` close-X) carry a `// typography-ledger:exempt` comment.
- **`--sys-tick: 4px` is scoped.** Every beat's leading is `calc(var(--sys-tick) * N)`, integer N. Do not wire the tick into Motion (ms) or Elevation (gold-α). Different ledgers, different unit spaces.
- **Intentional visual delta:** `shadow-gold` → `shadow-sys-bloom` on mirror/return surfaces is a real pixel change (y-offset 8→0, blur 40→18, α 25→22%). The cards stop *lifting* and start *haloing* — the gesture moves from "I am above the page" to "the room is warming." Review on pixels, not diction.
- **Typography migration delta:** the article `<h1>` swapped `leading-tight tracking-tight` for `typo-display`. Letter-spacing tightens slightly less (-0.025em → -0.01em) and the line locks to the 4px grid (40px); in exchange the headline gains `text-wrap: balance` and optical kerning. Review on ragged-line behaviour.

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
