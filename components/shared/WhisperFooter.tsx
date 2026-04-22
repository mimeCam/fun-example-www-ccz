/**
 * WhisperFooter — consistent site-wide footer.
 *
 * Two links, every page, no exceptions:
 * Mirror · Articles
 * Plus the tagline "No algorithms. No feeds."
 *
 * Links speak through `<TextLink variant="quiet">` — the attribution
 * register. The middle-dot separator floors at mist/35 so the comma
 * stays legible even when the room is warm (Tanya §6.3).
 */

import { TextLink } from '@/components/shared/TextLink';

const FOOTER_LINKS = [
  { href: '/mirror', label: 'Mirror' },
  { href: '/articles', label: 'Articles' },
] as const;

export default function WhisperFooter() {
  return (
    <footer className="text-center py-sys-10 pb-sys-12 space-y-sys-2 thermal-drift">
      <p className="text-mist/60 text-sys-caption">No algorithms. No feeds.</p>
      <nav className="flex justify-center items-center gap-sys-5 text-sys-micro"
           aria-label="Footer navigation">
        {FOOTER_LINKS.map((link, i) => (
          <FooterLink key={link.href} link={link} showDot={i > 0} />
        ))}
      </nav>
    </footer>
  );
}

/** Middle-dot floors at mist/35 — visible even when the room warms. */
function FooterDot() {
  return (
    <span
      aria-hidden="true"
      style={{ color: 'color-mix(in srgb, var(--mist) 35%, transparent)' }}
    >
      &middot;
    </span>
  );
}

function FooterLink({ link, showDot }: {
  link: typeof FOOTER_LINKS[number];
  showDot: boolean;
}) {
  return (
    <>
      {showDot && <FooterDot />}
      <TextLink variant="quiet" href={link.href}>
        {link.label}
      </TextLink>
    </>
  );
}
