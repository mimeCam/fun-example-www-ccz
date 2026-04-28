/**
 * WhisperFooter — consistent site-wide footer.
 *
 * Three links, every page, no exceptions:
 * Mirror · Articles · Trust
 * Plus the tagline "No algorithms. No feeds."
 *
 * Links speak through `<TextLink variant="quiet">` — the attribution
 * register. The middle-dot separator floors at the muted rung (mist/30)
 * via `alphaClassOf` — ambient chrome, one full rung below the labels it
 * separates (Tanya §6.3, UX spec #88 §2).
 *
 * The third link (`Trust` → `/trust`) is the ONLY sitewide entry to the
 * reader-invariant `/trust` room. No homepage banner, no modal, no tooltip,
 * no "new" badge. Readers who ask the question find the answer in under
 * three seconds (footer scroll → click). Readers who don't ask, don't find
 * — intentional (Tanya #76 §3). Still a single centered line at mobile
 * width (`text-sys-micro`, 11px); the dot floors at the muted rung (mist/30)
 * — balanced for three labels by construction (Tanya #76 §8.1, #88 §2).
 *
 * Tagline routes through the alpha-ledger `quiet` rung (mist/70) so the
 * "No algorithms. No feeds." line speaks at the same register as the
 * footer's `<TextLink variant="quiet">` siblings — one voice, no mumble
 * under thermal warming (Tanya UX #47 §3.4, Mike napkin #19 §4.1).
 */

import { TextLink } from '@/components/shared/TextLink';
import { alphaClassOf } from '@/lib/design/alpha';
import { CHASSIS_SEAM_TOP_CLASS } from '@/lib/design/spacing';

/** Tagline rung — quiet (0.70). Pinned via alphaClassOf for grep-honesty. */
const TAGLINE_TEXT_CLASS = alphaClassOf('mist', 'quiet', 'text');

/** Dot rung — muted (0.30). One full rung below the labels (quiet=0.70). */
const DOT_TEXT_CLASS = alphaClassOf('mist', 'muted', 'text');

const FOOTER_LINKS = [
  { href: '/mirror', label: 'Mirror' },
  { href: '/articles', label: 'Articles' },
  { href: '/trust', label: 'Trust' },
] as const;

export default function WhisperFooter() {
  // T3 chassis seam — Mike #4 napkin §3 (universal). The footer's top
  // edge is the content→chrome seam for every reader-facing route (one
  // edit pins the bottom seam of `/`, `/articles`, `/article/[id]`).
  // The handle is `CHASSIS_SEAM_TOP_CLASS` because the seam SITS AT THE
  // TOP of the footer element — same rung as T1 (route-body top), one
  // symbol, one rung, mirror-equal. `pb-sys-12` stays as the page-end
  // monumental beat — viewport-edge breathing, not the T3 seam (different
  // surface, one symbol per site).
  return (
    <footer className={`text-center ${CHASSIS_SEAM_TOP_CLASS} pb-sys-12 space-y-sys-2 thermal-drift`}>
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

/** Middle-dot floors at the muted rung (mist/30) — ambient chrome between labels. */
function FooterDot() {
  return (
    <span aria-hidden="true" className={DOT_TEXT_CLASS}>
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
