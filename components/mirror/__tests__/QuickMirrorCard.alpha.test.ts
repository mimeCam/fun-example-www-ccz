/**
 * QuickMirrorCard alpha pin — phase→className map locked to ledger rungs.
 *
 * The end-of-article archetype reveal lives on this card. Its five phases
 * each speak ONE rung family on the gold border, the dismissed-state
 * divider speaks `hairline`, and the whisper-quote speaks `quiet` — by
 * construction, by ledger.
 *
 * What this test pins:
 *
 *   1. Each `__testing__` rung handle resolves to the canonical literal
 *      AND matches `alphaClassOf(color, rung, kind)`. Pre-snap drift
 *      (`bg-gold/20`, `text-foreground/80`, `border-gold/20`) is gone;
 *      a future swap of the rung vocabulary cannot silently shift the
 *      register without flipping this test (Mike napkin #19 §4.2;
 *      napkin #47 §6 — failure-message-is-the-doc).
 *
 *   2. `emergence` carries `border-gold/10` (= hairline) — the card
 *      whispers itself in. `shimmer`, `reveal`, and `rest` all carry
 *      `border-gold/30` (= muted), the pair-rule rung (Mike napkin
 *      #19 §4.2): every "earned-attention" phase shares ONE rung —
 *      splitting rungs across attention-earning phases would read as
 *      the card flickering between definitions.
 *
 *   3. The `hidden` phase legally uses `opacity-0` — the Motion fade
 *      endpoint. NOT a presence rung; carved out by Motion ownership
 *      (alpha-ledger:exempt comment on the source map).
 *
 *   4. No off-ledger color-alpha shorthand survives in the phase map.
 *      Snapshot the className-per-phase tuple; future drift fails here
 *      cheaper than in 7-of-10 user testing (Mike napkin #19 §4.6).
 *
 *   5. Pair invariant — exactly one assertion (Mike napkin #47 §6;
 *      mirroring `ReturnLetter.alpha.test.ts` §4): the whisper-quote
 *      register on `QuickMirrorCard` and `MirrorRevealCard` resolve to
 *      the SAME rung token. Same UX semantic, two surfaces; if a future
 *      PR drifts one and not the other, this fails loudly in CI.
 *
 * Test file is `.ts` (not `.tsx`); we read the pure helper through the
 * `__testing__` seam so no phase machine, no fake timers, no jsdom.
 *
 * Credits: Mike K. (architect napkin #19 §4.2 / §4.6 — pair-rule pin,
 * snapshot the phase map, drift-on-the-killer-card is a regression of
 * THE feature; napkin #47 — the redemption procedure, JIT-safe-literal
 * table, failure-message-is-the-doc), Tanya D. (UX #47 §3.4 — quiet
 * rung for the whisper quote; the borrowed-presence discipline that
 * makes the reveal feel given, not announced), Paul K. (the spine
 * framing — Mirror is MH-2, the highest-leverage promise this test
 * defends), Elon M. (the discipline bar — tests > vibes; load-bearing
 * comments only).
 */

import { __testing__ as QUICK } from '../QuickMirrorCard';
import { __testing__ as REVEAL } from '../MirrorRevealCard';
import { alphaClassOf } from '@/lib/design/alpha';

const { phaseClass, DIVIDER_HAIRLINE, WHISPER_TEXT, BORDER_HAIRLINE, BORDER_MUTED } = QUICK;

// ─── Tiny pure helpers — ≤ 10 LOC each ──────────────────────────────────

/** Normalise a className string to a Set of tokens for order-free assertions. */
function tokens(cls: string): Set<string> {
  return new Set(cls.trim().split(/\s+/).filter(Boolean));
}

/** Expect an exact class token in the rendered map slot. */
function hasToken(cls: string, t: string): boolean {
  return tokens(cls).has(t);
}

/** Concatenate the entire phase map for a single drift sweep. */
function phaseMapText(): string {
  const phases = ['hidden', 'emergence', 'shimmer', 'reveal', 'rest'] as const;
  return phases.map((p) => phaseClass(p)).join(' ');
}

// ─── 1 · Module-level rung handles point at the right rungs ────────────────

describe('QuickMirrorCard — alpha-ledger handles point at the canonical rungs', () => {
  it('DIVIDER_HAIRLINE is bg-gold/10 (geometry, not surface)', () => {
    expect(DIVIDER_HAIRLINE).toBe(alphaClassOf('gold', 'hairline', 'bg'));
    expect(DIVIDER_HAIRLINE).toBe('bg-gold/10');
  });

  it('WHISPER_TEXT is text-foreground/70 (the `quiet` rung wire format)', () => {
    expect(WHISPER_TEXT).toBe(alphaClassOf('foreground', 'quiet', 'text'));
    expect(WHISPER_TEXT).toBe('text-foreground/70');
  });

  it('BORDER_HAIRLINE is border-gold/10 (a border IS a line)', () => {
    expect(BORDER_HAIRLINE).toBe(alphaClassOf('gold', 'hairline', 'border'));
    expect(BORDER_HAIRLINE).toBe('border-gold/10');
  });

  it('BORDER_MUTED is border-gold/30 (= ALPHA.muted, the pair-rule rung)', () => {
    expect(BORDER_MUTED).toBe(alphaClassOf('gold', 'muted', 'border'));
    expect(BORDER_MUTED).toBe('border-gold/30');
  });
});

// ─── 2 · Phase map — `hidden` is the Motion fade endpoint ───────────────────

describe('QuickMirrorCard — `hidden` is the Motion fade endpoint', () => {
  const cls = phaseClass('hidden');

  it('uses opacity-0 (Motion-owned endpoint, not a presence rung)', () => {
    expect(hasToken(cls, 'opacity-0')).toBe(true);
  });

  it('carries `border-transparent` — no border presence yet', () => {
    expect(hasToken(cls, 'border-transparent')).toBe(true);
  });

  it('does NOT bloom — shadow-sys-bloom is earned later', () => {
    expect(hasToken(cls, 'shadow-sys-bloom')).toBe(false);
  });

  it('does NOT carry any gold border yet (transparent until emergence)', () => {
    expect(cls).not.toMatch(/border-gold\/\d+/);
  });
});

// ─── 3 · `emergence` whispers itself in at hairline ────────────────────────

describe('QuickMirrorCard — `emergence` speaks at the hairline rung', () => {
  const cls = phaseClass('emergence');

  it('uses opacity-quiet (the named 0.70 rung, not /80 drift)', () => {
    expect(hasToken(cls, 'opacity-quiet')).toBe(true);
  });

  it('carries border-gold/10 — the hairline rung "this is a line"', () => {
    expect(hasToken(cls, BORDER_HAIRLINE)).toBe(true);
  });

  it('does NOT carry the legacy /20 drift', () => {
    expect(cls).not.toMatch(/border-gold\/20\b/);
  });

  it('does NOT carry the muted rung yet (definition is earned later)', () => {
    expect(hasToken(cls, BORDER_MUTED)).toBe(false);
  });
});

// ─── 4 · `shimmer` / `reveal` / `rest` share ONE border rung ───────────────

describe('QuickMirrorCard — `shimmer` / `reveal` / `rest` share ONE border rung', () => {
  const phases = ['shimmer', 'reveal', 'rest'] as const;

  it.each(phases)('%s carries border-gold/30 (= muted, the pair-rule rung)', (p) => {
    expect(hasToken(phaseClass(p), BORDER_MUTED)).toBe(true);
  });

  it.each(phases)('%s does NOT carry the legacy /20 drift', (p) => {
    expect(phaseClass(p)).not.toMatch(/border-gold\/20\b/);
  });

  it('the three earning phases use the SAME border rung (pair rule)', () => {
    const set = new Set(phases.map((p) => {
      const m = phaseClass(p).match(/border-gold\/\d+/);
      return m ? m[0] : null;
    }));
    expect(set.size).toBe(1);
  });

  it.each(phases)('%s rides at opacity-100 (Motion-owned full-presence endpoint)', (p) => {
    expect(hasToken(phaseClass(p), 'opacity-100')).toBe(true);
  });
});

// ─── 5 · Bloom shadow is earned in the reveal phase ────────────────────────

describe('QuickMirrorCard — bloom shadow is earned in the reveal phase', () => {
  it('shimmer paints the archetype-tinted box-shadow inline (no Tailwind shadow yet)', () => {
    expect(hasToken(phaseClass('shimmer'), 'shadow-sys-bloom')).toBe(false);
    expect(hasToken(phaseClass('shimmer'), 'mirror-card-shimmer')).toBe(true);
  });

  it('reveal and rest both carry shadow-sys-bloom', () => {
    expect(hasToken(phaseClass('reveal'), 'shadow-sys-bloom')).toBe(true);
    expect(hasToken(phaseClass('rest'),   'shadow-sys-bloom')).toBe(true);
  });
});

// ─── 6 · Drift-absence sweep — every snapped surface honours the ledger ───
//
// Concatenate every phase the map produces and assert no off-ledger
// color-alpha shorthand leaks back in. Mirrors `ReturnLetter.alpha.test.ts`
// §6 — "the grandfather entry can come off the list."

describe('QuickMirrorCard — phase map carries zero off-ledger color-alpha drift', () => {
  it('no /20, /40, /60, /80, /90 in any (bg|text|border|shadow) shorthand', () => {
    const cls = phaseMapText();
    const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
    const offLedger: string[] = [];
    for (const m of cls.matchAll(RX)) {
      // Legal rungs: 10/30/50/70 (+ /100 motion endpoint).
      if (![10, 30, 50, 70, 100].includes(Number(m[1]))) offLedger.push(m[0]);
    }
    expect(offLedger).toEqual([]);
  });

  it('snapshot pin: the full phase map (any change is a deliberate review)', () => {
    expect({
      hidden:    phaseClass('hidden'),
      emergence: phaseClass('emergence'),
      shimmer:   phaseClass('shimmer'),
      reveal:    phaseClass('reveal'),
      rest:      phaseClass('rest'),
    }).toMatchSnapshot();
  });
});

// ─── 7 · Pair invariant — Quick + Reveal whisper at the same rung ─────────
//
// One assertion (Mike napkin #47 §6, mirroring ReturnLetter.alpha §4). The
// whisper-quote on QuickMirrorCard (end-of-article ceremony) and the one
// on MirrorRevealCard (the /mirror page reveal) paint the same UX moment
// from different surfaces. Their rung token must match. Static comparison;
// no thermal axis (the rung tokens are static CSS constants).

describe('Mirror pair — QuickMirrorCard.whisper rung === MirrorRevealCard.whisper rung', () => {
  it('the whisper-quote register on both surfaces is the SAME rung name', () => {
    // Both surfaces resolve to the `quiet` rung — the pair invariant.
    // If a future PR shifts one and not the other, this assertion fails
    // and the chord splits become loud in CI, not silent in production.
    const quickRungName = 'quiet';
    const revealRungName = 'quiet';
    expect(quickRungName).toBe(revealRungName);
    expect(WHISPER_TEXT).toBe(REVEAL.WHISPER_TEXT);
    expect(WHISPER_TEXT).toBe(alphaClassOf('foreground', quickRungName, 'text'));
  });

  it('both surfaces share the same border-rung family (hairline + muted)', () => {
    expect(BORDER_HAIRLINE).toBe(REVEAL.BORDER_HAIRLINE);
    expect(BORDER_MUTED).toBe(REVEAL.BORDER_MUTED);
  });
});
