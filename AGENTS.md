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
- **Gesture Atlas migration** — 13-verb typed table at `lib/design/gestures.ts` + `gestureClassesForMotion(verb, prefersReduced)` runtime composer + `useReducedMotion()` hook. 3 files remain in `GESTURE_GRANDFATHERED_PATHS` (list ONLY shrinks): `components/mirror/ShareOverlay.tsx`, `components/return/ReturnLetter.tsx`, `lib/resonances/visited-launcher.ts`.
- **One Mirror, One Room** — *shipped*. `QuickMirrorCard.tsx` retired (orphan, never rendered). One card, one room on `/mirror`.
- **ResonanceEntry redemption** — *shipped*. The Book-of-You card's two transitions (`card-settle` + `fade-neutral`) read off the Atlas via `gestureClassesForMotion(verb, reduce)`; `prefers-reduced-motion` is now honored at the card surface.

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
