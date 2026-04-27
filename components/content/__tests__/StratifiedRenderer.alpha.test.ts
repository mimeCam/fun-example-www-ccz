/**
 * StratifiedRenderer.alpha — per-file SSR pin for the Stratified Room.
 *
 * Mirror of `app/resonances/__tests__/ResonanceEntry.alpha.test.ts`
 * (Mike napkin #117 / Tanya UIX "Stratified Room" — same shape, last
 * graduation). Every translucent surface this renderer paints is now
 * spoken in the role-based 4-rung vocabulary owned by `lib/design/alpha.ts`.
 * Each chassis literal routes through `alphaClassOf()` — the JIT-safe
 * literal-table factory — instead of the hand-typed `bg-surface/20`,
 * `bg-surface/60`, `border-l-cyan/40` dialects that shipped before.
 *
 * What this pin enforces (three sections — no §4 pair-rule, the room is
 * a non-pair shape; rule of three has not been earned):
 *
 *   §1 · MODULE HANDLES POINT AT CANONICAL RUNGS — every `__testing__`
 *        handle resolves to the canonical `alphaClassOf(...)` literal AND
 *        to the expected wire string. A future swap of the rung vocabulary
 *        cannot silently shift any register without flipping this test.
 *
 *   §2 · SSR PAINTS THE SNAPPED CHASSIS VERBATIM — render the three
 *        injected block types (Marginalia warm/cool, Extension, Resonance
 *        Marginalia) via `react-dom/server`; assert each carries the
 *        snapped literal AND does NOT carry the pre-snap drift values
 *        (`/20`, `/40`, `/60`).
 *
 *   §3 · DRIFT SWEEP — full SSR contains zero off-ledger
 *        `(bg|text|border|shadow)-<color>/N` outside `{10,30,50,70,100}`.
 *        Drift absence is positive evidence the file no longer needs a
 *        grandfather entry on `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`.
 *        After this PR the array is `[]` — the fence is structural.
 *
 * Per-file pin only — NO pair-invariant test asserting `Marginalia ≡
 * Extension` chassis tokens (Mike #117 §5.4 — rule of three; two cool
 * side-of-page chrome surfaces in one file is a const, not a kernel).
 * The grandfather-list emptying is the project-level receipt.
 *
 * Credits: Mike K. (architect napkin #117 — the structural-fence framing,
 * the per-file SSR pin shape, the rule-of-three discipline that keeps
 * `marginaliaSurface()` / `chromeWarmBorder()` kernel-lifts on the shelf
 * at N=2), Tanya D. (UIX "Stratified Room" — the three rung picks
 * (`muted` for cool chrome, `quiet` for the killer surface), the
 * shadow-stack hygiene call that retired the duplicate `shadow-rose-glow`,
 * the felt sentences logged as commit prose), Krystle C. (drift-density
 * ranking that placed `StratifiedRenderer.tsx` as the eleventh and final
 * graduation), Paul K. (the *"one coherent room"* outcome the §3 sweep
 * operationalises), Elon M. (caught the third drift site at line 74 that
 * earlier reports missed; insistence on measurable gates only — every
 * assertion here is a single string check, no metaphor), Sid (this lift;
 * same shape as the Resonance/Thread/Quote siblings, no new primitive).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS, alphaClassOf } from '@/lib/design/alpha';
import { __testing__ } from '../StratifiedRenderer';
import type { ContentBlock } from '@/lib/content/content-layers';

const {
  HAIRLINE_BORDER,
  MARG_BORDER_WARM,
  MARG_BORDER_COOL,
  MARG_SURFACE,
  EXT_SURFACE,
  RES_SURFACE,
  RES_LABEL_TEXT,
  RES_QUOTE_TEXT,
  RES_META_TEXT,
  MarginaliaBlock,
  ExtensionBlock,
  ResonanceMarginaliaBlock,
} = __testing__;

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** A minimal marginalia block — exercises the cool/warm border + surface paint. */
function marginaliaBlock(): ContentBlock {
  return {
    layer: 'marginalia',
    paragraphs: ['a side note from a previous visit'],
    isNew: false,
  };
}

/** A minimal extension block — exercises the archetype wrap surface. */
function extensionBlock(): ContentBlock {
  return {
    layer: 'deep-diver',
    paragraphs: ['the room opens a door for your kind of reader'],
    isNew: false,
  };
}

/** A minimal resonance-marginalia block — exercises the killer surface. */
function resonanceBlock(): ContentBlock {
  return {
    layer: 'resonance-marginalia',
    paragraphs: [],
    isNew: false,
    resonance: {
      id: 'r-test-1',
      quote: 'a line the article said that stayed with me',
      note: 'why this stayed with me',
      createdAt: '3 days ago',
    },
  };
}

/** Render a marginalia block at the rest (cool) state. */
function renderMarginaliaCool(): string {
  return renderToStaticMarkup(
    createElement(MarginaliaBlock, { block: marginaliaBlock(), warmer: false }),
  );
}

/** Render a marginalia block at the warm (returning-reader) state. */
function renderMarginaliaWarm(): string {
  return renderToStaticMarkup(
    createElement(MarginaliaBlock, { block: marginaliaBlock(), warmer: true }),
  );
}

/** Render an archetype-extension block. */
function renderExtension(): string {
  return renderToStaticMarkup(
    createElement(ExtensionBlock, { block: extensionBlock() }),
  );
}

/** Render the resonance-marginalia block — the killer surface. */
function renderResonance(): string {
  return renderToStaticMarkup(
    createElement(ResonanceMarginaliaBlock, { block: resonanceBlock() }),
  );
}

/** All four block paintings concatenated — the surface for the §3 sweep. */
function renderAll(): string {
  return (
    renderMarginaliaCool() +
    renderMarginaliaWarm() +
    renderExtension() +
    renderResonance()
  );
}

// ─── §1 · Module-level handles point at the canonical rungs ──────────────

describe('StratifiedRenderer · §1 module handles point at the canonical rungs', () => {
  it('HAIRLINE_BORDER is border-gold/10 (= `hairline` rung wire format)', () => {
    expect(HAIRLINE_BORDER).toBe(alphaClassOf('gold', 'hairline', 'border'));
    expect(HAIRLINE_BORDER).toBe('border-gold/10');
  });

  it('MARG_BORDER_COOL is border-cyan/30 (= `muted` rung — ambient chrome at rest)', () => {
    expect(MARG_BORDER_COOL).toBe(alphaClassOf('cyan', 'muted', 'border'));
    expect(MARG_BORDER_COOL).toBe('border-cyan/30');
  });

  it('MARG_BORDER_WARM is border-cyan/70 (= `quiet` rung — the room noticed you)', () => {
    expect(MARG_BORDER_WARM).toBe(alphaClassOf('cyan', 'quiet', 'border'));
    expect(MARG_BORDER_WARM).toBe('border-cyan/70');
  });

  it('MARG_SURFACE is bg-surface/30 (= `muted` rung — sibling to extension wrap)', () => {
    expect(MARG_SURFACE).toBe(alphaClassOf('surface', 'muted', 'bg'));
    expect(MARG_SURFACE).toBe('bg-surface/30');
  });

  it('EXT_SURFACE is bg-surface/30 (= `muted` rung — the cool side-of-page floor)', () => {
    expect(EXT_SURFACE).toBe(alphaClassOf('surface', 'muted', 'bg'));
    expect(EXT_SURFACE).toBe('bg-surface/30');
  });

  it('MARG_SURFACE and EXT_SURFACE share the cool side-of-page rung (Tanya §3.4)', () => {
    // Two callers on one rung is a const, not a kernel (Mike #117 §6 / rule
    // of three). The reader's eye learns one rule: cool side-of-page chrome
    // = `surface/30`. Predictability is the polish.
    expect(MARG_SURFACE).toBe(EXT_SURFACE);
  });

  it('RES_SURFACE is bg-surface/70 (= `quiet` rung — the killer surface holds)', () => {
    expect(RES_SURFACE).toBe(alphaClassOf('surface', 'quiet', 'bg'));
    expect(RES_SURFACE).toBe('bg-surface/70');
  });

  it('RES_LABEL_TEXT is text-rose/70 (= `quiet` — content-tier eyebrow)', () => {
    expect(RES_LABEL_TEXT).toBe(alphaClassOf('rose', 'quiet', 'text'));
    expect(RES_LABEL_TEXT).toBe('text-rose/70');
  });

  it('RES_QUOTE_TEXT is text-foreground/70 (= `quiet` — content, not THE content)', () => {
    expect(RES_QUOTE_TEXT).toBe(alphaClassOf('foreground', 'quiet', 'text'));
    expect(RES_QUOTE_TEXT).toBe('text-foreground/70');
  });

  it('RES_META_TEXT is text-mist/50 (= `recede` — the frame around the subject)', () => {
    expect(RES_META_TEXT).toBe(alphaClassOf('mist', 'recede', 'text'));
    expect(RES_META_TEXT).toBe('text-mist/50');
  });

  it('handles are NOT the pre-snap drift values', () => {
    // Three named drift literals retired by this PR — never paint them again.
    expect(MARG_BORDER_COOL).not.toBe('border-l-cyan/40');
    expect(MARG_BORDER_COOL).not.toBe('border-cyan/40');
    expect(EXT_SURFACE).not.toBe('bg-surface/20');
    expect(RES_SURFACE).not.toBe('bg-surface/60');
  });
});

// ─── §2 · SSR paints the snapped chassis verbatim ────────────────────────

describe('StratifiedRenderer · §2 SSR paints the snapped chassis verbatim', () => {
  it('marginalia rest carries border-cyan/30 + bg-surface/30 verbatim', () => {
    const html = renderMarginaliaCool();
    expect(html).toContain(MARG_BORDER_COOL);
    expect(html).toContain(MARG_SURFACE);
  });

  it('marginalia rest does NOT carry pre-snap /40 drift', () => {
    const html = renderMarginaliaCool();
    expect(html).not.toContain('border-l-cyan/40');
    expect(html).not.toContain('border-cyan/40');
  });

  it('marginalia warm carries border-cyan/70 verbatim (the room noticed you)', () => {
    const html = renderMarginaliaWarm();
    expect(html).toContain(MARG_BORDER_WARM);
    // `shadow-cyan-whisper` is a tinted accent (TINTED_ACCENTS, allow-listed
    // outside the alpha ledger); it appears only on the warmer branch.
    expect(html).toContain('shadow-cyan-whisper');
  });

  it('marginalia warm surface still paints at /30 (only the border arc moves)', () => {
    // Pair-rule sanity: the warmer branch escalates ONLY the border, not
    // the surface. Both branches sit on the same `muted` surface (Tanya §3.4).
    expect(renderMarginaliaWarm()).toContain(MARG_SURFACE);
  });

  it('extension wrap carries bg-surface/30 verbatim and NOT pre-snap /20 drift', () => {
    const html = renderExtension();
    expect(html).toContain(EXT_SURFACE);
    expect(html).not.toContain('bg-surface/20');
  });

  it('resonance card carries bg-surface/70 + base shadow-rose-glow verbatim', () => {
    const html = renderResonance();
    expect(html).toContain(RES_SURFACE);
    expect(html).toContain('border-rose');
    // Path A (Tanya UIX §4): the killer surface always carries one
    // `shadow-rose-glow`. Hygiene rule: never two in the same string.
    expect(html).toContain('shadow-rose-glow');
    const glowMatches = html.match(/shadow-rose-glow/g) ?? [];
    expect(glowMatches.length).toBe(1);
  });

  it('resonance card does NOT carry pre-snap /60 drift', () => {
    expect(renderResonance()).not.toContain('bg-surface/60');
  });

  it('resonance card paints label/quote/meta through the ledger', () => {
    const html = renderResonance();
    expect(html).toContain(RES_LABEL_TEXT);
    expect(html).toContain(RES_QUOTE_TEXT);
    expect(html).toContain(RES_META_TEXT);
  });

  it('resonance inner divider routes through Divider.Static kernel (role=separator)', () => {
    // <Divider.Static /> is the geometry-only kernel; it auto-resolves to
    // bg-gold/10 via alphaClassOf and renders role="separator" for ARIA.
    expect(renderResonance()).toContain('role="separator"');
  });
});

// ─── §3 · Drift sweep — zero off-ledger color-alpha shorthand ────────────

describe('StratifiedRenderer · §3 drift sweep · full SSR shows zero off-ledger color-alpha', () => {
  it('no /N outside {10,30,50,70,100} in any (bg|text|border|shadow) shorthand', () => {
    const html = renderAll();
    const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
    const offLedger: string[] = [];
    for (const m of html.matchAll(RX)) {
      if (![10, 30, 50, 70, 100].includes(Number(m[1]))) offLedger.push(m[0]);
    }
    expect(offLedger).toEqual([]);
  });

  it('the file no longer appears on the grandfather list (the array is empty)', () => {
    // Project-level receipt: this file is the eleventh and final graduation.
    // After napkin #117 the array is `[]`; the fence in `alpha-adoption.test.ts`
    // is now structural — drift here would fail the build, not log a TODO.
    expect(ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS).not.toContain(
      'components/content/StratifiedRenderer.tsx',
    );
    expect(ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS.length).toBe(0);
  });
});
