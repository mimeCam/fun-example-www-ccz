# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/design/` — design ledgers (motion · elevation · color · typography · spacing · radius · alpha · z-index) + gesture atlas + swap-width
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/sharing/` — clipboard, share cards, keepsake SVG/PNG
- `lib/engagement/` — loop-funnel, archetype-bucket
- `components/shared/` — shared primitives + fence walker kernel at `__tests__/_jsx-fence-walker.ts`
- `scripts/` — build-time codegen

## Core Feature
"The blog that reads you back." Same URL, different words per archetype. Thermal system warms the site as engagement deepens. Golden Thread (left edge) makes warmth visible.

## Design Rules
- **Action Receipt:** discrete events end with settled-state acknowledgement. `ActionPressable`. Fence: `action-receipt-fence.test.ts`.
- **Gesture Atlas:** 13 verbs, 0 grandfathered. `lib/design/gestures.ts`. Fence: forbid-only.
- **Alpha call-site:** `alphaClassOf()` — quoted literals only, no variables.
- **Label-swap width:** `swapWidthClassOf(1|2|3)` on `<ActionPressable>` hosts. Fence: `label-swap-width-fence.test.ts`.
- **Universal Exit:** overlay close → `<DismissButton.Inline />` / `<DismissButton.Absolute />`. Fence: `dismiss-verb-fence.test.ts`.
- **Overlay nameplate:** every overlay opens with `<OverlayHeader title blurb onClose />` — `items-center`, no `className`. Fence: `overlay-header-fence.test.ts`.
- **Section divider:** `<Divider.Static />` / `<Divider.Reveal />` / `<Divider.Centered />` — gold/10, `max-w-divider`, `rounded-full`, no `className`/`style`. Fence: `divider-fence.test.ts`.

## WIP
(none)

## Deployment
Docker on port 7200. Volumes: `persona-blog-db`, `persona-blog-logs`.
