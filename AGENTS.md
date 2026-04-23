# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — seven ledgers (motion, elevation, color, typography, spacing, radius, alpha) + ambient-surfaces CSS + contrast helpers
- `lib/sharing/` — clipboard, share cards, thread keepsake SVG/PNG, **toast-store + reply-lexicon**
- `lib/mirror/` — archetype scoring
- `lib/thread/` — **ThreadPulse**: RAF-driven sub-pixel depth driver (modes / tween / driver) powering Golden Thread
- `lib/utils/` — focus-utils, scroll-lock, reduced-motion, phase resolvers
- `lib/hooks/` — phase-machine hooks (Threshold, Press, Field, **useToast**, **useThreadDepth**)
- `components/shared/` — `<Threshold>`, `<Pressable>`, `<Field>`, `<TextLink>`, `<Skeleton>`, `<Toast>` (+ `<ToastHost>`)
- `components/reading/` — Golden Thread, ceremony, keepsake
- `components/resonances/` — resonance drawer & shimmer
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — and the Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System
Six shared primitives: `<Threshold>`, `<Pressable>`, `<Field>`, `<TextLink>`, `<Skeleton>`, `<Toast>`. Seven ledgers, each owns its unit space — no cross-ledger metronome. `<Skeleton>` is a sealed composition of the Alpha (hairline↔muted) and Motion (linger) ledgers — no new rungs, three variants (`line`·`block`·`card`). `<Toast>` is a portal-mounted single-slot reply (n=1, fixed dwell, no warmth modulation, no glow); the store (`lib/sharing/toast-store.ts`) is a tiny pub/sub singleton serving both React-side (`useToast()`) and pure-TS (`toastShow(...)`) callers; the voice (`lib/sharing/reply-lexicon.ts`) folds 5 archetypes → 3 tone buckets and locks the confirm-verb invariant. Single host: `<ToastHost />` mounted once in `<ThermalLayout>`.

Pair rule: adding an 8th ledger means shipping `<ledger>-sync.test.ts` AND `<ledger>-adoption.test.ts` in the same PR — the row doesn't count until both land.

| Ledger | File | Rungs | Unit |
|---|---|---|---|
| Motion | `lib/design/motion.ts` | 8 beats + ceremony | ms |
| Elevation | `lib/design/elevation.ts` | 6 beats (rest→radiance) | gold-α |
| Color | `lib/design/color-constants.ts` | sync + adoption guards (3 scanners: hex · rgb/hsl · TW-palette) | — |
| Typography | `lib/design/typography.ts` | 6 beats (caption→display) × {leadN, wrap, kern, track} | `--sys-tick` 4px + em |
| Spacing | `lib/design/spacing.ts` | 12 numeric rungs (4px→96px) | rem |
| Radius | `lib/design/radius.ts` | 4 rungs (soft·medium·wide·full) | rem + pill |
| Alpha | `lib/design/alpha.ts` | 4 rungs (hairline·muted·recede·quiet) + color-alpha shorthand fence | role-in-attention α |

Radius does not warm with engagement — the room's constant posture. One carve-out: `mirrorRadiusBreathe` hero keyframe. Alpha does not warm either — Motion owns the `opacity-0` / `opacity-100` fade endpoints (allow-list: `lib/utils/animation-phase.ts`). Exemptions use `// <ledger-name>:exempt` comments.

**Thermal reactivity is declared per property, not per ledger.** A new ledger property must state, at birth: does it warm with engagement? `track` (Typography letter-spacing) does not — it is the reader's voice-print, frozen across archetypes. `line-height` does, via `--token-line-height`. `radius` does not, except for the `mirrorRadiusBreathe` hero carve-out. Body-prose letter-spacing warms through the single `--token-letter-spacing` carve-out, not through `track`. The adoption guard enforces the declaration; the reviewer enforces the justification.

Adoption guards extend the fence site-wide: `motion-adoption` now catches raw numeric `setTimeout(_, N)` literals in `components/**` / `lib/hooks/**`; `alpha-adoption` now catches inline-style `opacity: N` literals alongside the existing Tailwind `opacity-NN` sweep, **and (Phase II) the Tailwind `(bg|text|border|shadow)-<color>/N` shorthand** — only ledger rungs {10, 30, 50, 70} admitted, `/100` reserved for Motion fade endpoints. Legitimate color-alpha surfaces route through `alphaClassOf(color, rung, kind)` in `lib/design/alpha.ts` (JIT-safe literal table, one entry per (kind × family × rung) cell). Pre-Phase-II drift is absorbed by `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS` — one receipt per file, shrinks only. Flagship `GoldenThread.tsx` quotes `CEREMONY.glowHold` for the settled→fading dwell and `ALPHA.muted` for the fading posture — no magic numbers; its Thread-track `bg-fog/30` now routes through `alphaClassOf('fog','muted')`, same literal emitted.

## WIP
- _(none — all 7 ledgers sealed with sync + adoption guards; 6 shared primitives shipped)_

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
