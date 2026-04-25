/**
 * Radius Sync Test — CSS ↔ TS drift guard.
 *
 * Reads `app/globals.css`, parses every `--sys-radius-*` declaration,
 * asserts each value matches `RADIUS[name].css` exactly. If someone edits
 * a value in either mirror but not the other, this test fails fast and
 * names the rung.
 *
 * Also asserts:
 *   - `--token-radius-soft` is declared (the one thermal carve-out)
 *   - the `mirrorRadiusBreathe` keyframe composes --sys-radius-wide with
 *     --token-radius-soft (the one hero beat allowed to use both)
 *   - `--sys-radius-*` declarations do NOT reference `--sys-tick`, `rem`-
 *     typography beats, or any other ledger's unit space (Tanya's "radius
 *     is the slowest-moving ledger" rule expressed as a non-link)
 *   - posture grammar (Mike napkin §6 / Tanya §4.1): exactly four postures
 *     exist, the vocabulary is `{ label, held, ceremony, closure }`, every
 *     rung carries one posture, and `postureOf`/`rungByPosture` are
 *     round-trip inverses over the four-element domain.
 *
 * Mirrors the strategy of `spacing-sync.test.ts` and `elevation-sync.test.ts`.
 * No build step, no codegen — a plain regex read from disk at test time.
 *
 * Credits: Mike K. (napkin — the regex-over-CSS pattern, the "don't parse
 * CSS with a parser" discipline lifted from spacing-sync / typography-sync),
 * Tanya D. (UX §4 — the one-hero-carve-out rule for mirrorRadiusBreathe,
 * tested here), Elon M. (the cardinality-vs-module-count disambiguation —
 * the assertion that exactly four rungs exist), Krystle C. (the canonical
 * ledger sprint shape that each sync test inherits).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  RADIUS,
  RADIUS_ORDER,
  RADIUS_POSTURE_ORDER,
  RadiusRungName,
  RadiusPosture,
  REM_TO_PX,
  rungOf,
  cssVarOf,
  radiusClassOf,
  liftVar,
  postureOf,
  rungByPosture,
  radiusInvariantHolds,
  RADIUS_LEDGER_EXEMPT_TOKEN,
  THERMAL_RADIUS_VAR,
  MIRROR_BREATHE_KEYFRAME,
} from '../radius';

const CSS = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf-8');

// ─── Parser helpers — pure, each ≤ 10 LOC ─────────────────────────────────

/** Extract the full body of a `--sys-radius-<name>: …;` declaration. */
function readRadiusDecl(name: string): string | undefined {
  const rx = new RegExp(`--sys-radius-${name}:\\s*([^;]+);`);
  const match = CSS.match(rx);
  return match ? match[1].trim() : undefined;
}

/** Normalise whitespace so multi-space CSS aligns with single-space TS. */
function normalise(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** True iff the mirror-breathe keyframe composes wide + token-radius-soft. */
function mirrorBreatheComposesThermal(): boolean {
  const rx = new RegExp(
    `@keyframes\\s+${MIRROR_BREATHE_KEYFRAME}[\\s\\S]*?--token-radius-soft`,
  );
  return rx.test(CSS);
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('RADIUS ↔ globals.css --sys-radius-* sync', () => {
  RADIUS_ORDER.forEach((name) => {
    it(`--sys-radius-${name} matches RADIUS.${name}.css`, () => {
      const body = readRadiusDecl(name);
      expect(body).toBeDefined();
      expect(normalise(body!)).toBe(normalise(RADIUS[name].css));
    });
  });

  it('every --sys-radius-* in CSS is represented in RADIUS', () => {
    const cssRungs = Array.from(CSS.matchAll(/--sys-radius-([a-z]+):/g))
      .map((m) => m[1]);
    const tsRungs = RADIUS_ORDER as readonly string[];
    cssRungs.forEach((r) => expect(tsRungs).toContain(r));
  });

  it('all four rungs exist in CSS', () => {
    RADIUS_ORDER.forEach((r) => expect(readRadiusDecl(r)).toBeDefined());
  });
});

describe('RADIUS structural invariants', () => {
  it('radiusInvariantHolds() is true', () => {
    expect(radiusInvariantHolds()).toBe(true);
  });

  it('exactly four rungs — not six, not five (cardinality guard)', () => {
    expect(RADIUS_ORDER.length).toBe(4);
    expect(Object.keys(RADIUS).length).toBe(4);
  });

  it('pxNominal is strictly increasing tightest → loosest', () => {
    for (let i = 1; i < RADIUS_ORDER.length; i++) {
      const a = RADIUS[RADIUS_ORDER[i - 1]].pxNominal;
      const b = RADIUS[RADIUS_ORDER[i]].pxNominal;
      expect(b).toBeGreaterThan(a);
    }
  });

  it('rung posture is soft → medium → wide → full', () => {
    expect(RADIUS_ORDER).toEqual(['soft', 'medium', 'wide', 'full']);
  });

  it('the pill rung (full) is non-rem, everything else is rem', () => {
    expect(RADIUS.full.css).toMatch(/px$/);
    (['soft', 'medium', 'wide'] as RadiusRungName[]).forEach((r) => {
      expect(RADIUS[r].css).toMatch(/rem$/);
    });
  });

  it('REM_TO_PX is the 16px browser default (never remapped)', () => {
    expect(REM_TO_PX).toBe(16);
  });
});

describe('RADIUS posture grammar — typed field, not folklore', () => {
  it('exactly four postures exist (cardinality lock)', () => {
    expect(RADIUS_POSTURE_ORDER.length).toBe(4);
    expect(new Set(RADIUS_POSTURE_ORDER).size).toBe(4);
  });

  it('the posture vocabulary is { label, held, ceremony, closure }', () => {
    expect(RADIUS_POSTURE_ORDER).toEqual(
      ['label', 'held', 'ceremony', 'closure'],
    );
  });

  it('every rung carries a posture from the locked vocabulary', () => {
    RADIUS_ORDER.forEach((r) => {
      expect(RADIUS_POSTURE_ORDER).toContain(RADIUS[r].posture);
    });
  });

  it('posture is a bijection — each appears on exactly one rung', () => {
    const seen = RADIUS_ORDER.map((r) => RADIUS[r].posture);
    expect(new Set(seen).size).toBe(RADIUS_ORDER.length);
  });

  it('soft → medium → wide → full maps 1:1 to label → held → ceremony → closure', () => {
    expect(RADIUS.soft.posture).toBe('label');
    expect(RADIUS.medium.posture).toBe('held');
    expect(RADIUS.wide.posture).toBe('ceremony');
    expect(RADIUS.full.posture).toBe('closure');
  });
});

describe('radius helpers', () => {
  it('rungOf returns the rung record for each name', () => {
    RADIUS_ORDER.forEach((r) => expect(rungOf(r)).toBe(RADIUS[r]));
  });

  it('cssVarOf returns the matching CSS custom-property reference', () => {
    expect(cssVarOf('soft')).toBe('var(--sys-radius-soft)');
    expect(cssVarOf('full')).toBe('var(--sys-radius-full)');
  });

  it('radiusClassOf returns the Tailwind utility (rounded-sys-*)', () => {
    expect(radiusClassOf('soft')).toBe('rounded-sys-soft');
    expect(radiusClassOf('medium')).toBe('rounded-sys-medium');
    expect(radiusClassOf('wide')).toBe('rounded-sys-wide');
    expect(radiusClassOf('full')).toBe('rounded-sys-full');
  });

  it('liftVar returns the thermal carve-out var with a 0rem fallback', () => {
    expect(liftVar()).toBe('var(--token-radius-soft, 0rem)');
  });

  it('THERMAL_RADIUS_VAR lines up with liftVar() output', () => {
    expect(liftVar()).toContain(THERMAL_RADIUS_VAR);
  });

  it('postureOf returns the typed posture for each rung', () => {
    expect(postureOf('soft')).toBe('label');
    expect(postureOf('medium')).toBe('held');
    expect(postureOf('wide')).toBe('ceremony');
    expect(postureOf('full')).toBe('closure');
  });

  it('rungByPosture is the inverse of postureOf (round-trip)', () => {
    RADIUS_ORDER.forEach((r) => {
      expect(rungByPosture(postureOf(r))).toBe(r);
    });
    RADIUS_POSTURE_ORDER.forEach((p) => {
      expect(postureOf(rungByPosture(p))).toBe(p);
    });
  });

  it('rungByPosture maps each locked posture word to its rung', () => {
    const expected: Record<RadiusPosture, RadiusRungName> = {
      label: 'soft',
      held: 'medium',
      ceremony: 'wide',
      closure: 'full',
    };
    RADIUS_POSTURE_ORDER.forEach((p) => {
      expect(rungByPosture(p)).toBe(expected[p]);
    });
  });

  it('the exempt token is the string the scanner looks for', () => {
    expect(RADIUS_LEDGER_EXEMPT_TOKEN).toBe('radius-ledger:exempt');
  });
});

describe('thermal carve-out — one hero beat, not a global utility', () => {
  it(`--token-radius-soft is declared in the :root scope`, () => {
    expect(CSS).toMatch(/--token-radius-soft:\s*[^;]+;/);
  });

  it('the mirrorRadiusBreathe keyframe references --token-radius-soft', () => {
    expect(mirrorBreatheComposesThermal()).toBe(true);
  });

  it('the mirrorRadiusBreathe keyframe composes on top of --sys-radius-wide', () => {
    const rx = new RegExp(
      `@keyframes\\s+${MIRROR_BREATHE_KEYFRAME}[\\s\\S]*?--sys-radius-wide`,
    );
    expect(rx.test(CSS)).toBe(true);
  });
});

describe('cross-ledger non-link — radius stays scoped to its own unit space', () => {
  it('no --sys-radius-* declaration references --sys-tick', () => {
    RADIUS_ORDER.forEach((r) => {
      const body = readRadiusDecl(r);
      expect(body).toBeDefined();
      expect(/--sys-tick\b/.test(body!)).toBe(false);
    });
  });

  it('no --sys-radius-* declaration references --sys-space-*', () => {
    RADIUS_ORDER.forEach((r) => {
      const body = readRadiusDecl(r);
      expect(body).toBeDefined();
      expect(/--sys-space-/.test(body!)).toBe(false);
    });
  });

  it('no --sys-radius-* declaration references --sys-elev-*', () => {
    RADIUS_ORDER.forEach((r) => {
      const body = readRadiusDecl(r);
      expect(body).toBeDefined();
      expect(/--sys-elev-/.test(body!)).toBe(false);
    });
  });
});
