# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — 8 design ledgers (motion · elevation · color · typography · spacing · radius · alpha · z-index)
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG, toast-store
- `lib/engagement/` — loop-funnel, archetype-bucket, funnel stats
- `components/shared/` — Threshold, Pressable, ActionPressable, Field, TextLink, Skeleton, Toast, Icons
- `components/reading/` — Golden Thread, ceremony, keepsake, ReadersMark
- `components/shared/__tests__/_jsx-fence-walker.ts` — shared transport kernel for call-site fences
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible.

## Design Rules
- **Action Receipt:** discrete events end with a settled-state acknowledgement. Canonical: `ActionPressable`. Fence: `action-receipt-fence.test.ts`.
- **Gesture Release:** continuous attachments return to rest. Canonical: `LeanArrow`.
- **Alpha call-site:** `alphaClassOf()` must pass quoted literals — no variables, no templates.
- **Voice peer:** `copyWithFeedback()` must spell `announce:` literally at every call site.
- **Verb-primitives:** component name, file path, CSS class, test pin, JSDoc all spell the same word. Do not promote to doctrine until verb #3.

## WIP
- **Gesture Atlas closed** (2026-04-27): 13 verbs, 0 grandfathered paths, fence flipped from tolerate→forbid. A typed 13-row table + a JIT-literal class factory + a shrink-only fence make a class of motion-drift bugs structurally impossible at zero added complexity. Source receipt: `lib/design/gestures.ts` § `GESTURE_GRANDFATHERED_PATHS`. Pinned by `gestures-sync.test.ts` (`toEqual([])`) and `gesture-call-site-fence.test.ts` Axis C (`toBe(0)`).
- **Keepsake frame snapped to the alpha ledger** (2026-04-27): the killer-feature surface's preview border (`QuoteKeepsake.tsx`) routes through `alphaClassOf('fog', 'muted', 'border')` — JIT-safe literal-table factory — instead of a hand-typed `border-fog/20`. The file was never on the grandfather list; the fence was already armed and silently red in CI. Pinned by `components/articles/__tests__/QuoteKeepsake.alpha.test.ts`. (No `tolerate→forbid` lifecycle name yet — wait for verb #3.)

## Open TODOs (drift sightings, deferred)
- ShareOverlay's post-click "Copied!" handoff (`mirror-share-confirm`) is a *receipt*, not a label — earns `action-swap` on its own micro-PR once the rule-of-three fires (Tanya UIX #99 §7).

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
