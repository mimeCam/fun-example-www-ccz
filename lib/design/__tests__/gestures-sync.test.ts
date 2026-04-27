/**
 * Gesture Atlas — sync test. Locks every (verb → row) tuple against drift.
 *
 * Companion to `lib/design/__tests__/motion-sync.test.ts` and `alpha-sync.
 * test.ts`. Where Motion's sync test enforces CSS↔TS kinship of the eight
 * timing tokens, this test enforces *vocabulary↔ledger* kinship of the
 * twelve verbs that compose those tokens into named uses:
 *
 *   • every verb's `beat` is a key of `MOTION` (typed by `MotionBeat`,
 *     re-asserted at runtime so a future widening cannot miss a row);
 *   • every verb's `ease` is a key of `EASE` (same discipline);
 *   • every verb's `reduced` is one of `'perform' | 'shorten' | 'skip'`;
 *   • `gestureClassesOf(verb)` emits a Tailwind LITERAL of shape
 *     `"duration-<beat> ease-<ease>"` for the matching row — the JIT-
 *     visibility lesson `alphaClassOf` already paid for, pinned per row;
 *   • `gestureInvariantHolds()` is `true` and the verb-list and class-
 *     table cardinalities agree (a verb without a class is drift).
 *
 * Pure: no DOM, no Jest jsdom warmup, no top-level side effects. Each
 * assertion ≤ 10 LoC.
 *
 * Credits: Mike K. (#9 — sync-test-as-invariant pattern lifted from
 * alpha-sync / motion-sync, the per-row enumeration shape), Tanya D.
 * (UIX #78 — the twelve verbs and their reduced policies, the felt-
 * sentence-as-JSDoc-string-stays-with-the-row rule we honor by reading
 * GESTURES directly instead of mirroring it), Elon M. (the typed-table-
 * is-the-registry teardown that justifies one test file, not two).
 */

import {
  GESTURES,
  GESTURE_VERBS,
  GESTURE_LEDGER_EXEMPT_TOKEN,
  GESTURE_GRANDFATHERED_PATHS,
  GESTURE_MOTION_ENDPOINT_PATHS,
  gestureClassesOf,
  reducedClassOf,
  gestureInvariantHolds,
  type GestureVerb,
  type ReducedPolicy,
} from '../gestures';
import { MOTION, EASE } from '../motion';

// ─── The reduced-policy vocabulary — locked here, not on the type alone ───

const REDUCED_POLICIES: readonly ReducedPolicy[] =
  ['perform', 'shorten', 'skip'] as const;

// ─── Tests — vocabulary kinship with the Motion ledger ────────────────────

describe('gestures — every (beat, ease) pair sits on the Motion ledger', () => {
  GESTURE_VERBS.forEach((verb) => {
    it(`${verb} — beat is a key of MOTION`, () => {
      expect(MOTION).toHaveProperty(GESTURES[verb].beat);
    });

    it(`${verb} — ease is a key of EASE`, () => {
      expect(EASE).toHaveProperty(GESTURES[verb].ease);
    });

    it(`${verb} — reduced is a known policy`, () => {
      expect(REDUCED_POLICIES).toContain(GESTURES[verb].reduced);
    });
  });
});

// ─── Tests — JIT-literal contract per row ──────────────────────────────────

/**
 * `gestureClassesOf` must emit a LITERAL Tailwind's JIT can see in source
 * (no template interpolation). This per-verb round-trip pins the literal
 * shape — `"duration-<beat> ease-<ease>"` — so a future refactor cannot
 * slip a dynamic string past the compiler. Same trap as `alphaClassOf`.
 */
describe('gestureClassesOf — emits a JIT-visible literal per row', () => {
  GESTURE_VERBS.forEach((verb) => {
    it(`${verb} → "duration-<beat> ease-<ease>"`, () => {
      const { beat, ease } = GESTURES[verb];
      expect(gestureClassesOf(verb)).toBe(`duration-${beat} ease-${ease}`);
    });
  });
});

// ─── Tests — reduced-motion resolver shape ─────────────────────────────────

describe('reducedClassOf — three policies, three shapes', () => {
  it("'perform' returns the verb's authored class string", () => {
    const performVerbs = GESTURE_VERBS.filter((v) => GESTURES[v].reduced === 'perform');
    expect(performVerbs.length).toBeGreaterThan(0);
    performVerbs.forEach((v) => expect(reducedClassOf(v)).toBe(gestureClassesOf(v)));
  });

  it("'shorten' returns the crossfade-ease-out floor for every row", () => {
    const shortenVerbs = GESTURE_VERBS.filter((v) => GESTURES[v].reduced === 'shorten');
    expect(shortenVerbs.length).toBeGreaterThan(0);
    shortenVerbs.forEach((v) => expect(reducedClassOf(v)).toBe('duration-crossfade ease-out'));
  });

  it("'skip' returns the empty string — endpoint state, no transition", () => {
    const skipVerbs = GESTURE_VERBS.filter((v) => GESTURES[v].reduced === 'skip');
    expect(skipVerbs.length).toBeGreaterThan(0);
    skipVerbs.forEach((v) => expect(reducedClassOf(v)).toBe(''));
  });
});

// ─── Tests — structural invariants of the table ───────────────────────────

describe('gestures — structural invariants', () => {
  it('gestureInvariantHolds() is true', () => {
    expect(gestureInvariantHolds()).toBe(true);
  });

  it('GESTURE_VERBS matches Object.keys(GESTURES) exactly', () => {
    expect([...GESTURE_VERBS].sort()).toEqual(Object.keys(GESTURES).sort());
  });

  it('every verb is lowercase kebab — no camelCase, no spaces', () => {
    GESTURE_VERBS.forEach((v) => expect(v).toMatch(/^[a-z][a-z0-9-]*$/));
  });

  it('no duplicate verbs', () => {
    expect(new Set<GestureVerb>(GESTURE_VERBS).size).toBe(GESTURE_VERBS.length);
  });

  it('at least twelve verbs — the four-domain vocabulary is seated', () => {
    expect(GESTURE_VERBS.length).toBeGreaterThanOrEqual(12);
  });
});

// ─── Tests — exemption tokens & grandfather list ──────────────────────────

describe('gestures — exemption tokens and migration receipts', () => {
  it('exempt token is the canonical kebab string', () => {
    expect(GESTURE_LEDGER_EXEMPT_TOKEN).toBe('gesture-ledger:exempt');
  });

  it('motion-endpoint paths name lib/utils/animation-phase.ts', () => {
    expect(GESTURE_MOTION_ENDPOINT_PATHS).toContain('lib/utils/animation-phase.ts');
  });

  it('grandfather paths use forward slashes (cross-platform stable)', () => {
    GESTURE_GRANDFATHERED_PATHS.forEach((p) => expect(p).not.toMatch(/\\/));
  });

  it('grandfather paths point at .ts or .tsx files', () => {
    GESTURE_GRANDFATHERED_PATHS.forEach((p) => expect(p).toMatch(/\.(ts|tsx)$/));
  });

  it('grandfather paths have no duplicates — each receipt is unique', () => {
    expect(new Set<string>(GESTURE_GRANDFATHERED_PATHS).size)
      .toBe(GESTURE_GRANDFATHERED_PATHS.length);
  });
});

// ─── Tests — cross-verb coherence (Tanya UX §3, Mike #9 Point 5) ──────────

/**
 * Cross-verb coherence is structural, not derived: two call-sites spelling
 * `gestureClassesOf('press-down')` *cannot* disagree because they read the
 * same row. Pin the fact so a future "let's parameterize this row by route"
 * pass has to delete this test before it can drift.
 */
describe('gestures — cross-verb coherence is structural', () => {
  it('the same verb, called twice, returns the same class string', () => {
    GESTURE_VERBS.forEach((v) => {
      expect(gestureClassesOf(v)).toBe(gestureClassesOf(v));
    });
  });

  it('verbs sharing a (beat, ease) row produce the same class string', () => {
    const byRow = new Map<string, GestureVerb[]>();
    GESTURE_VERBS.forEach((v) => {
      const key = `${GESTURES[v].beat}|${GESTURES[v].ease}`;
      byRow.set(key, [...(byRow.get(key) ?? []), v]);
    });
    byRow.forEach((verbs) => {
      const [first, ...rest] = verbs;
      rest.forEach((v) => expect(gestureClassesOf(v)).toBe(gestureClassesOf(first)));
    });
  });
});
