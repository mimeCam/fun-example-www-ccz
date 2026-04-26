# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/design/` — 8 ledgers (motion · elevation · color · typography · spacing · radius · alpha · z-index), voice-ledger, WCAG contrast pairs, four sibling contrast audits
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG, toast-store
- `lib/ceremony/` — quiet-store (gifting-phase pub/sub for host-level suppression)
- `lib/mirror/` — archetype scoring + archetype-store
- `lib/return/` — recognition-surface selector
- `lib/thread/` — ThreadPulse: RAF sub-pixel depth driver for Golden Thread
- `lib/hooks/` — phase-machine hooks (Threshold, Press, Field, useToast, etc.)
- `components/shared/` — Threshold, Pressable, Field, TextLink, Skeleton, Toast, EmptySurface, etc.
- `components/reading/` — Golden Thread, ceremony, keepsake, ReadersMark, etc.
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible — Thread Keepsake lets readers share a unique artifact of *their* read.

## Design System Rules
- **Posture suggests, does not dictate.** No `motionByPosture()` or cross-ledger accessors.
- **Portal margins live on the envelope.** Wrap nullable children in `<CollapsibleSlot>`. Run `scripts/audit-spacing-collapse.ts` before portal-shape PRs.
- **Empty rooms speak in registers, not variants.** Copy varies by reader; ornament varies by room. Halo tint is per-room, not per-archetype.
- **Ceremony quiet — gate at the host, not at the call site.** During `useCeremonyQuiet()` (gifting phase) output surfaces defer. Toast suppresses in `<ToastHost>`; thermal crossing pulses suppress in `onCrossing()`. Input-side surfaces (popovers opening from a new gesture) may guard per-instance. The silence is the design.

## WIP
- *(none)*

## Contrast Audit Receipts
- Worldview chip: worst-case `4.98:1` @ warm, floor 4.5:1
- Archetype chip: worst-case `5.36:1` @ warm, floor 4.5:1
- Halo ambient: worst-case `3.14:1` @ warm, floor 1.5:1 (intentionally sub-WCAG; ornament, not signal)
- Keepsake gold: worst-case `8.95:1` @ warm, floor 3.0:1 (WCAG 1.4.11 non-text; signal)

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
