/**
 * WhisperFooter — consistent site-wide footer.
 *
 * Three links, every page, no exceptions:
 * Mirror · Articles · Resonances
 * Plus the tagline "No algorithms. No feeds."
 */

import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/mirror', label: 'Mirror', cls: 'text-gold/50 hover:text-gold' },
  { href: '/articles', label: 'Articles', cls: 'text-mist/50 hover:text-mist' },
  { href: '/resonances', label: 'Resonances', cls: 'text-rose/50 hover:text-rose' },
] as const;

export default function WhisperFooter() {
  return (
    <footer className="text-center py-12 space-y-2">
      <p className="text-mist/40 text-sm">No algorithms. No feeds.</p>
      <nav className="flex justify-center items-center gap-4 text-xs">
        {FOOTER_LINKS.map((link, i) => (
          <FooterLink key={link.href} link={link} showDot={i > 0} />
        ))}
      </nav>
    </footer>
  );
}

function FooterLink({ link, showDot }: {
  link: typeof FOOTER_LINKS[number];
  showDot: boolean;
}) {
  return (
    <>
      {showDot && <span className="text-mist/20">&middot;</span>}
      <Link href={link.href}
        className={`${link.cls} transition-colors`}>
        {link.label}
      </Link>
    </>
  );
}
