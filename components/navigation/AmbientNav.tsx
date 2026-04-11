'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/mirror', label: 'Mirror', accent: 'hover:text-gold' },
  { href: '/articles', label: 'Articles', accent: 'hover:text-mist' },
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
      className="fixed bottom-0 inset-x-0 z-20 bg-void/80 backdrop-blur-sm border-t border-fog/20 animate-fade-in thermal-drift"
    >
      <div className="flex items-center justify-center gap-8 h-12">
        {NAV_ITEMS.map(({ href, label, accent }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`text-xs tracking-wide transition-colors ${
                active ? 'text-mist/80' : `text-mist/50 ${accent}`
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
