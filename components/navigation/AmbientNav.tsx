/**
 * AmbientNav — bottom navigation bar with thermal-aware active state.
 *
 * Four links: Threshold, Articles, Mirror, Book.
 * No thermal-drift — navigation must be spatially stable.
 * Active state: thermal accent color (`.nav-active-link` → `--token-accent`)
 *   plus `<NavPulseDot />` (CSS-driven three-layer halo).
 * Inactive: `mist/recede` (text-mist/50), per-route hover voice.
 *
 * Paint dialect graduated to the Voice Ledger via `lib/design/nav-paint.ts`:
 *   • per-item literals (inactive baseline + four hover voices) — Mike #90.
 *   • bottom-bar chassis (geometry + frosted scrim + hairline) — Mike #110 +
 *     Tanya UIX #43. The chassis is a duet: the hairline is on-ledger
 *     (fog at the `muted` rung); the scrim is structurally exempt (the
 *     frosted-glass carrier does layout work, not voice — see the inline
 *     exempt token at the resolver's call site in `navBarChassis()`).
 *
 * Visibility (Tanya UIX #46 §2.D2 — the chrome-rhythm sprint, observed
 * defect #2):
 *   The bar is reader-invariant chrome; it is **always mounted** and gates
 *   visibility via `opacity-{0,100}`, not `if (!visible) return null`. On
 *   `/` and `/article/*` the scroll listener flips `visible` past 20% of the
 *   viewport; on every other route the bar is visible from mount. Either
 *   way the cross-fade rides the `crossfade-inline` verb (120 ms, ease-out)
 *   — graceful arrival AND graceful departure (the prior `null`-render
 *   path made the bar vanish mid-glance when a reader scrolled back up
 *   past the threshold; Tanya UIX #46 §2.D2). `pointer-events-none` and
 *   `aria-hidden` keep the hidden-state lattice unfocusable for keyboard
 *   and screen-reader users.
 *
 * 320 px gap downshift (Tanya UIX #46 §2.D1):
 *   At `< sm` the four labels (Threshold · Articles · Mirror · Book) sum
 *   to ≈ 320 px with the prior `gap-sys-8` (32 px × 3 = 96 px gutter). Drop
 *   the gutter to `gap-sys-6` (20 px × 3 = 60 px) — total recovers to
 *   ≈ 276–285 px (saves 36 px), well under the 320 px budget. At `sm:` and
 *   up the room re-opens to `gap-sys-8`. Tracking stays on the on-ledger
 *   `tracking-sys-caption` (the typography-adoption fence forbids preset
 *   `tracking-tight` outside the ledger); the gap downshift alone clears
 *   the budget per Tanya's measurements. Reuse-only — no new tokens, no
 *   new component.
 *
 * This component stays focused on routing, visibility, and ARIA semantics.
 * No `bg-void` or `border-fog` Tailwind literals live here; both are
 * pinned by `nav-voice-adoption.test.ts` §1.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CROSSFADE_INLINE } from '@/lib/design/gestures';
import {
  navBarChassis,
  navItemPaint,
  navItemActivePaint,
} from '@/lib/design/nav-paint';
import {
  presenceClassOf,
  presenceAriaHidden,
} from '@/lib/design/presence';
import { NavPulseDot } from './NavPulseDot';

const NAV_ITEMS = [
  { href: '/',            label: 'Threshold' },
  { href: '/articles',    label: 'Articles'  },
  { href: '/mirror',      label: 'Mirror'    },
  { href: '/resonances',  label: 'Book'      },
] as const;

/* ─── Gesture-Atlas handle (verb-routed transition class) ──────────────────
   `crossfade-inline` verb (Tanya UX #78 §2.3): "One label replacing another
   — instant enough that I don't see the seam." duration-crossfade (120ms),
   ease-out. Imported from the verb-named home in `lib/design/gestures.ts`
   (Mike napkin #22, Krystle rule-of-three lift) so the four consumers
   share one source of truth. Used twice in this file: once on the chassis
   presence cross-fade (chrome-rhythm D2), once on the hover color swap of
   every link. Same verb, two registers — both are *one thing replacing
   another, instant enough not to see the seam*. */

const HIDDEN_ROUTES = ['/', '/article'];

/* ─── Visibility — routed through the presence helper ──────────────────────
   The chrome-rhythm sprint (Tanya UIX #46 §2.D2) replaced the prior
   `if (!visible) return null` unmount with an opacity-gated cross-fade.
   The motion fade endpoint pair and the ARIA-hidden carrier now live in
   `lib/design/presence.ts` — `presenceClassOf` / `presenceAriaHidden`,
   three-member helper, one home for the chrome-rhythm continuity
   contract. The path is licensed under `ALPHA_MOTION_ENDPOINT_PATHS`, so
   this file no longer carries inline `// alpha-ledger:exempt` tokens for
   the motion fade endpoints (Mike napkin #18 §2.2). `aria-hidden` keeps
   the invisible bar unfocusable for keyboard and screen-reader users. */

export function AmbientNav() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const shouldHide = HIDDEN_ROUTES.some(
    r => pathname === r || (r === '/article' && pathname.startsWith('/article/'))
  );

  useEffect(() => {
    if (shouldHide) return wireScrollVisibility(setVisible);
    setVisible(true);
  }, [shouldHide]);

  // Always mount; gate via the presence helper. The chassis fade rides
  // `crossfade-inline` — the same verb the per-link hover swap rides.
  const presence = visible ? 'attentive' : 'gone';
  return (
    <nav
      className={`${navBarChassis()} transition-opacity ${CROSSFADE_INLINE} ${presenceClassOf(presence)}`}
      aria-label="Site navigation"
      aria-hidden={presenceAriaHidden(presence)}
    >
      <div className="flex items-center justify-center gap-sys-6 sm:gap-sys-8 h-14">
        {NAV_ITEMS.map(({ href, label }) => (
          <NavItem key={href} href={href} label={label} active={pathname === href} />
        ))}
      </div>
    </nav>
  );
}

/** One nav link — paint, gesture, and the active dot. ≤ 10 LOC. */
function NavItem({
  href, label, active,
}: { href: string; label: string; active: boolean }): JSX.Element {
  // `rounded-sys-soft` pairs with the global :focus-visible ring (6px curve
  // — honoring-ring, Tanya UX #93 §4). Tracking stays on-ledger at
  // `tracking-sys-caption` (+0.08em); the gap downshift on the parent
  // (`gap-sys-6 sm:gap-sys-8`) recovers the 320px budget per Tanya UIX
  // #46 §2.D1.
  const paint = active ? navItemActivePaint() : navItemPaint(href);
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`rounded-sys-soft px-sys-1 py-sys-1 text-sys-caption tracking-sys-caption transition-colors ${CROSSFADE_INLINE} ${paint}`}
    >
      {active && <NavPulseDot />}
      {label}
    </Link>
  );
}

/**
 * Wire a scroll listener that flips `visible` once the reader passes 20%
 * of the viewport. Returns the cleanup. ≤ 10 LOC. The initial probe runs
 * once after attach so a returner who lands deep into a page (back/forward
 * cache) sees the bar without an extra scroll event.
 */
function wireScrollVisibility(set: (v: boolean) => void): () => void {
  const onScroll = (): void =>
    set(window.scrollY > window.innerHeight * 0.2);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  return () => window.removeEventListener('scroll', onScroll);
}
