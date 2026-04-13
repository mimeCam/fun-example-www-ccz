/**
 * WhisperFooter — consistent site-wide footer.
 *
 * Two links, every page, no exceptions:
 * Mirror · Articles
 * Plus the tagline "No algorithms. No feeds."
 */

import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/mirror', label: 'Mirror', cls: 'text-gold/50 hover:text-gold' },
  { href: '/articles', label: 'Articles', cls: 'text-mist/50 hover:text-mist' },
] as const;

export default function WhisperFooter() {
  return (
    <footer className="text-center py-sys-10 pb-sys-12 space-y-sys-2 thermal-drift">
      <p className="text-mist/40 text-sys-caption">No algorithms. No feeds.</p>
      <nav className="flex justify-center items-center gap-sys-5 text-sys-micro"
           aria-label="Footer navigation">
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
