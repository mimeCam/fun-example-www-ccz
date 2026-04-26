# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — 8 ledgers (motion · elevation · color · typography · spacing · radius · alpha · z-index), voice-ledger, WCAG contrast pairs, eight sibling contrast audits
- `lib/design/hue.ts` — canonical hex↔RGB↔HSL kernel + `circularHueDelta` + `oklchDeltaE` (live binding gate alongside `circularHueDelta`; the eyeball, sibling to the wheel). Contrast, thermal-tokens, and focus-ink physics route through it. Drift = `npx jest` red.
- `lib/design/hue-distance.ts` — per-surface dual-axis audit kernel (`familyPairs`, `deltaTable`, `worstPair`, `surfaceReceipt` for Δh; `deltaEPair`, `worstPerceptualPair`, `dualReceipt` for ΔE); three callers (archetype + worldview + textlink-passage sibling-voice audits), one stateless kernel, no class hierarchy.
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG, toast-store
- `lib/ceremony/` — quiet-store (gifting-phase pub/sub for host-level suppression)
- `lib/mirror/` — archetype scoring + archetype-store
- `lib/return/` — recognition-surface selector
- `lib/thread/` — ThreadPulse: RAF sub-pixel depth driver for Golden Thread
- `lib/hooks/` — phase-machine hooks (Threshold, Press, Field, useToast, etc.)
- `components/shared/` — Threshold, Pressable, Field, TextLink, Skeleton, Toast, EmptySurface, SkipLink, etc.
- `components/reading/` — Golden Thread, ceremony, keepsake, ReadersMark, etc.
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System Rules
- **Posture suggests, does not dictate.** No `motionByPosture()` or cross-ledger accessors.
- **Portal margins live on the envelope.** Wrap nullable children in `<CollapsibleSlot>`. Run `scripts/audit-spacing-collapse.ts` before portal-shape PRs.
- **Empty rooms speak in registers, not variants.** Copy varies by reader; ornament varies by room. Halo tint is per-room, not per-archetype.
- **Ceremony quiet — gate at the host, not at the call site.** During `useCeremonyQuiet()` (gifting phase) output surfaces defer. Toast suppresses in `<ToastHost>`; thermal crossing pulses suppress in `onCrossing()`. Input-side surfaces (popovers opening from a new gesture) may guard per-instance. The silence is the design.
- **Reader-invariant chrome — `id="main-content"` is the SkipLink's landmark.** Every route's top-level wrapper carries the id (`<main>`, `<article>`, or wrapper `<div>` for the mirror). The audit lives in `lib/sharing/__tests__/trust-promise-honored.test.ts`; a route shipping without the landmark fails CI. SkipLink mounts once, in `app/layout.tsx`, as the first child of `<body>`. CSS-only slide; works pre-hydration.
- **Reader-invariant promise → audit pairings.** `TRUST_INVARIANTS` (`lib/sharing/trust-copy.ts`) ships exactly five reader-verifiable surfaces; each is anchored to a real audit module via `assertTrustAnchor(i, label)` in `lib/sharing/__tests__/_helpers.ts`. A grep for `assertTrustAnchor(` returns five hits — one per index, one per audit. (Mike #70 §A — *no ninth ledger*; the type-pinned tuple is the only registry.)
  - `[0]` "The focus ring" → `lib/design/__tests__/focus-ring-contrast-audit.test.ts` (the painted-receipt audit; `focus-ink-byte-identity.test.ts` remains as a sibling physics gate, no anchor)
  - `[1]` "The skip-link" → `lib/sharing/__tests__/trust-promise-honored.test.ts`
  - `[2]` "The share envelope’s left rule" → `lib/sharing/__tests__/clipboard-envelope.test.ts`
  - `[3]` "The thread keepsake’s timestamp" → `lib/sharing/__tests__/thread-render.test.ts` (locale/TZ/DST sweep, Mike #70 §B)
  - `[4]` "This page" → `app/trust/__tests__/trust-page.test.ts`

## WIP
- *(none)*

## Adoption Fences

> One literal, one canonical home (or two when JIT/SVG forces the second).
> Each fence is a grep-shaped CI guard naming the legal exits in its
> failure message. New entries land in this list in the same shape
> (Tanya UX #60 §3 — *shape decides group*).

- Caption-metric face — `<CaptionMetric>` is the only legal speller of the `tracking-sys-caption + tabular-nums` tuple (`lib/design/__tests__/caption-metric-adoption.test.ts`).
- Numeric-features literals — `font-feature-settings: 'tnum' 1, 'lnum' 1` lives in `lib/design/typography.ts`; the SVG keepsake consumer is the only other home (`lib/design/__tests__/numeric-features-adoption.test.ts`).
- Filled-glyph optical lift — `relative -top-[0.5px]` lives ONLY in `lib/design/typography.ts` as `FILLED_GLYPH_OPTICAL_LIFT_CLASS`; the worldview + archetype chip manifests reach for the constant by name (Tailwind JIT scans `lib/`, so one literal is sufficient). Symmetric `align-baseline` is wired on both chip rests (NextRead + ExploreArticleCard). `▲` aesthetic carve-out preserved; sub-pixel paint receipt deferred per JSDoc caveat. (`lib/design/__tests__/filled-glyph-lift-adoption.test.ts` — Mike napkin #100, Tanya UX #100, Sid 2026-04-26.)

## Contrast Audit Receipts

> Two named groups; cardinality lives in the heading. Within each group every
> receipt reads in the same shape — numbers, not adjectives (Tanya UX #60 §3:
> "shape decides group; new audits land in the group whose shape they share").
> SkipLink prints "at both anchors" but is audited as a Thermal Voice today —
> its *audit shape* is paint-byte identity, not the type-pinned brand the focus
> ring carries (Mike #103 §7 risk note; rule of three).

### Reader Anchor (invariant chrome) (1)
- Focus ring: worst-case `3.94:1` at both anchors, floor 3.0:1 (WCAG 1.4.11 non-text; reader-invariant chrome — type forbids divergence) · hue-Δ `1.91°` vs THERMAL.accent (floor ≤ `10°`; same violet family)

### Thermal Voices (7)
- Worldview chip: worst-case `4.98:1` @ warm, floor 4.5:1
- Archetype chip: worst-case `5.24:1` @ warm, floor 4.5:1 (post 15°-lift; explorer accent #c77dff → #dc6cff)
- Halo ambient: worst-case `3.14:1` @ warm, floor 1.5:1 (intentionally sub-WCAG; ornament, not signal)
- Keepsake gold: worst-case `8.95:1` @ warm, floor 3.0:1 (WCAG 1.4.11 non-text; signal)
- Thread accent: cold `2.24:1` · warm `8.95:1`, floor 1.5:1 (intentionally sub-WCAG ambient cue; signal at warm — the spread is the killer feature)
- SkipLink (static): `6.60:1` at both anchors, floor 4.5:1 (paint-byte-identical at both thermal anchors)
- TextLink (passage): rest `5.24:1` · hover-gold `8.95:1` · hover-rose `6.13:1` (worst-case across destination accents) @ warm, floor 4.5:1 (WCAG 1.4.3 — the foreshadow gesture being honest about itself; rest hex tracked accentViolet through the 15° lift)

### Sibling Voice Hue Distance (3)

> Two named axes per receipt — hue angle (Δh, degrees) and perceptual distance
> (OKLab ΔE). Sibling voices on a shared surface must clear both floors;
> either alone misses low-chroma collapse. Floors per audit (the floor is the
> architecture, not a paint value — Mike POI #6). Mirrors the Contrast Audit
> Receipts shape (two named anchors). One stateless kernel
> (`lib/design/hue-distance.ts`), three callers, plus one mutation receipt
> (`sibling-voice-perceptual-mutation.test.ts`) — drift = red.

- Archetype chip (NextRead): Δh `16.91°` @ accent↔secondary (floor 15°) · ΔE `8.74` @ accent↔secondary (floor 6) — sibling violets distinguishable on a real screen; the same pair pins both axes (Mike napkin #100/#131, Tanya UX #12/#37, Sid 2026-04-26)
- Worldview chip (ExploreArticleCard): Δh `58.11°` @ accent↔rose (floor 45°) · ΔE `17.01` @ accent↔rose (floor 10) — three distinct text-color families `{accent, cyan, rose}`; technical/philosophical share `text-accent` by design — `WORLDVIEW_GLYPHS` `▣`/`◇` is the non-color discriminator (Mike napkin §"Sibling Voice Hue Distance (2)"/#131, Tanya UX #10 §2.3 / #37, Sid 2026-04-26)
- TextLink (passage): Δh `55.86°` @ gold↔rose (floor 45°) · ΔE `17.01` @ accent↔rose (floor 10) — three foreshadow voices `{accent, gold, rose}`; gold↔rose binds Δh, accent↔rose binds ΔE; the cross-family pairs cross warm-yellow ↔ warm-pink and violet ↔ warm-pink boundaries (Mike napkin #131, Elon #27, Tanya UX #39, Sid 2026-04-26)

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
