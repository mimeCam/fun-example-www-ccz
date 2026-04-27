/**
 * Stagger Ledger — typed table mapping a (family, rung) tuple to the
 * canonical Tailwind class string. All staggered cascades go in this
 * file. The fence test (`stagger-fence.test.ts`) enforces it.
 *
 * Two families × three rungs = six rows. JIT-visible literals only —
 * Tailwind cannot grep `` `${family}-stagger-${rung}` ``. Same lesson
 * `alphaClassOf` and `gestureClassesOf` already paid for.
 *
 * Sibling shape to `voice-ledger.ts` and `gestures.ts` (the rule-of-
 * three for ledgers as a category fires here; doctrine codification
 * waits for the fourth, per Mike's standing convention).
 *
 * Credits: Krystle C. (VP Product) — original spec (lookup primitive +
 * silence hook + fence + scope guard); Jason F. — semantic family
 * names (`'cluster' | 'reveal'`); Mike K. — napkin-plan, file shape,
 * three-commit order; Tanya D. — UX gate (the "silence" headline);
 * Paul K. — the silence → ledger → lock commit ordering; Elon M. —
 * "lead with the a11y win, drop the ledger rhetoric."
 */

// ─── Family + rung vocabulary ──────────────────────────────────────────────

/**
 * Two families today; the union widens only when a third call site
 * genuinely needs a new felt shape (Mike's rule-of-three).
 *
 *   `cluster` — horizontal politeness; a group yielding left → right at
 *               half-step intervals (Share icon row).
 *   `reveal`  — vertical disclosure; label → name → whisper at the
 *               kernel's `instant` / `enter` beats (Mirror card inner).
 *
 * Names describe the felt shape, not the first room that asked. A future
 * top-down reveal joins as `family: 'reveal'` without renaming the union.
 */
export type StaggerFamily = 'cluster' | 'reveal';

/** Three rungs, in source order — the cascade depth lives in the type. */
export type StaggerRung = 1 | 2 | 3;

/** One row's lookup input — pinned at the type level for call sites. */
export interface StaggerKey {
  readonly family: StaggerFamily;
  readonly rung: StaggerRung;
}

// ─── The table — six literal class strings, JIT-visible ───────────────────

/**
 * The canonical (family, rung) → Tailwind class table. Literals are
 * spelled out so Tailwind's JIT compiler can grep them in source.
 * NEVER template-interpolate — the surface loses its delay at runtime.
 *
 * The CSS class names (`share-stagger-*`, `mirror-stagger-*`) are kept
 * as-is for this PR; the lookup returns the existing strings. Decoupling
 * the family name in TypeScript from the class string in CSS is
 * intentional — meaning ages well, class strings are an implementation
 * detail (Mike POI #2).
 */
export const STAGGER_CLASS: Readonly<
  Record<StaggerFamily, Readonly<Record<StaggerRung, string>>>
> = {
  cluster: {
    1: 'share-stagger-1',
    2: 'share-stagger-2',
    3: 'share-stagger-3',
  },
  reveal: {
    1: 'mirror-stagger-1',
    2: 'mirror-stagger-2',
    3: 'mirror-stagger-3',
  },
};

// ─── Ordered enumerations — used by sync test + invariant ─────────────────

/** Ordered family list — sync test enumerates over this. */
export const STAGGER_FAMILIES: readonly StaggerFamily[] = ['cluster', 'reveal'];

/** Ordered rung list — sync test enumerates over this. */
export const STAGGER_RUNGS: readonly StaggerRung[] = [1, 2, 3];

// ─── Lookup — one helper, ≤ 10 LoC, JIT-safe by table-of-literals ─────────

/**
 * Tailwind class string for a (family, rung) tuple — e.g.
 * `staggerClassOf({ family: 'cluster', rung: 1 })` → `"share-stagger-1"`.
 * Pure, ≤ 10 LoC. JIT-safe (returns a literal from a fixed table).
 *
 * Compose with the property class at the call site:
 *   `` `animate-fade-in ${staggerClassOf({ family: 'cluster', rung })}` ``
 */
export function staggerClassOf(key: StaggerKey): string {
  return STAGGER_CLASS[key.family][key.rung];
}

// ─── Silence hook — the data attribute every cascade carries ──────────────

/**
 * The data-attribute hook that joins a DOM node to the reduced-motion
 * floor. One `[data-sys-stagger]` selector under one
 * `@media (prefers-reduced-motion: reduce)` block in `app/globals.css`
 * zeroes both `animation-delay` and `transition-delay` for every cascade
 * that opts in by setting this attribute.
 *
 * Future cascades opt in by setting the attribute, not by adding a
 * sibling `@media` override. The attribute is the silence hook; the
 * ledger is the address.
 *
 * Mirrors the `data-sys-enter="rise"` and `data-sys-stagger`
 * conventions already paid for elsewhere in the design system.
 */
export const STAGGER_DATA_ATTR = 'data-sys-stagger' as const;

/** JSX-spread shape — `<div {...STAGGER_DATA_PROPS}>` keeps the call
 *  site one expression. */
export const STAGGER_DATA_PROPS: { readonly 'data-sys-stagger': '' } = {
  'data-sys-stagger': '',
};

// ─── Invariant — locked by the sync test ──────────────────────────────────

/**
 * Must hold: every (family, rung) tuple has a non-empty class string;
 * the family list and rung list cardinalities agree with the table;
 * no two cells share the same class string by accident. Pure, ≤ 10 LoC.
 */
export function staggerInvariantHolds(): boolean {
  const seen = new Set<string>();
  for (const family of STAGGER_FAMILIES) {
    for (const rung of STAGGER_RUNGS) {
      const cls = STAGGER_CLASS[family]?.[rung];
      if (!cls || cls.length === 0 || seen.has(cls)) return false;
      seen.add(cls);
    }
  }
  return seen.size === STAGGER_FAMILIES.length * STAGGER_RUNGS.length;
}

// ─── Allow-list — fence's path carve-out ──────────────────────────────────

/**
 * Inline `// stagger-ledger:exempt — <reason>` comment marks a line as
 * an honest exception. Mirror of `GESTURE_LEDGER_EXEMPT_TOKEN` and
 * `ALPHA_LEDGER_EXEMPT_TOKEN`. Reviewer-visible tokens beat invisible
 * drift.
 */
export const STAGGER_LEDGER_EXEMPT_TOKEN = 'stagger-ledger:exempt';

/**
 * Path-allow-list for files that legitimately spell the bare
 * `*-stagger-*` literals. Two homes:
 *
 *   1. `lib/design/stagger.ts` — this file (the canonical table).
 *   2. `app/globals.css` — the CSS rule definitions (delays + the
 *      reduced-motion floor under `[data-sys-stagger]`).
 *
 * The CSS file is excluded from the fence's `.ts`/`.tsx` walker by
 * extension; this list is the TS-side allow-list. New entries require
 * a tech-lead-approved migration plan (mirror of
 * `GESTURE_GRANDFATHERED_PATHS`'s shrink-only doctrine).
 */
export const STAGGER_ALLOWED_PATHS: readonly string[] = [
  'lib/design/stagger.ts',
] as const;
