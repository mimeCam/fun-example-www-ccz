/**
 * ResonanceDrawer.alpha — per-file SSR pin for the Echo Frame snap.
 *
 * Mirror of `app/resonances/__tests__/ResonanceEntry.alpha.test.ts`
 * (Mike napkin #30 / #111 shape — SSR via `react-dom/server`,
 * `React.createElement`, `testEnvironment: 'node'`, no jsdom). The
 * duplicated quoted-line frame in `ResonanceDrawer.tsx` ("the Echo
 * Frame" — the single surface where "the blog reads you back" becomes
 * literal pixels, Tanya UIX #12 §1) graduates off the alpha grandfather
 * list. Both paint sites — `<QuotePreview>` (form) and the inner frame
 * inside `<CeremonyContent>` (settled) — now share one module-scope
 * `QUOTE_FRAME_CLASS` const, with alpha bits routing through
 * `alphaClassOf()` so the JIT-safe table is the source of truth.
 *
 * What this pin enforces (four sections, sibling of ResonanceEntry):
 *
 *   §1 · MODULE HANDLES POINT AT CANONICAL RUNGS — every `__testing__`
 *        handle resolves to the canonical `alphaClassOf(...)` literal AND
 *        to the expected wire string (e.g. `'bg-background/50'`). A
 *        future swap of the rung vocabulary cannot silently shift the
 *        register without flipping this test.
 *
 *   §2 · BOTH RENDER PATHS PAINT BYTE-IDENTICAL CHROME — render
 *        `<QuotePreview>` (form) and the ceremony's inner frame; assert
 *        each carries `QUOTE_FRAME_CLASS` verbatim and does NOT carry
 *        the pre-snap drift literals (`bg-background/60`, `border-rose/40`).
 *        The Form → Ceremony transition is a state change *on the same
 *        object* (Tanya UIX #12 §2.1).
 *
 *   §3 · DRIFT SWEEP — full SSR contains zero off-ledger
 *        `(bg|text|border|shadow)-<color>/N` outside `{10,30,50,70,100}`.
 *        Drift absence is positive evidence the file no longer needs a
 *        grandfather entry on `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`.
 *        The list shrinks because of this receipt.
 *
 *   §4 · PAIR-SNAP RECEIPT (Mike #30 §"Path A") — assert the surface
 *        sits at `recede` (`bg-background/50`) and the ribbon at
 *        `muted` (`border-rose/30`); the ribbon rung matches the
 *        `ResonanceEntry` dimmed ribbon (sister surfaces, one register).
 *
 * Per-file pin only — NO `BreathPair` typed shape, NO new `echo` voice,
 * NO kernel-lift to `lib/design/` (Mike #30 §6 — two callers in one
 * file is a const, not a kernel; rule of three not yet met).
 *
 * Credits: Mike K. (architect napkin #30 — Quote-Frame Const, Grandfather
 * Shrink — the kernel this test pins; Path A snap doctrine; per-file SSR
 * pin shape lifted from #92 / #111), Tanya D. (UIX #12 §1 — the Echo
 * Frame visual anatomy that anchors the rung calls; §2.1 byte-identity
 * contract between form + ceremony; §1.2 settled-state ribbon-warm),
 * Elon M. (first-principles teardown #71 / #48 that rejected the `echo`
 * voice and `BreathPair` overreach so this kernel stays a kernel),
 * Sid (this lift — same shape as the Resonance/Thread/Quote siblings,
 * no new primitive; ~75 LOC of production code).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { alphaClassOf } from '@/lib/design/alpha';
import { __testing__ } from '../ResonanceDrawer';

const {
  QUOTE_FRAME_CLASS,
  QUOTE_BODY_CLASS,
  QUOTE_FRAME_SURFACE,
  QUOTE_FRAME_RIBBON,
  QUOTE_FRAME_BODY,
  CeremonyContent,
  QuotePreview,
} = __testing__;

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** Render the form-side preview frame (the line waiting to be saved). */
function renderForm(): string {
  return renderToStaticMarkup(
    createElement(QuotePreview, { quote: 'a line the reader picked' }),
  );
}

/** Render the ceremony-side frame at the `settled` shimmer phase. */
function renderCeremony(): string {
  return renderToStaticMarkup(
    createElement(CeremonyContent, {
      quote: 'a line the reader picked',
      shimmerIntensity: 'warm',
      showShimmer: true,
      shimmerSettled: true,
    }),
  );
}

// ─── §1 · Module-level handles point at the canonical rungs ──────────────

describe('ResonanceDrawer · §1 module handles point at the canonical rungs', () => {
  it('QUOTE_FRAME_SURFACE is bg-background/50 (= `recede` rung wire format)', () => {
    expect(QUOTE_FRAME_SURFACE).toBe(alphaClassOf('background', 'recede', 'bg'));
    expect(QUOTE_FRAME_SURFACE).toBe('bg-background/50');
  });

  it('QUOTE_FRAME_RIBBON is border-rose/30 (= `muted` rung wire format)', () => {
    expect(QUOTE_FRAME_RIBBON).toBe(alphaClassOf('rose', 'muted', 'border'));
    expect(QUOTE_FRAME_RIBBON).toBe('border-rose/30');
  });

  it('QUOTE_FRAME_BODY is text-foreground/70 (= `quiet` — content, not THE content)', () => {
    expect(QUOTE_FRAME_BODY).toBe(alphaClassOf('foreground', 'quiet', 'text'));
    expect(QUOTE_FRAME_BODY).toBe('text-foreground/70');
  });

  it('QUOTE_FRAME_CLASS composes the ledger pieces + structural classes', () => {
    expect(QUOTE_FRAME_CLASS).toContain(QUOTE_FRAME_SURFACE);
    expect(QUOTE_FRAME_CLASS).toContain(QUOTE_FRAME_RIBBON);
    expect(QUOTE_FRAME_CLASS).toContain('border-l-2');
    expect(QUOTE_FRAME_CLASS).toContain('rounded-sys-medium');
    expect(QUOTE_FRAME_CLASS).toContain('p-sys-4');
    expect(QUOTE_FRAME_CLASS).toContain('mb-sys-5');
  });

  it('QUOTE_BODY_CLASS carries the foreground/quiet text + italic + caption register', () => {
    expect(QUOTE_BODY_CLASS).toContain(QUOTE_FRAME_BODY);
    expect(QUOTE_BODY_CLASS).toContain('italic');
    expect(QUOTE_BODY_CLASS).toContain('text-sys-caption');
    expect(QUOTE_BODY_CLASS).toContain('typo-caption');
  });

  it('handles are NOT the pre-snap drift values', () => {
    expect(QUOTE_FRAME_SURFACE).not.toBe('bg-background/60');
    expect(QUOTE_FRAME_RIBBON).not.toBe('border-rose/40');
    expect(QUOTE_FRAME_CLASS).not.toContain('bg-background/60');
    expect(QUOTE_FRAME_CLASS).not.toContain('border-rose/40');
  });
});

// ─── §2 · Both render paths paint byte-identical chrome ──────────────────

describe('ResonanceDrawer · §2 form + ceremony share QUOTE_FRAME_CLASS verbatim', () => {
  it('the form-side QuotePreview renders QUOTE_FRAME_CLASS verbatim', () => {
    const html = renderForm();
    expect(html).toContain(QUOTE_FRAME_CLASS);
    expect(html).toContain(QUOTE_BODY_CLASS);
  });

  it('the ceremony-side CeremonyContent renders QUOTE_FRAME_CLASS verbatim', () => {
    const html = renderCeremony();
    expect(html).toContain(QUOTE_FRAME_CLASS);
    expect(html).toContain(QUOTE_BODY_CLASS);
  });

  it('neither render path carries the pre-snap drift literals', () => {
    const html = renderForm() + renderCeremony();
    expect(html).not.toContain('bg-background/60');
    expect(html).not.toContain('border-rose/40');
  });

  it('the ceremony branch composes the settled-shimmer class adjacent to the frame', () => {
    // Felt-side polish (Tanya UIX #12 §1.2): the `--settled` modifier
    // warms the rose ribbon one rung over MOTION.linger. The class lands
    // on the SAME element as `QUOTE_FRAME_CLASS` so the warm transition
    // is on the marker, not a sibling.
    expect(renderCeremony()).toContain('resonance-shimmer--settled');
  });
});

// ─── §3 · Drift sweep — zero off-ledger color-alpha shorthand ────────────

describe('ResonanceDrawer · §3 drift sweep · full SSR shows zero off-ledger color-alpha', () => {
  it('no /N outside {10,30,50,70,100} in any (bg|text|border|shadow) shorthand', () => {
    const html = renderForm() + renderCeremony();
    const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
    const offLedger: string[] = [];
    for (const m of html.matchAll(RX)) {
      if (![10, 30, 50, 70, 100].includes(Number(m[1]))) offLedger.push(m[0]);
    }
    expect(offLedger).toEqual([]);
  });
});

// ─── §4 · Pair-snap receipt — surface @ recede, ribbon @ muted ───────────

describe('ResonanceDrawer · §4 pair-snap receipt (Mike #30 §"Path A")', () => {
  it('surface sits at `recede`; ribbon sits at `muted`', () => {
    expect(QUOTE_FRAME_SURFACE).toBe(alphaClassOf('background', 'recede', 'bg'));
    expect(QUOTE_FRAME_RIBBON).toBe(alphaClassOf('rose', 'muted', 'border'));
  });

  it('ribbon shares the `muted` rung with ResonanceEntry dimmed (sister surfaces)', () => {
    // Mike #30 §"DoD" — the rose ribbon now speaks at one rung site-wide.
    // `ResonanceEntry.tsx` paints `border-rose/30` for the dimmed branch
    // (`alphaClassOf('rose','muted','border')`); the form + ceremony
    // frames here paint the same wire string. Three callers, one rung.
    expect(QUOTE_FRAME_RIBBON).toBe('border-rose/30');
  });

  it('frame does NOT carry default-presence (`bg-background` without /N)', () => {
    // Sanity: a future "harmonize the surface to default" PR fails here.
    expect(QUOTE_FRAME_CLASS).not.toMatch(/\bbg-background\b(?!\/)/);
    expect(QUOTE_FRAME_SURFACE).toMatch(/\/50$/);
  });
});
