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
 *     table cardinalities agree (a verb without a class is drift);
 *   • the table is locked at exactly fourteen verbs (the four-domain
 *     vocabulary is seated; verb #14 — `thread-settle` — earned its seat
 *     by lifting `GoldenThread.tsx`'s inline fill transition onto the
 *     Atlas baton, Mike #62 / Tanya UIX #23) and
 *     `GESTURE_GRANDFATHERED_PATHS` is closed at length 0
 *     (the fence forbids new entries, doctrine flipped from tolerate to
 *     forbid in the Atlas-closure PR — Mike #36, Sid 2026-04-27).
 *
 * Pure: no DOM, no Jest jsdom warmup, no top-level side effects. Each
 * assertion ≤ 10 LoC.
 *
 * Credits: Mike K. (#9, #36 — sync-test-as-invariant pattern lifted from
 * alpha-sync / motion-sync, the per-row enumeration shape, the closed-
 * list assertion at the structural seam), Tanya D. (UIX #78, #100 — the
 * thirteen verbs and their reduced policies, the felt-sentence-as-JSDoc-
 * string-stays-with-the-row rule we honor by reading GESTURES directly
 * instead of mirroring it), Elon M. (the typed-table-is-the-registry
 * teardown that justifies one test file, not two).
 */

import {
  GESTURES,
  GESTURE_VERBS,
  GESTURE_LEDGER_EXEMPT_TOKEN,
  GESTURE_GRANDFATHERED_PATHS,
  GESTURE_MOTION_ENDPOINT_PATHS,
  gestureClassesOf,
  reducedClassOf,
  gestureClassesForMotion,
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

// ─── Tests — runtime-branched composer (Mike napkin #88 §4.1) ─────────────

/**
 * `gestureClassesForMotion(verb, prefersReduced)` is a runtime ternary
 * over two table reads — never a template. The two branches must equal
 * the canonical helpers exactly so a future refactor cannot slip a
 * dynamic string past either the JIT or the type system.
 */
describe('gestureClassesForMotion — branches over the policy column', () => {
  it('prefersReduced=false → identical to gestureClassesOf(verb)', () => {
    GESTURE_VERBS.forEach((v) => {
      expect(gestureClassesForMotion(v, false)).toBe(gestureClassesOf(v));
    });
  });

  it('prefersReduced=true → identical to reducedClassOf(verb)', () => {
    GESTURE_VERBS.forEach((v) => {
      expect(gestureClassesForMotion(v, true)).toBe(reducedClassOf(v));
    });
  });

  it("the killer-feature pair: 'reveal-keepsake' + 'fade-neutral' both shorten under reduce", () => {
    expect(gestureClassesForMotion('reveal-keepsake', true)).toBe('duration-crossfade ease-out');
    expect(gestureClassesForMotion('fade-neutral',    true)).toBe('duration-crossfade ease-out');
  });

  it('the perform branch preserves the authored timing for the killer-feature pair', () => {
    expect(gestureClassesForMotion('reveal-keepsake', false)).toBe('duration-reveal ease-out');
    expect(gestureClassesForMotion('fade-neutral',    false)).toBe('duration-fade ease-sustain');
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

  it('exactly fourteen verbs — the table is locked until rule-of-three fires for verb #15', () => {
    expect(GESTURE_VERBS.length).toBe(14);
  });
});

// ─── Tests — the grandfather list is CLOSED (fence flipped to forbid) ─────

/**
 * Atlas closure receipt — the structural pin (Mike #36 §3, Sid 2026-04-27).
 * `GESTURE_GRANDFATHERED_PATHS` is checked here (not just `length === 0`)
 * with `toEqual([])` so a future "temporary re-add" surfaces the offending
 * entries in the failure message rather than just a count. The doctrine
 * flip — *tolerate → forbid* — lives in the source, not in the comments.
 */
describe('gestures — the grandfather list is closed (length === 0, fence forbids)', () => {
  it('GESTURE_GRANDFATHERED_PATHS is the empty array — no exceptions', () => {
    expect(GESTURE_GRANDFATHERED_PATHS).toEqual([]);
  });

  it('the closed list still type-resolves as a readonly string[]', () => {
    expect(Array.isArray(GESTURE_GRANDFATHERED_PATHS)).toBe(true);
    expect(GESTURE_GRANDFATHERED_PATHS.length).toBe(0);
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
