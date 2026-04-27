/**
 * AmbientNav — bottom navigation bar with thermal-aware active state.
 *
 * Four links: Threshold, Articles, Mirror, Book.
 * No thermal-drift — navigation must be spatially stable.
 * Active state: thermal accent color (`.nav-active-link` → `--token-accent`)
 *   plus `<NavPulseDot />` (CSS-driven three-layer halo).
 * Inactive: `mist/recede` (text-mist/50), per-route hover voice.
 *
 * Paint dialect graduated to the Voice Ledger via `lib/design/nav-paint.ts`
 * (Mike napkin #90). The per-item literals (inactive baseline + four
 * hover voices) live in one file now; this component stays focused on
 * routing, visibility, and ARIA semantics.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { gestureClassesOf } from '@/lib/design/gestures';
import {
  navItemPaint,
  navItemActivePaint,
} from '@/lib/design/nav-paint';
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
   ease-out. Module-scope binding so the call is greppable at the source
   level (the `gesture-call-site-fence` reads it through the kernel walker,
   which blanks template-literal bodies). */
const NAV_HOVER_GESTURE = gestureClassesOf('crossfade-inline');

const HIDDEN_ROUTES = ['/', '/article'];

export function AmbientNav() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const shouldHide = HIDDEN_ROUTES.some(
    r => pathname === r || (r === '/article' && pathname.startsWith('/article/'))
  );

  useEffect(() => {
    if (shouldHide) {
      const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.2);
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }
    setVisible(true);
  }, [shouldHide]);

  if (!visible) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-sys-nav bg-void/80 backdrop-blur-sm border-t border-fog/20 animate-fade-in"
      aria-label="Site navigation"
    >
      <div className="flex items-center justify-center gap-sys-8 h-14">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname === href;
          // `rounded-sys-soft` pairs with the global :focus-visible ring —
          // the ring inherits the 6px curve (honoring-ring, Tanya #93 §4).
          // `crossfade-inline` verb (Gesture Atlas / Tanya UX #78 §2.3):
          // "One label replacing another — instant enough that I don't see
          // the seam." 120ms color swap, ease-out.
          const paint = active ? navItemActivePaint() : navItemPaint(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`rounded-sys-soft px-sys-1 py-sys-1 text-sys-caption tracking-sys-caption transition-colors ${NAV_HOVER_GESTURE} ${paint}`}
            >
              {active && <NavPulseDot />}
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
