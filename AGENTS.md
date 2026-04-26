# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — 8 ledgers (motion · elevation · color · typography · spacing · radius · alpha · z-index), voice-ledger, WCAG contrast pairs
- `lib/design/hue.ts` — canonical hex↔RGB↔HSL kernel + `circularHueDelta` + `oklchDeltaE`
- `lib/design/hue-distance.ts` — per-surface dual-axis audit kernel (Δh + ΔE)
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG, toast-store
- `lib/ceremony/` — quiet-store (gifting-phase pub/sub)
- `lib/mirror/` — archetype scoring + archetype-store
- `lib/return/` — recognition-surface selector
- `lib/thread/` — ThreadPulse: RAF sub-pixel depth driver for Golden Thread
- `lib/hooks/` — phase-machine hooks (Threshold, Press, Field, useToast, etc.)
- `components/shared/` — Threshold, Pressable, ActionPressable, Field, TextLink, Skeleton, Toast, Icons, etc.
- `components/reading/` — Golden Thread, ceremony, keepsake, ReadersMark, etc.
- `components/articles/` — QuoteKeepsake (quote-card host #2 for direct-gesture asymmetry)
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System Rules
**Direct-gesture asymmetry.** When a user gesture has a fingertip-local witness (an `<ActionPressable>` or equivalent: glyph swap + verb tense flip + same-source `<PhaseAnnouncement>` sr-only peer), success stays at the fingertip — no toast. Failure escalates one level to the room (warn-intent toast) because the reader needs to know when the contract breaks. Surfaces with no fingertip witness (e.g. `runShare`'s `navigator.share` failover) opt in to the room voice explicitly via `copyWithFeedback(text, { announce: 'room' })`. *Primary buttons are not exempt. If a fingertip witness fits the verb, the primary uses it too — visual prominence does not change the witness selection.* Prose, not a token — the registry earns its keep on the third independent reintroduction (Mike rule of three; doctrine: Mike #70 §A — *"no ninth ledger; the type-pinned tuple is the only registry"*).

## WIP
- *(none)*

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
