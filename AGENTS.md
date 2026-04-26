# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — 8 ledgers (motion · elevation · color · typography · spacing · radius · alpha · z-index) + ambient-surfaces CSS + print-surface CSS + contrast helpers + worldview chip manifest + archetype-accents manifest (NextRead farewell chip border+text+glyph) + voice-ledger (Surface→Voice fence) + WCAG contrast pairs (`CONTRAST_PAIRS`) + three sibling contrast audits (worldview chip at hairline · archetype chip border at muted · halo at 1.5:1 ambient floor — different surfaces, different floors, by intent — Tanya UX #22 §3.3 / #85 §6)
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG, toast-store
- `lib/mirror/` — archetype scoring + archetype-store
- `lib/return/` — recognition-surface selector (`letter` | `whisper` | `silent`)
- `lib/thread/` — ThreadPulse: RAF sub-pixel depth driver for Golden Thread
- `lib/hooks/` — phase-machine hooks (Threshold, Press, Field, useToast, useThreadDepth, useLoopFunnel, useScrollRise)
- `lib/content/` — markdown stripping pipeline (`stripMarkdownTokens`, `collapseWhitespace`, `excerpt`)
- `lib/source-scan/` — build-time source scanners (`stripCommentsAndStrings`); shared substrate for `scripts/audit-*`
- `lib/utils/reader-locale.ts` — reader-facing date formatting
- `components/shared/` — Threshold, Pressable, Field, TextLink, Skeleton, Toast, EmptySurface, SuspenseFade, CaptionMetric, CollapsibleSlot
- `components/reading/` — Golden Thread, ceremony, keepsake, ReadersMark, ArticleProvenance, ReadProgressCaption
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System
8 ledgers, 9 shared primitives. Pair rule: adding the next one means shipping sync + adoption tests in the same PR. Radius rungs carry a typed `posture` field (`label · held · ceremony · closure`). Accessibility flows through `// reader-invariant` surfaces.

**Posture suggests, posture does not dictate.** Do not add `motionByPosture()` or cross-ledger accessors — the correlation lives in the reviewer's head, not in the type system.

**Margins for a collapsible portal live on the portal's envelope, not on its siblings.** If a child may render `null` for one reader class, wrap it in `<CollapsibleSlot top? bottom?>` — the envelope SSRs whether the inner paints or not. Spacing math may not silently assume the recognition-positive case (Tanya #3 §5, Mike #2 §5). `scripts/audit-spacing-collapse.ts` is the local guardrail; run it before sending a portal-shape PR.

**Empty rooms speak in registers, not variants.** The four `EmptySurfaceKind` surfaces (`empty-mirror`, `empty-resonances`, `threshold-404`, `threshold-error`) all route through `<EmptySurface />` with copy resolved by `emptyPhrase(kind)`. Reflective and kinetic tones converge in most cells *by design* (Tanya §7.2 under-tinting — 5 archetypes fold to 3 buckets, kinetic IS the first-visit voice). The single sanctioned divergence is `empty-mirror`'s kinetic cell, because that surface carries a real product job for strangers (Tanya §5). Halo tint is **per-room, not per-archetype** — the room is a property of the place, not the visitor. Personalization lives in copy; ornament lives in surface. Do not promote `tint` to a reader-derived resolver, do not add `'empty'` to `voice-ledger.ts#Surface`, and do not split the under-tinting fold across the other three rooms.

## WIP
- *(none)*

## Follow-ons (deferred)
- Worldview taxonomy decision (4 chips, still arguably 3 voices). Chip glyph (`WORLDVIEW_GLYPHS` in `lib/design/worldview.ts`) carries the discriminator; collapse to 3 remains a future option touching `types/filter.ts` + `lib/design/worldview.ts` + glyph map.
- Worldview chip contrast (2026-04-26): worst-case `4.98:1` @ warm, floor 4.5:1. Audit re-aligned from `ALPHA.muted` → `ALPHA.hairline` after f0e4799 stepped the chip family.
- Archetype chip contrast (2026-04-26): worst-case `5.36:1` (`explorer` @ warm), floor `4.5:1`. `BRAND.secondary` lifted `#9d4edd → #bc8cf0` (napkin #98) so `faithful` now clears 5.60:1 vs `THERMAL_WARM.surface`. `ARCHETYPE.faithful` / `--arch-faithful` halo intentionally left at `#9d4edd` — different surface, different audit (ambient-surfaces).
- Halo ambient contrast (2026-04-26): worst-case `3.14:1` (`faithful` @ warm), floor `1.5:1` — **intentionally below WCAG 1.4.11** (3:1 non-text); ornament, not signal. Lock-low pinned in `__tests__/halo-contrast-audit.test.ts` §0 (`HALO_AMBIENT_FLOOR < WCAG_NONTEXT < WCAG_AA_TEXT`); see JSDoc on `HALO_AMBIENT_FLOOR` in `lib/design/voice-ledger.ts` for the rationale (Mike napkin #99; Tanya UX #85 §6).

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
