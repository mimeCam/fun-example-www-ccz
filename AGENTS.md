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
- **Gesture Atlas closed** (2026-04-27): 13 verbs, 0 grandfathered paths, fence flipped tolerate→forbid. `lib/design/gestures.ts`.
- **Keepsake alpha snap** (2026-04-27): `QuoteKeepsake.tsx` border routes through `alphaClassOf()`. Pinned by `QuoteKeepsake.alpha.test.ts`.
- **ReturnLetter Copy → canonical receipt** (2026-04-27): `ActionPressable` + `useActionPhase`. Third speaker of `action-swap` — rule-of-three fires. `Save as Image` stays `<Pressable>` (download = browser receipt). Pinned by `ReturnLetter.gestures.test.ts`.
- **ShareOverlay Copy Link → action-swap** (2026-04-27): the last bespoke `mirror-share-confirm` flash is retired; the Copy Link icon graduates to `<ActionPressable variant="icon" labelMode="hidden">`. The verb is spoken at every settle/release/copy/save site in tree. SR readers now hear "Copied!" once on settle. `Save PNG` and `Share on X` stay `<Pressable>` (download / nav = browser receipt). Pinned by `ShareOverlay.action.test.ts`; fence Axis E floor lifted 1→2.

## Open TODOs
- (none open this cycle)

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
