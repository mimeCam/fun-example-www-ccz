/**
 * WhisperFooter — consistent site-wide footer.
 *
 * Three links, every page, no exceptions:
 * Mirror · Articles · Trust
 * Plus the tagline "No algorithms. No feeds."
 *
 * Links speak through `<TextLink variant="quiet">` — the attribution
 * register. The middle-dot separator floors at mist/35 so the comma
 * stays legible even when the room is warm (Tanya §6.3).
 *
 * The third link (`Trust` → `/trust`) is the ONLY sitewide entry to the
 * reader-invariant `/trust` room. No homepage banner, no modal, no tooltip,
 * no "new" badge. Readers who ask the question find the answer in under
 * three seconds (footer scroll → click). Readers who don't ask, don't find
 * — intentional (Tanya #76 §3). Still a single centered line at mobile
 * width (`text-sys-micro`, 11px); the dot floors at mist/35 — balanced for
 * three labels by construction (Tanya #76 §8.1).
 *
 * Tagline routes through the alpha-ledger `quiet` rung (mist/70) so the
 * "No algorithms. No feeds." line speaks at the same register as the
 * footer's `<TextLink variant="quiet">` siblings — one voice, no mumble
 * under thermal warming (Tanya UX #47 §3.4, Mike napkin #19 §4.1).
 */

import { TextLink } from '@/components/shared/TextLink';
import { alphaClassOf } from '@/lib/design/alpha';

/** Tagline rung — quiet (0.70). Pinned via alphaClassOf for grep-honesty. */
const TAGLINE_TEXT_CLASS = alphaClassOf('mist', 'quiet', 'text');

const FOOTER_LINKS = [
  { href: '/mirror', label: 'Mirror' },
  { href: '/articles', label: 'Articles' },
  { href: '/trust', label: 'Trust' },
] as const;

export default function WhisperFooter() {
  return (
    <footer className="text-center py-sys-10 pb-sys-12 space-y-sys-2 thermal-drift">
      <p className={`${TAGLINE_TEXT_CLASS} text-sys-caption`}>No algorithms. No feeds.</p>
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
