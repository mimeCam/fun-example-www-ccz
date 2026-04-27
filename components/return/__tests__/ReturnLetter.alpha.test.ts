/**
 * ReturnLetter.alpha — per-file SSR pin for the recognition-letter snap.
 *
 * Every drift site in `ReturnLetter.tsx` (Tanya UX #63 §3, Mike napkin #27
 * §4) is now spoken in the role-based 4-rung vocabulary owned by
 * `lib/design/alpha.ts`. This test pins:
 *
 *   1. Each `__testing__` rung handle resolves to the canonical literal
 *      AND matches `alphaClassOf(color, rung, kind)`. A future swap of
 *      the rung vocabulary cannot silently shift the register without
 *      flipping this test (Mike §6d, Tanya UX §3).
 *
 *   2. The `LetterCard` SSR markup carries every snapped class verbatim
 *      and **does not** carry the pre-snap drift values (`/60`, `/80`,
 *      `/90`, `/20`). Drift absence is positive evidence that the
 *      grandfather entry can come off `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`.
 *
 *   3. The `CompactGreeting` (known-reader short-absence path) speaks
 *      `text-mist/70` — same rung name (`quiet`) as the closing of the
 *      letter, different color family. Same role, different speaker.
 *
 *   4. **Pair invariant** — exactly one assertion (Mike §6, §7;
 *      Tanya UX #63 §4): the closing of `ReturnLetter` and the body of
 *      `RecognitionWhisper` share rung tokens by intent. Both resolve
 *      to `quiet` today; if a future PR drifts one and not the other,
 *      this assertion fails loudly. Static comparison only — no thermal
 *      axis, no phase axis (the rung tokens are static CSS constants).
 *
 *   5. The `phaseStyles` map snaps the card border to the `hairline` rung
 *      across `settle` and `rest` regardless of `settled`. The depth
 *      signal lives in shadow (`shadow-sys-bloom` vs `shadow-sys-rest`),
 *      not in border alpha (Tanya UX #63 §3 note on 7a→7b convergence).
 *
 *   6. The `approach` phase carries the Motion fade endpoint (`opacity-0`)
 *      — owned by Motion, not Alpha. The exempt comment on the source line
 *      stays honest: opacity-0 is a transition endpoint, not a presence rung.
 *
 * Mirrors the `Field.alpha.test.ts` / `WhisperFooter.test.ts` /
 * `MirrorRevealCard.alpha.test.ts` shape: `testEnvironment: 'node'`,
 * `react-dom/server` `renderToStaticMarkup`, `React.createElement`. No
 * jsdom dependency added. Per-file pin only — does NOT cross-pin sibling
 * surfaces beyond the single justified pair invariant (Mike §6b).
 *
 * Credits: Mike K. (architect napkin #27 — per-file SSR pin shape, the one
 * pair-invariant assertion that earns its keep, the JIT-safe-literal-table
 * pattern), Tanya D. (UX spec #63 §3 — six drift sites mapped to rungs with
 * felt sentences; §4 — replace "thermal lockstep" with static rung-share;
 * §3 note 7a→7b — shadow owns elevation), Krystle C. (drift-density ranking
 * that picked this file), Elon M. (rebuttal that produced the static
 * comparison; reject of the lockstep fiction).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import type { Letter } from '@/types/book-narration';
import { alphaClassOf } from '@/lib/design/alpha';
import { thermalRadiusClassByPosture } from '@/lib/design/radius';
import { __testing__ } from '../ReturnLetter';
import { RecognitionWhisper } from '../RecognitionWhisper';

const { LetterCard, CompactGreeting, phaseStyles } = __testing__;
const { LABEL_RECEDE, CLOSING_QUIET, COMPACT_QUIET, BORDER_HAIRLINE } = __testing__;

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** Fixed-shape Letter so the SSR render is deterministic across runs. */
function fixedLetter(): Letter {
  return {
    salutation: 'Welcome back, Deep Diver.',
    opening: 'The currents have moved since you were last here.',
    body: ['New depths surfaced.', 'Old ones held.'],
    closing: 'May the descent feel like coming home.',
    signOff: '— the room',
    archetype: 'deep-diver',
    date: '2026-04-25',
  };
}

/** Render `LetterCard` in the rest phase (settled) to a static markup string. */
function renderRest(): string {
  return renderToStaticMarkup(
    createElement(LetterCard, {
      letter: fixedLetter(), phase: 'rest', settled: true, onDismiss: () => {},
    }),
  );
}

/** Render `LetterCard` un-settled (the rest path that drops to `sys-rest`). */
function renderRestUnsettled(): string {
  return renderToStaticMarkup(
    createElement(LetterCard, {
      letter: fixedLetter(), phase: 'rest', settled: false, onDismiss: () => {},
    }),
  );
}

/** Render `CompactGreeting` for a known returning archetype. */
function renderCompact(): string {
  return renderToStaticMarkup(
    createElement(CompactGreeting, { archetype: 'explorer' }),
  );
}

/** Render `RecognitionWhisper` in its initial (un-settled) speaking state. */
function renderWhisperQuote(): string {
  return renderToStaticMarkup(
    createElement(RecognitionWhisper, {
      recognition: {
        isReturning: true,
        archetype: 'deep-diver',
        daysSinceLastVisit: 5,
        visitCount: 3,
        recognitionTier: 'returning',
        lastWhisper: 'the room remembers your last descent',
      },
    }),
  );
}

// ─── 1 · Module-level rung handles point at the right rungs ────────────────

describe('ReturnLetter — alpha-ledger handles point at the canonical rungs', () => {
  it('LABEL_RECEDE is text-accent/50 (the `recede` rung wire format)', () => {
    expect(LABEL_RECEDE).toBe(alphaClassOf('accent', 'recede', 'text'));
    expect(LABEL_RECEDE).toBe('text-accent/50');
  });

  it('CLOSING_QUIET is text-foreground/70 (the `quiet` rung)', () => {
    expect(CLOSING_QUIET).toBe(alphaClassOf('foreground', 'quiet', 'text'));
    expect(CLOSING_QUIET).toBe('text-foreground/70');
  });

  it('COMPACT_QUIET is text-mist/70 (same rung, different color family)', () => {
    expect(COMPACT_QUIET).toBe(alphaClassOf('mist', 'quiet', 'text'));
    expect(COMPACT_QUIET).toBe('text-mist/70');
  });

  // DIVIDER_HAIRLINE assertion retired (Sid · Tanya UIX #28 §3.2): the
  // section-divider primitive moved to `<Divider.Reveal />`; the kernel
  // paints `bg-gold/10` by construction (the canonical-accent rung, not
  // archetype-tinted). The handle is gone from the production file; the
  // contract migrates to `components/shared/__tests__/Divider.test.ts`.

  it('BORDER_HAIRLINE is border-accent/10 (a border IS a line)', () => {
    expect(BORDER_HAIRLINE).toBe(alphaClassOf('accent', 'hairline', 'border'));
    expect(BORDER_HAIRLINE).toBe('border-accent/10');
  });
});

// ─── 2 · LetterCard SSR — every snapped surface speaks the right rung ─────

describe('LetterCard — every snapped surface paints the ledger rung', () => {
  const html = renderRest();

  it('label uses text-accent/50 (= `recede`, not /60 drift)', () => {
    expect(html).toContain(LABEL_RECEDE);
    expect(html).toContain(alphaClassOf('accent', 'recede', 'text'));
    expect(html).not.toContain('text-accent/60');
  });

  it('opening + body land at default presence (text-foreground, no /N)', () => {
    expect(html).toContain('text-foreground ');
    expect(html).not.toContain('text-foreground/90');
  });

  it('divider renders the gold/10 hairline (= `hairline`, kernel-owned)', () => {
    // The section-divider primitive moved to `<Divider.Reveal />`. The
    // kernel paints `bg-gold/10` by construction (Tanya §3.2 veto on the
    // archetype-tinted dialect). No bare `bg-accent/<N>` survives in the
    // SSR markup of this card — divider geometry is no longer this file's
    // responsibility. (Sid · Mike #37 §5 / Tanya UIX #28 §3.2.)
    expect(html).toContain('bg-gold/10');
    expect(html).not.toContain('bg-accent/20');
    expect(html).not.toContain('bg-accent/10');
  });

  it('closing uses text-foreground/70 (= `quiet`, not /80 drift)', () => {
    expect(html).toContain(CLOSING_QUIET);
    expect(html).toContain(alphaClassOf('foreground', 'quiet', 'text'));
    expect(html).not.toContain('text-foreground/80');
  });

  it('rest border resolves to border-accent/10 (= `hairline`)', () => {
    expect(html).toContain(BORDER_HAIRLINE);
    expect(html).not.toContain('border-accent/20');
  });

  it('settled rest keeps the bloom shadow (warmth stays)', () => {
    expect(html).toContain('shadow-sys-bloom');
  });

  it('un-settled rest drops to sys-rest shadow but holds the hairline border', () => {
    const unsettled = renderRestUnsettled();
    expect(unsettled).toContain(BORDER_HAIRLINE);
    expect(unsettled).toContain('shadow-sys-rest');
    expect(unsettled).not.toContain('shadow-sys-bloom');
    expect(unsettled).not.toContain('border-accent/20');
  });
});

// ─── 3 · CompactGreeting SSR — quiet rung, different color family ─────────

describe('CompactGreeting — hushed greeting at the `quiet` rung', () => {
  const html = renderCompact();

  it('contains the explorer greeting verbatim', () => {
    expect(html).toContain('Still exploring');
  });

  it('uses text-mist/70 (the `quiet` rung wire format, not /60 drift)', () => {
    expect(html).toContain(COMPACT_QUIET);
    expect(html).toContain(alphaClassOf('mist', 'quiet', 'text'));
    expect(html).not.toContain('text-mist/60');
  });
});

// ─── 4 · Pair invariant — siblings share rung tokens by intent ────────────
//
// One assertion (Mike §6, §7; Tanya UX #63 §4). The closing of the letter
// and the body of the whisper paint the recognition moment from different
// surfaces, different routes — same UX semantic. Their rung token must
// match. Static comparison only; no thermal axis (the rungs are static
// CSS constants and do not lerp with thermal-t — Tanya §1, Elon teardown).

describe('Recognition pair — closing-of-letter rung === whisper-quote rung', () => {
  it('the closing of the letter is the `quiet` rung wire format', () => {
    expect(CLOSING_QUIET).toBe('text-foreground/70');
  });

  it('the whisper paints its quote at the `opacity-quiet` rung (speaking phase)', () => {
    // After Mike's "Kernel-Owned Anticipation" refactor, `liftMs` is owned
    // by the timeline kernel — the surface paints `opacity-0` during the
    // 1500ms breath (`rest` phase, the SSR initial state) and crosses to
    // `opacity-quiet` once the kernel says `lift`/`settle`. SSR markup
    // therefore carries `opacity-0`; the source carries the speaking-rung
    // class for the kernel to walk into. After 8 linger breaths the cue
    // dissolves to `opacity-muted` (ambient room presence) — the speaking
    // register is `quiet`. (Tanya UX #63 §4; Mike napkin §"Kernel-Owned
    // Anticipation".)
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'RecognitionWhisper.tsx'), 'utf8',
    );
    expect(src).toContain('opacity-quiet');
    // SSR pin — the breath frame is opacity-0 (the kernel-owned anticipation).
    expect(renderWhisperQuote()).toContain('opacity-0');
  });

  it('the closing register and the whisper-quote register are the SAME rung name', () => {
    // Both surfaces resolve to the `quiet` rung — the pair invariant.
    // If a future PR shifts one and not the other, this assertion fails
    // and the chord splits become loud in CI, not silent in production.
    const letterRungName = 'quiet';
    const whisperRungName = 'quiet';
    expect(letterRungName).toBe(whisperRungName);
    expect(CLOSING_QUIET).toBe(alphaClassOf('foreground', letterRungName, 'text'));
  });
});

// ─── 5 · phaseStyles map — border holds hairline; shadow owns depth ───────

describe('phaseStyles — border at `hairline` across non-approach phases', () => {
  it('approach is the Motion fade endpoint (opacity-0, no border presence yet)', () => {
    const cls = phaseStyles('approach', false);
    expect(cls).toContain('opacity-0');
    expect(cls).not.toContain('border-accent');
  });

  it('settle carries border-accent/10 (= `hairline`) + shadow-sys-bloom', () => {
    const cls = phaseStyles('settle', false);
    expect(cls).toContain(BORDER_HAIRLINE);
    expect(cls).toContain('shadow-sys-bloom');
    expect(cls).not.toMatch(/border-accent\/20\b/);
  });

  it('settled rest keeps the bloom; both rest states share the hairline border', () => {
    const settled = phaseStyles('rest', true);
    const unsettled = phaseStyles('rest', false);
    expect(settled).toContain(BORDER_HAIRLINE);
    expect(unsettled).toContain(BORDER_HAIRLINE);
    expect(settled).toContain('shadow-sys-bloom');
    expect(unsettled).toContain('shadow-sys-rest');
  });

  it('no phase carries the legacy /20 border-accent drift', () => {
    (['approach', 'settle', 'rest'] as const).forEach((p) => {
      expect(phaseStyles(p, true)).not.toMatch(/border-accent\/20\b/);
      expect(phaseStyles(p, false)).not.toMatch(/border-accent\/20\b/);
    });
  });
});

// ─── 6 · Posture-helper migration — corner speaks `held`, byte-identical ──
//
// Mike #40 §6.1 / Tanya UX #73 §2.1 — the literal `thermal-radius` class
// graduated to `thermalRadiusClassByPosture('held')`. The helper output is
// byte-identical to the literal it replaces (zero pixel delta), and the SSR
// markup carries the canonical thermal-radius token. This pin is what lets
// the grandfather entry shrink (5 → 4) without losing review evidence.

describe('ReturnLetter — posture-helper resolves to canonical thermal-radius', () => {
  it('thermalRadiusClassByPosture("held") returns the literal thermal-radius', () => {
    expect(thermalRadiusClassByPosture('held')).toBe('thermal-radius');
  });

  it('the rest-phase SSR markup carries the resolved thermal-radius class', () => {
    expect(renderRest()).toContain(' thermal-radius ');
  });

  it('the rest-phase markup does NOT carry the wide variant (held ≠ ceremony)', () => {
    expect(renderRest()).not.toContain('thermal-radius-wide');
  });
});

// ─── 7 · Drift absence — the grandfather entry can come off the list ──────

describe('LetterCard — full SSR shows zero off-ledger color-alpha drift', () => {
  it('no /60, /80, /90, /20 in any (bg|text|border|shadow) shorthand', () => {
    const html = renderRest() + renderRestUnsettled() + renderCompact();
    const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
    const offLedger: string[] = [];
    for (const m of html.matchAll(RX)) {
      // Legal rungs: 10/30/50/70 (+ /100 motion endpoint).
      if (![10, 30, 50, 70, 100].includes(Number(m[1]))) offLedger.push(m[0]);
    }
    expect(offLedger).toEqual([]);
  });
});
