/**
 * MirrorRevealCard alpha pin — phase→className map locked to ledger rungs.
 *
 * The killer feature's reveal moment lives in this card. Each of its four
 * post-`hidden` phases speaks ONE rung family on the gold border, and the
 * whisper quote speaks the `quiet` rung — by construction, by ledger.
 *
 * What this test pins:
 *
 *   1. The whisper quote uses `text-foreground/70` (= `alphaClassOf
 *      ('foreground','quiet','text')`) — pre-snap drift was `/80`. This
 *      is "content, but not THE content" (Mike napkin #19 §4.2).
 *
 *   2. `emergence` carries `border-gold/10` (= hairline) and the three
 *      attention-earning phases (`shimmer`, `reveal`, `rest`) carry
 *      `border-gold/30` (= muted). Pre-snap drift was `/20`. The pair
 *      rule (Tanya UX #47, Mike §4.2): all attention-earning phases
 *      share ONE rung — never split rungs across phases of the same
 *      component, the reveal would feel uneven.
 *
 *   3. The `hidden` phase legally uses `opacity-0` — the Motion fade
 *      endpoint. NOT a presence rung; carved out by Motion ownership
 *      (alpha-ledger:exempt comment on the map).
 *
 *   4. No off-ledger color-alpha shorthand survives in the phase map.
 *      Snapshot the className-per-phase tuple; future drift fails here
 *      cheaper than in 7-of-10 user testing (Mike §4.6).
 *
 * Test file is `.ts` (not `.tsx`); we read the pure helper through the
 * `__testing__` seam so no phase machine, no fake timers, no jsdom.
 *
 * Credits: Mike K. (napkin #19 §4.2 / §4.6 — pair-rule pin, snapshot
 * the phase map, drift-on-the-killer-card is a regression of THE
 * feature), Tanya D. (UX #47 §3.4 — quiet rung for the whisper quote;
 * the borrowed-presence discipline that makes the reveal feel given,
 * not announced), Paul K. (the "lint test enforces forever" stance
 * this file inherits).
 */

import { __testing__ } from '../MirrorRevealCard';
import { alphaClassOf } from '@/lib/design/alpha';

const { phaseClass, WHISPER_TEXT, BORDER_HAIRLINE, BORDER_MUTED } = __testing__;

// ─── Tiny pure helpers — ≤ 10 LOC each ──────────────────────────────────

/** Normalise a className string to a Set of tokens for order-free assertions. */
function tokens(cls: string): Set<string> {
  return new Set(cls.trim().split(/\s+/).filter(Boolean));
}

/** Expect an exact class token in the rendered map slot. */
function hasToken(cls: string, t: string): boolean {
  return tokens(cls).has(t);
}

// ─── Module-level alpha-ledger handles ──────────────────────────────────

describe('MirrorRevealCard — alpha-ledger handles point at the right rungs', () => {
  it('WHISPER_TEXT is text-foreground/70 (the `quiet` rung)', () => {
    expect(WHISPER_TEXT).toBe(alphaClassOf('foreground', 'quiet', 'text'));
    expect(WHISPER_TEXT).toBe('text-foreground/70');
  });

  it('BORDER_HAIRLINE is border-gold/10 (= ALPHA.hairline)', () => {
    expect(BORDER_HAIRLINE).toBe(alphaClassOf('gold', 'hairline', 'border'));
    expect(BORDER_HAIRLINE).toBe('border-gold/10');
  });

  it('BORDER_MUTED is border-gold/30 (= ALPHA.muted)', () => {
    expect(BORDER_MUTED).toBe(alphaClassOf('gold', 'muted', 'border'));
    expect(BORDER_MUTED).toBe('border-gold/30');
  });
});

// ─── Phase map — each phase carries the right rung ──────────────────────

describe('MirrorRevealCard — `hidden` is the Motion fade endpoint', () => {
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
});

describe('MirrorRevealCard — `emergence` speaks at the hairline rung', () => {
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
});

describe('MirrorRevealCard — `shimmer` / `reveal` / `rest` share ONE border rung', () => {
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
});

describe('MirrorRevealCard — bloom shadow is earned in the reveal phase', () => {
  it('shimmer paints the archetype-tinted box-shadow inline (no Tailwind shadow yet)', () => {
    expect(hasToken(phaseClass('shimmer'), 'shadow-sys-bloom')).toBe(false);
    expect(hasToken(phaseClass('shimmer'), 'mirror-card-shimmer')).toBe(true);
  });

  it('reveal and rest both carry shadow-sys-bloom', () => {
    expect(hasToken(phaseClass('reveal'), 'shadow-sys-bloom')).toBe(true);
    expect(hasToken(phaseClass('rest'),   'shadow-sys-bloom')).toBe(true);
  });
});

// ─── Snapshot the whole map — future drift fails here ───────────────────

describe('MirrorRevealCard — phase→className map snapshot (drift fence)', () => {
  it('every non-hidden phase contains only on-ledger color-alpha rungs', () => {
    const phases = ['emergence', 'shimmer', 'reveal', 'rest'] as const;
    const offLedger: string[] = [];
    const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
    phases.forEach((p) => {
      const cls = phaseClass(p);
      for (const m of cls.matchAll(RX)) {
        if (![10, 30, 50, 70, 100].includes(Number(m[1]))) offLedger.push(`${p}:${m[0]}`);
      }
    });
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
