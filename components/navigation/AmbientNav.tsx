/**
 * AmbientNav — bottom navigation bar with thermal-aware active state.
 *
 * Four links: Threshold, Articles, Mirror, Book.
 * No thermal-drift — navigation must be spatially stable.
 * Active state: thermal accent color + NavPulseDot.
 * Inactive: mist/50, hover per-item accent.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NavPulseDot } from './NavPulseDot';

const NAV_ITEMS = [
  { href: '/', label: 'Threshold', accent: 'hover:text-gold' },
  { href: '/articles', label: 'Articles', accent: 'hover:text-mist' },
  { href: '/mirror', label: 'Mirror', accent: 'hover:text-gold' },
  { href: '/resonances', label: 'Book', accent: 'hover:text-rose' },
] as const;

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
      className="fixed bottom-0 inset-x-0 z-20 bg-void/80 backdrop-blur-sm border-t border-fog/20 animate-fade-in"
    >
      <div className="flex items-center justify-center gap-8 h-12">
        {NAV_ITEMS.map(({ href, label, accent }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`text-xs tracking-wide transition-colors duration-[1500ms] ease-out ${
                active
                  ? 'nav-active-link'
                  : `text-mist/50 ${accent}`
              }`}
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
