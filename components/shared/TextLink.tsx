/**
 * TextLink — the fourth primitive, the carrier.
 *
 * One link voice for the site. Three variants — `inline` (body prose),
 * `passage` (meaningful cross-room reference), `quiet` (footnote /
 * attribution). The `passage` variant crossfades to the destination
 * room's accent on hover so the reader feels the next room *before*
 * the click — the site's single "foreshadow" gesture.
 *
 * Internal href → `next/link` (prefetch as-is). External href → native
 * `<a target="_blank" rel="noopener noreferrer">` + tiny off-site glyph.
 * External-link hygiene is free money (Mike §6.5, Elon §3c).
 *
 * Scope knife:
 *   • No `asChild` slot — links are always `<a>`.
 *   • No press-scale transform — links do not animate like buttons.
 *   • No tooltip/popover on hover — color IS the message (Tanya §9).
 *   • No frontmatter tax — destination accent from pathname (Elon §4.4).
 *
 * Credits: Mike K. (napkin §3, primitive shape + external hygiene),
 * Tanya D. (variant spec §2, color palette §3, motion contract §5,
 * external glyph §3.4), Paul K. (P0/P1 ranking, non-negotiable contrast
 * gate), Elon M. (no frontmatter, no popover, no manifesto), Krystle C.
 * (primitive scaffolding pattern), Jason F. ("every primitive carries
 * thermal context; a link that doesn't is an inconsistency bug").
 */

'use client';

import {
  forwardRef,
  type AnchorHTMLAttributes, type CSSProperties, type ReactNode,
} from 'react';
import NextLink from 'next/link';
import {
  type LinkVariant,
  composeLinkClass, resolveLinkStyle,
  resolveDestinationAccent, isExternalHref,
} from '@/lib/utils/link-phase';
import { useLinkPhase } from '@/lib/hooks/useLinkPhase';
import { EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE } from '@/lib/design/typography';

// ─── Public API ────────────────────────────────────────────────────────────

export type { LinkVariant };

type NativeAnchorProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'className' | 'style' | 'children' | 'href' | 'target' | 'rel'
>;

export interface TextLinkProps extends NativeAnchorProps {
  /** Destination URL. Internal = `next/link`; external = plain `<a>`. */
  href: string;
  /** Visual register. Default `inline`. */
  variant?: LinkVariant;
  /** Extra className appended after the base recipe. */
  className?: string;
  /** Inline styles merged after the phase-machine paint. */
  style?: CSSProperties;
  children: ReactNode;
}

// ─── The component ────────────────────────────────────────────────────────

export const TextLink = forwardRef<HTMLAnchorElement, TextLinkProps>(
  function TextLink(props, ref) {
    const { href, variant = 'inline' } = props;
    const external = isExternalHref(href);
    const { phase, reduced, handlers } = useLinkPhase();
    const destAccent = resolveDestinationAccent(href);
    const style = mergeStyle(resolveLinkStyle(phase, variant, reduced, destAccent), props.style);
    const className = composeLinkClass({ variant, isExternal: external, extra: props.className });
    const wiring = { ref, handlers, className, style, external };
    return external ? renderExternal(props, wiring) : renderInternal(props, wiring);
  },
);

// ─── Render split — keeps each leg trivially short ────────────────────────

interface Wiring {
  ref: React.ForwardedRef<HTMLAnchorElement>;
  handlers: ReturnType<typeof useLinkPhase>['handlers'];
  className: string;
  style: CSSProperties;
  external: boolean;
}

function renderInternal(props: TextLinkProps, w: Wiring): JSX.Element {
  const { children } = props;
  const rest = stripManaged(props);
  return (
    <NextLink
      {...rest}
      href={props.href}
      ref={w.ref}
      className={w.className}
      style={w.style}
      {...w.handlers}
    >
      {children}
    </NextLink>
  );
}

function renderExternal(props: TextLinkProps, w: Wiring): JSX.Element {
  const { children } = props;
  const rest = stripManaged(props);
  return (
    <a
      {...rest}
      href={props.href}
      ref={w.ref}
      target="_blank"
      rel="noopener noreferrer"
      className={w.className}
      style={w.style}
      {...w.handlers}
    >
      {children}
      <ExternalGlyph />
    </a>
  );
}

/** Drop managed props so they don't clobber the merged output. */
function stripManaged(props: TextLinkProps): NativeAnchorProps {
  const {
    href: _h, variant: _v, className: _c, style: _s, children: _ch,
    ...rest
  } = props;
  return rest;
}

function mergeStyle(a: CSSProperties, b?: CSSProperties): CSSProperties {
  if (!b) return a;
  return { ...a, ...b };
}

// ─── External-link glyph (inline SVG, 10×10) ──────────────────────────────

/**
 * Tiny off-site indicator — color-independent affordance so colourblind
 * readers have a second signal (§3.4). Positioned via inline SVG so it
 * lives in the same currentColor cascade as the underline.
 */
function ExternalGlyph(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 10 10"
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="inline-block align-baseline ml-[0.2em] opacity-quiet"
      style={EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE}
    >
      <path d="M3.5 6.5 L7 3 M4.25 3 H7 V5.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
