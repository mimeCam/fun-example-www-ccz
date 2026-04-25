# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — 8 ledgers + ambient-surfaces CSS + contrast helpers + focus mirror
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG, toast-store, reply-lexicon, reply-resolve
- `lib/mirror/` — archetype scoring + archetype-store (pure-TS snapshot reader)
- `lib/thread/` — ThreadPulse: RAF sub-pixel depth driver for Golden Thread
- `lib/utils/` — focus-utils, scroll-lock, reduced-motion, prefers-contrast, phase resolvers
- `lib/hooks/` — phase-machine hooks (Threshold, Press, Field, useToast, useThreadDepth, useLoopFunnel, useScrollRise)
- `components/shared/` — Threshold, Pressable, Field, TextLink, Skeleton, Toast, EmptySurface, SuspenseFade
- `components/reading/` — Golden Thread, ceremony, keepsake
- `lib/engagement/` — loop funnel instrumentation (checkpoint + funnel API routes)
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System
8 ledgers (motion · elevation · color · typography · spacing · radius · alpha · z-index), each owns its unit space. 8 shared primitives: Threshold, Pressable, Field, TextLink, Skeleton, Toast, EmptySurface, SuspenseFade. Pair rule: adding a 9th ledger or primitive means shipping sync + adoption tests in the same PR.

- **Toast**: single acknowledgment voice; `toast-adoption` guard ensures every `toastShow` routes through the lexicon or reviewed `poetic-overrides`.
- **EmptySurface**: single frame for the four quietest rooms (empty-mirror, empty-resonances, 404, error); `empty-adoption` guard protects raw-tag + tone perimeter.
- **SuspenseFade**: wraps in-page `<Suspense>` with sealed `SKELETON.handoff` crossfade; `data-sys-enter="fade"`.
- **Focus ring**: reader-invariant (`// reader-invariant`), painted from `--sys-focus-ink` (NOT `--token-accent`), two-stop `box-shadow`, inherits host `border-radius` — no radius of its own. Byte-identity gate in `focus-ink-byte-identity.test.ts`. Accessibility media queries (`prefers-reduced-motion`, `prefers-contrast: more`, future `forced-colors`) flow through `// reader-invariant` surfaces — they clarify, they do not warm.

## `/trust` Room
Server page that refuses to warm: no thermal tokens on foreground, no archetype fork, no Golden Thread. Copy in `lib/sharing/trust-copy.ts` (3 sentences, 5 invariants — list does not grow). Entry via WhisperFooter only. Enforced by `app/trust/__tests__/trust-page.test.ts`.

## Voice Parity
- **Share seam**: default toast phrases flow through `reply-resolve.ts → archetype-store → 5→3 tone fold`. Explicit overrides win. Clipboard centrality guard enforces single `navigator.clipboard.writeText` caller. Static HTML envelope in `clipboard-envelope.ts`.
- **Empty-surface seam**: 4 quietest rooms compose `<EmptySurface />`. Headline + whisper flow through `empty-phrase.ts` (same 5→3 tone fold).

## Reader Loop Funnel
4 booleans (`resolved · warmed · keepsaked · shared`) + implicit `landed`. One row/session in `loop_funnel`, monotonic flags, zero PII. Client: `useLoopFunnel(articleId, archetype)` — SSR-safe, idempotent, `sendBeacon` first. Server: `POST /api/loop/checkpoint` (zod, 204), `GET /api/loop/funnel` (token-gated). Invisible to reader.

## WIP
- _(none — all 8 ledgers sealed; 8 primitives shipped; voice parity wired; SuspenseFade live on 4 surfaces; loop funnel live; focus-ring corner-parity shipped; `/trust` live; per-threshold crossing micro-ceremonies shipped; Golden Thread tide mark semantics shipped — never retreats, breathes when settled, persists across sessions)_

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
