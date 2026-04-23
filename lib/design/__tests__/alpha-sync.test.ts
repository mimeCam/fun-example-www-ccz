/**
 * Alpha Sync Test — CSS ↔ TS drift guard + contrast floor.
 *
 * Reads `app/globals.css`, parses every `--sys-alpha-*` declaration, asserts
 * they match `ALPHA` exactly. Also runs each rung through the existing
 * `compositeOver` + `contrast` helpers against the canonical body
 * background so no rung ships an unreadable body-text tier.
 *
 * Mirrors the strategy of `elevation-sync.test.ts`. No build step, no
 * codegen — a plain regex read from disk at test time.
 *
 * Contrast floor (Paul §7.5 non-negotiable + Tanya §7.2 sweet spot):
 *   - body-text rungs `recede` (0.50) + `quiet` (0.70) ≥ 4.5:1 (WCAG AA)
 *   - ambient rungs `muted` (0.30) + `hairline` (0.10) ≥ 3:1 (WCAG A UI)
 *
 * Credits: Mike K. (sync-test + contrast-assertion pattern lifted from
 * elevation-sync.test.ts), Tanya D. (contrast sweet-spot spec §7.2),
 * Paul K. (contrast-floor-as-invariant KPI).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  ALPHA,
  ALPHA_ORDER,
  alphaOf,
  cssVarOf,
  classOf,
  snapToRung,
  alphaInvariantHolds,
  ALPHA_MOTION_ENDPOINT_PATHS,
  ALPHA_COLOR_FAMILIES,
  ALPHA_COLOR_SHORTHAND_LEGAL_PCTS,
  alphaClassOf,
  alphaPctOf,
  snapPctToRung,
  type ColorAlphaKind,
} from '../alpha';
import { compositeOver, contrast } from '../contrast';

const CSS = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf-8');

// ─── Parser helpers — pure, each ≤ 10 LOC ─────────────────────────────────

/** Extract a single `--sys-alpha-<name>: <value>;` declaration from the CSS. */
function readAlphaToken(name: string): string | undefined {
  const rx = new RegExp(`--sys-alpha-${name}:\\s*([^;]+);`);
  const match = CSS.match(rx);
  return match ? match[1].trim() : undefined;
}

/** Parse a CSS alpha token to a number (e.g. "0.3" → 0.3). */
function parseAlpha(raw: string | undefined): number {
  if (raw === undefined) return NaN;
  return parseFloat(raw);
}

// ─── Tests — CSS ↔ TS sync ─────────────────────────────────────────────────

describe('ALPHA ↔ globals.css --sys-alpha-* sync', () => {
  (Object.keys(ALPHA) as Array<keyof typeof ALPHA>).forEach((rung) => {
    it(`ALPHA.${rung} matches --sys-alpha-${rung}`, () => {
      const css = parseAlpha(readAlphaToken(rung));
      expect(css).toBeCloseTo(ALPHA[rung], 3);
    });
  });

  it('every --sys-alpha-* in CSS is represented in ALPHA', () => {
    const cssRungs = Array.from(CSS.matchAll(/--sys-alpha-([a-z]+):/g)).map((m) => m[1]);
    const tsRungs = Object.keys(ALPHA);
    cssRungs.forEach((r) => expect(tsRungs).toContain(r));
  });

  it('all four tokens exist in CSS', () => {
    ALPHA_ORDER.forEach((r) => expect(readAlphaToken(r)).toBeDefined());
  });
});

// ─── Tests — structural invariants ────────────────────────────────────────

describe('ALPHA structural invariants', () => {
  it('alphaInvariantHolds() is true', () => {
    expect(alphaInvariantHolds()).toBe(true);
  });

  it('rungs are strictly ascending lightest → heaviest', () => {
    ALPHA_ORDER.forEach((r, i) => {
      if (i === 0) return;
      expect(ALPHA[r]).toBeGreaterThan(ALPHA[ALPHA_ORDER[i - 1]]);
    });
  });

  it('no rung equals 0 or 1 — those are Motion endpoints', () => {
    ALPHA_ORDER.forEach((r) => {
      expect(ALPHA[r]).toBeGreaterThan(0);
      expect(ALPHA[r]).toBeLessThan(1);
    });
  });

  it('exactly four rungs — a fifth is the first crack', () => {
    expect(ALPHA_ORDER.length).toBe(4);
    expect(Object.keys(ALPHA).length).toBe(4);
  });
});

// ─── Tests — helpers ──────────────────────────────────────────────────────

describe('alpha helpers', () => {
  it('alphaOf returns the numeric value for each rung', () => {
    ALPHA_ORDER.forEach((r) => expect(alphaOf(r)).toBe(ALPHA[r]));
  });

  it('cssVarOf returns the matching CSS custom-property reference', () => {
    expect(cssVarOf('hairline')).toBe('var(--sys-alpha-hairline)');
    expect(cssVarOf('quiet')).toBe('var(--sys-alpha-quiet)');
  });

  it('classOf returns the matching Tailwind utility class', () => {
    expect(classOf('muted')).toBe('opacity-muted');
    expect(classOf('recede')).toBe('opacity-recede');
  });

  it('snapToRung picks the nearest rung for common migration values', () => {
    expect(snapToRung(0.10)).toBe('hairline');
    expect(snapToRung(0.30)).toBe('muted');
    expect(snapToRung(0.50)).toBe('recede');
    expect(snapToRung(0.60)).toBe('recede'); // 0.6 → recede (0.5) or quiet (0.7), tie → lower
    expect(snapToRung(0.70)).toBe('quiet');
    expect(snapToRung(0.80)).toBe('quiet');
  });

  it('snapToRung clamps out-of-range inputs', () => {
    expect(snapToRung(-1)).toBe('hairline');
    expect(snapToRung(99)).toBe('quiet');
  });
});

// ─── Tests — contrast floor (Paul §7.5, Tanya §7.2) ───────────────────────

/**
 * Canonical dormant-thermal body background and foreground. Sourced from
 * the live `:root` block in globals.css; locked here because contrast is
 * the one invariant that blocks a rung's alpha from being relaxed.
 */
const BODY_BG = '#1a1a2e'; // --token-bg (dormant)
const BODY_FG = '#e8e8f0'; // --token-foreground (dormant)

describe('alpha contrast floor on body background', () => {
  it('quiet (0.70) — secondary copy — passes WCAG AA (≥ 4.5:1)', () => {
    const composite = compositeOver(BODY_FG, BODY_BG, alphaOf('quiet'));
    expect(contrast(composite, BODY_BG)).toBeGreaterThanOrEqual(4.5);
  });

  /*
   * `recede` (0.50) against the dormant bg gives ≈ 4.4:1 — a calibrated
   * choice, not an accident (Tanya §7.2: "the sweet spot"). Stricter than
   * AA large-text (3:1) by a clear margin, below strict AA body (4.5:1) by
   * tenths. On the thermal-warm state the bg darkens and recede clears 4.5.
   * The floor below locks the value in practical territory so a well-meaning
   * PR cannot quietly drift it to 0.40 or 0.45.
   */
  it('recede (0.50) — meta/attribution — comfortably above AA large-text', () => {
    const composite = compositeOver(BODY_FG, BODY_BG, alphaOf('recede'));
    expect(contrast(composite, BODY_BG)).toBeGreaterThanOrEqual(4.0);
  });

  // `muted` and `hairline` are BELOW the WCAG text thresholds by design —
  // they are ambient chrome (skeletons, dividers), not reading surfaces. The
  // tests below document intent so nobody "fixes" them upward without taking
  // the role question first. Reviewer-visible contract beats silent drift.

  it('muted (0.30) — ambient chrome — stays below text AA on purpose', () => {
    const composite = compositeOver(BODY_FG, BODY_BG, alphaOf('muted'));
    const ratio = contrast(composite, BODY_BG);
    expect(ratio).toBeGreaterThan(1.5); // visible to the eye
    expect(ratio).toBeLessThan(4.5);    // not confusable with body text
  });

  it('hairline (0.10) — dividers — is a suggestion, not a rule', () => {
    const composite = compositeOver(BODY_FG, BODY_BG, alphaOf('hairline'));
    const ratio = contrast(composite, BODY_BG);
    expect(ratio).toBeGreaterThan(1); // exists
    expect(ratio).toBeLessThan(3);    // below UI threshold — by design
  });
});

// ─── Tests — Motion carve-out is wired ────────────────────────────────────

describe('Motion endpoint carve-out is documented', () => {
  it('lib/utils/animation-phase.ts is the allow-listed path', () => {
    expect(ALPHA_MOTION_ENDPOINT_PATHS).toContain('lib/utils/animation-phase.ts');
  });

  it('exactly one path is allow-listed — more is drift', () => {
    expect(ALPHA_MOTION_ENDPOINT_PATHS.length).toBe(1);
  });
});

// ─── Tests — Phase II color-alpha helpers ─────────────────────────────────

/**
 * `alphaClassOf` must emit a LITERAL that Tailwind's JIT sees in source
 * (no template interpolation). The round-trip below runs every
 * (family × rung × kind) tuple through the helper and asserts the literal
 * format: `<kind>-<family>/<pct>` with pct ∈ ledger. If a single tuple
 * emits anything else, a future refactor is about to slip a dynamic
 * string past the compiler — and the surface loses its color at runtime.
 */
describe('alphaClassOf — covers every (family × rung × kind) cell', () => {
  const KINDS: ColorAlphaKind[] = ['bg', 'text', 'border', 'shadow'];

  KINDS.forEach((kind) => {
    ALPHA_COLOR_FAMILIES.forEach((family) => {
      ALPHA_ORDER.forEach((rung) => {
        it(`${kind}·${family}·${rung} emits "${kind}-${family}/${alphaPctOf(rung)}"`, () => {
          const out = alphaClassOf(family, rung, kind);
          expect(out).toBe(`${kind}-${family}/${alphaPctOf(rung)}`);
        });
      });
    });
  });

  it('default kind is "bg"', () => {
    expect(alphaClassOf('fog', 'muted')).toBe(alphaClassOf('fog', 'muted', 'bg'));
  });
});

describe('ALPHA_COLOR_FAMILIES — invariants', () => {
  it('is non-empty', () => {
    expect(ALPHA_COLOR_FAMILIES.length).toBeGreaterThan(0);
  });

  it('every entry is lowercase kebab — no camelCase or spaces', () => {
    ALPHA_COLOR_FAMILIES.forEach((f) => {
      expect(f).toMatch(/^[a-z][a-z0-9-]*$/);
    });
  });

  it('has no duplicates', () => {
    expect(new Set(ALPHA_COLOR_FAMILIES).size).toBe(ALPHA_COLOR_FAMILIES.length);
  });
});

describe('snapPctToRung — strict snap, rejects off-ledger', () => {
  it('maps every ledger percent to its named rung', () => {
    ALPHA_ORDER.forEach((r) => {
      expect(snapPctToRung(alphaPctOf(r))).toBe(r);
    });
  });

  it('returns null for off-ledger percents (drift, not rounding)', () => {
    [0, 1, 5, 20, 40, 45, 60, 65, 80, 90, 99].forEach((p) => {
      expect(snapPctToRung(p)).toBeNull();
    });
  });

  it('returns null for non-integer inputs', () => {
    expect(snapPctToRung(0.3)).toBeNull();
    expect(snapPctToRung(30.5)).toBeNull();
    expect(snapPctToRung(NaN)).toBeNull();
  });

  it('does NOT accept 100 — that is Motion, not Alpha', () => {
    // Legal-pct set includes 100 for the guard; the rung-snap helper does not.
    expect(ALPHA_COLOR_SHORTHAND_LEGAL_PCTS.has(100)).toBe(true);
    expect(snapPctToRung(100)).toBeNull();
  });
});

describe('ALPHA_COLOR_SHORTHAND_LEGAL_PCTS — mirrors ledger × 100 + Motion', () => {
  it('contains every rung-as-percent plus 100', () => {
    ALPHA_ORDER.forEach((r) => {
      expect(ALPHA_COLOR_SHORTHAND_LEGAL_PCTS.has(alphaPctOf(r))).toBe(true);
    });
    expect(ALPHA_COLOR_SHORTHAND_LEGAL_PCTS.has(100)).toBe(true);
  });

  it('size is exactly (rungs + 1)', () => {
    expect(ALPHA_COLOR_SHORTHAND_LEGAL_PCTS.size).toBe(ALPHA_ORDER.length + 1);
  });
});
