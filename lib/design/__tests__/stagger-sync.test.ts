/**
 * Stagger Ledger — sync test. Locks every (family, rung → class) tuple
 * against drift between the TypeScript table and the CSS rule names.
 *
 * Companion to `gestures-sync.test.ts` and `voice-ledger.test.ts`. Where
 * the Gesture Atlas pins the (beat, ease) pair to the Motion ledger, the
 * Stagger Ledger pins the (family, rung) tuple to the literal class name
 * spelled in `app/globals.css`. The lookup must return EXACTLY the string
 * the CSS rule defines — no template, no concatenation, no drift.
 *
 *   • every (family, rung) tuple emits the literal class string the CSS
 *     rule defines (`.share-stagger-N` for `cluster`, `.mirror-stagger-N`
 *     for `reveal`);
 *   • the family list and rung list cardinalities match the table;
 *   • `staggerInvariantHolds()` is `true`;
 *   • `app/globals.css` carries exactly ONE `[data-sys-stagger]` reduced-
 *     motion rule (covering both animation-delay and transition-delay) —
 *     the four prior duplicate per-class blocks are gone (Mike DoD §7);
 *   • the silence hook attribute is the canonical `data-sys-stagger`
 *     string, both on the constant and on the JSX-spread shape.
 *
 * Pure: no DOM, no Jest jsdom warmup, no top-level side effects. Each
 * assertion ≤ 10 LoC.
 *
 * Credits: Krystle C. (the lookup primitive + silence hook + fence spec),
 * Mike K. (#napkin — sync-test pattern lifted from gestures-sync), Tanya
 * D. (UX gate — the silence hook is the headline), Sid (this test —
 * 2026-04-27).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  STAGGER_CLASS,
  STAGGER_FAMILIES,
  STAGGER_RUNGS,
  STAGGER_DATA_ATTR,
  STAGGER_DATA_PROPS,
  STAGGER_LEDGER_EXEMPT_TOKEN,
  STAGGER_ALLOWED_PATHS,
  staggerClassOf,
  staggerInvariantHolds,
  type StaggerFamily,
  type StaggerRung,
} from '../stagger';

const ROOT = join(__dirname, '..', '..', '..');
const GLOBALS_CSS = readFileSync(join(ROOT, 'app/globals.css'), 'utf8');

/** Slice the body of `@media (prefers-reduced-motion: reduce) { … }` —
 *  brace-balanced, so the inner reduced-motion overrides can be inspected
 *  in isolation from the base-mode rule definitions. ≤ 10 LoC. */
function extractReducedMotionBlock(src: string): string {
  const start = src.indexOf('@media (prefers-reduced-motion: reduce)');
  if (start < 0) return '';
  let depth = 0, i = src.indexOf('{', start);
  if (i < 0) return '';
  const open = i;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(open + 1, i);
  }
  return '';
}

// ─── Tests — JIT-literal contract per row ──────────────────────────────────

describe('staggerClassOf — emits a JIT-visible literal per (family, rung)', () => {
  STAGGER_FAMILIES.forEach((family) => {
    STAGGER_RUNGS.forEach((rung) => {
      it(`(${family}, ${rung}) → STAGGER_CLASS[family][rung]`, () => {
        expect(staggerClassOf({ family, rung })).toBe(STAGGER_CLASS[family][rung]);
      });
    });
  });

  it("'cluster' rows return the share-stagger-N literals", () => {
    expect(staggerClassOf({ family: 'cluster', rung: 1 })).toBe('share-stagger-1');
    expect(staggerClassOf({ family: 'cluster', rung: 2 })).toBe('share-stagger-2');
    expect(staggerClassOf({ family: 'cluster', rung: 3 })).toBe('share-stagger-3');
  });

  it("'reveal' rows return the mirror-stagger-N literals", () => {
    expect(staggerClassOf({ family: 'reveal', rung: 1 })).toBe('mirror-stagger-1');
    expect(staggerClassOf({ family: 'reveal', rung: 2 })).toBe('mirror-stagger-2');
    expect(staggerClassOf({ family: 'reveal', rung: 3 })).toBe('mirror-stagger-3');
  });
});

// ─── Tests — every TS class string has a matching CSS rule ────────────────

describe('stagger — every class string the table emits has a globals.css rule', () => {
  STAGGER_FAMILIES.forEach((family) => {
    STAGGER_RUNGS.forEach((rung) => {
      it(`.${STAGGER_CLASS[family][rung]} is defined in app/globals.css`, () => {
        const cls = STAGGER_CLASS[family][rung];
        expect(GLOBALS_CSS).toMatch(new RegExp(`\\.${cls}\\b`));
      });
    });
  });
});

// ─── Tests — the silence hook collapsed to ONE rule, no duplicates ────────

describe('stagger — globals.css carries one [data-sys-stagger] silence rule', () => {
  it('exactly one [data-sys-stagger] selector exists in globals.css', () => {
    const matches = GLOBALS_CSS.match(/\[data-sys-stagger\]/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('the rule zeros animation-delay (cluster family floor)', () => {
    expect(GLOBALS_CSS).toMatch(
      /\[data-sys-stagger\]\s*\{[^}]*animation-delay\s*:\s*0ms/,
    );
  });

  it('the rule zeros transition-delay (reveal family floor)', () => {
    expect(GLOBALS_CSS).toMatch(
      /\[data-sys-stagger\]\s*\{[^}]*transition-delay\s*:\s*0ms/,
    );
  });

  it('the prior per-class duplicate reduced-motion overrides are gone', () => {
    // Pre-PR (deleted): inside the `@media (prefers-reduced-motion: reduce)`
    // block, two duplicate selector lists overrode `animation-delay` and
    // `transition-delay` for each stagger family. Their bodies have been
    // collapsed into the single `[data-sys-stagger]` rule (asserted above).
    // Pin: within the reduced-motion media block, no `*-stagger-N` selector
    // survives — every cascade joins via the data-attribute selector instead.
    const reducedBlock = extractReducedMotionBlock(GLOBALS_CSS);
    expect(reducedBlock).not.toMatch(/\.share-stagger-[1-3]/);
    expect(reducedBlock).not.toMatch(/\.mirror-stagger-[1-3]/);
  });
});

// ─── Tests — structural invariants of the table ───────────────────────────

describe('stagger — structural invariants', () => {
  it('staggerInvariantHolds() is true', () => {
    expect(staggerInvariantHolds()).toBe(true);
  });

  it('STAGGER_FAMILIES holds exactly two members — cluster and reveal', () => {
    expect([...STAGGER_FAMILIES].sort()).toEqual(['cluster', 'reveal']);
  });

  it('STAGGER_RUNGS holds exactly 1, 2, 3 — three rungs', () => {
    expect([...STAGGER_RUNGS]).toEqual([1, 2, 3]);
  });

  it('every cell carries a non-empty class string', () => {
    STAGGER_FAMILIES.forEach((f: StaggerFamily) => {
      STAGGER_RUNGS.forEach((r: StaggerRung) => {
        expect(STAGGER_CLASS[f][r].length).toBeGreaterThan(0);
      });
    });
  });

  it('no two cells share the same class string', () => {
    const all = STAGGER_FAMILIES.flatMap((f) =>
      STAGGER_RUNGS.map((r) => STAGGER_CLASS[f][r]),
    );
    expect(new Set(all).size).toBe(all.length);
  });

  it('table cardinality is exactly families × rungs (locked)', () => {
    expect(STAGGER_FAMILIES.length * STAGGER_RUNGS.length).toBe(6);
  });
});

// ─── Tests — the silence-hook attribute is the canonical kebab string ─────

describe('stagger — silence hook attribute is canonical', () => {
  it('STAGGER_DATA_ATTR is `data-sys-stagger`', () => {
    expect(STAGGER_DATA_ATTR).toBe('data-sys-stagger');
  });

  it('STAGGER_DATA_PROPS spreads to a single `data-sys-stagger=""`', () => {
    expect(STAGGER_DATA_PROPS).toEqual({ 'data-sys-stagger': '' });
  });
});

// ─── Tests — exempt token + allow-list shape ──────────────────────────────

describe('stagger — exemption tokens and allow-list shape', () => {
  it('exempt token is the canonical kebab string', () => {
    expect(STAGGER_LEDGER_EXEMPT_TOKEN).toBe('stagger-ledger:exempt');
  });

  it('allow-list names lib/design/stagger.ts (the canonical home)', () => {
    expect(STAGGER_ALLOWED_PATHS).toContain('lib/design/stagger.ts');
  });

  it('allow-list paths use forward slashes (cross-platform stable)', () => {
    STAGGER_ALLOWED_PATHS.forEach((p) => expect(p).not.toMatch(/\\/));
  });

  it('allow-list paths are unique', () => {
    expect(new Set(STAGGER_ALLOWED_PATHS).size).toBe(STAGGER_ALLOWED_PATHS.length);
  });
});
