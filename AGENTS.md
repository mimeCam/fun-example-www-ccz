# Persona Blog

## Tech Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · Zod · Fuse.js

## Key Paths
- `lib/design/` — design ledgers (motion · elevation · color · typography · spacing · radius · alpha · z-index) + gesture atlas + swap-width
- `lib/thermal/` — score engine, tokens, ceremony
- `lib/detection/` — first-paint archetype heuristic (provisional tone)
- `lib/mirror/` — Mirror snapshot store, layered archetype read, `__rt=1` returner sentinel
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
- **Navigation paint:** `gemPaint` / `gemShadow` / `navBarChassis` / `navItemPaint` / `navItemActivePaint` — Voice-Ledger surfaces `gem` / `nav` / `navPulseDot`. No raw `text-{mist|gold|rose|fog}/<N>` literals in `GemHome.tsx` or `AmbientNav.tsx`; no raw `bg-void/<N>` or `border-fog/<N>` literals in `AmbientNav.tsx`. The chassis is a duet — hairline routes through `alphaClassOf('fog','muted','border')`; the `bg-void/80` scrim is a structural-carrier honest exempt (`// alpha-ledger:exempt — structural scrim` token at the resolver). Fence: `nav-voice-adoption.test.ts`.
- **Resonance pair-rule:** `ResonanceEntry.tsx` graduates off the alpha grandfather list. The `alive ↔ dimmed` pair sits exactly one ledger step apart — alive at `alphaClassOf('surface','recede','bg')` (= `bg-surface/50`, the body in repose), dimmed at `alphaClassOf('surface','muted','bg')` (= `bg-surface/30`, ambient chrome). The chassis tokens (`ALIVE_CHASSIS` / `DIMMED_CHASSIS` / `VITALITY_TRACK` / `GEM_*` / `*_TEXT`) all live at module scope and surface via `__testing__` for the per-file SSR pin. Both raw dividers retire to `<Divider.Static spacing="sys-4" />`. Fence: `app/resonances/__tests__/ResonanceEntry.alpha.test.ts` — four sections (handles · SSR paint · drift sweep · pair-rule).

## WIP
(none)

## Deployment
Docker on port 7200. Volumes: `persona-blog-db`, `persona-blog-logs`.
