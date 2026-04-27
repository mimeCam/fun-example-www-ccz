# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — 8 design ledgers (motion · elevation · color · typography · spacing · radius · alpha · z-index), WCAG contrast pairs
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG, toast-store
- `lib/engagement/` — loop-funnel, archetype-bucket, funnel stats
- `components/shared/` — Threshold, Pressable, ActionPressable, Field, TextLink, Skeleton, Toast, Icons
- `components/reading/` — Golden Thread, ceremony, keepsake, ReadersMark
- `components/articles/` — QuoteKeepsake
- `components/shared/__tests__/_jsx-fence-walker.ts` — shared transport kernel for call-site fences (5 tenants: lean-arrow, alpha, voice, action-receipt, gesture)
- `lib/design/__tests__/action-receipt-allowlist.ts` — single source of truth for receipt-bearing JSX hosts
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible.

## Design Rules
- **Action Receipt:** discrete events (click/copy/share/save/dismiss/submit) end with a settled-state acknowledgement — visible delta + SR peer, same source. Canonical host: `ActionPressable` (`components/shared/ActionPressable.tsx`). Fence: `components/shared/__tests__/action-receipt-fence.test.ts`. Escape hatch: `// receipt-opt-out: <reason>` on the handler line.
- **Gesture Release:** continuous attachments (hover, focus-within, scroll) return to rest. The release IS the third state — no fourth ceremony. Canonical: `LeanArrow` (`components/shared/LeanArrow.tsx`).
- **Direct-gesture asymmetry:** fingertip witness → no toast; no witness → room voice via `announce: 'room'`
- **Voice peer:** `copyWithFeedback()` must spell `announce:` literally at every call site (fence: `lib/sharing/__tests__/voice-call-site-fence.test.ts`)
- **Alpha call-site:** `alphaClassOf()` must pass quoted literals — no variables, no templates (fence: `components/shared/__tests__/alpha-call-site-fence.test.ts`)
- **Verb-primitives:** component name, file path, CSS class, test pin, JSDoc all spell the same word. Do not promote to doctrine until verb #3

## WIP
- **Gesture Atlas migration** — `lib/design/gestures.ts` ships the 12-verb typed table + `gestureClassesOf(verb)` JIT-safe factory + the 5th `_jsx-fence-walker` tenant (`gesture-call-site-fence`). Two call sites migrated as proof of wiring (`ExploreArticleCard` `title-warm`, `AmbientNav` `crossfade-inline`). Remaining ~10 files in `GESTURE_GRANDFATHERED_PATHS` — each is a future micro-PR receipt (the list ONLY shrinks). `reduced` policy column is locked at the type level; the resolver wiring is a follow-up sprint (verbs settle first). Verb-vocabulary doctrine line waits for verb #3 firing per AGENTS.md rule.

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
