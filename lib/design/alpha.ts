/**
 * Alpha Ledger — the 7th ledger, role-in-attention presence vocabulary.
 *
 * CSS (`app/globals.css`) is canonical. TypeScript mirrors it.
 * `lib/design/__tests__/alpha-sync.test.ts` enforces kinship. If a number
 * changes in one place it must change in the other — or the test fails.
 *
 * Four rungs, named by **UX role the element plays in the reader's
 * attention**, not by volume or intimacy (no "silent/hush/whisper" ladder
 * — that collides with Color=warmth and Typography=voice):
 *
 *   hairline (0.10) — "This is a line, not content." — dividers, ghost strokes.
 *   muted    (0.30) — "Ambient chrome; skip past it."  — skeletons, disabled rest.
 *   recede   (0.50) — "Context around the subject."     — meta, attribution.
 *   quiet    (0.70) — "Content, but not THE content."  — secondary copy.
 *
 * NOT in the ledger — owned by Motion:
 *   α = 0.0  (opacity-0)   — fade-out endpoint
 *   α = 1.0  (opacity-100) — fade-in endpoint / motion-reduce baseline
 *
 * And α = 1.0 as *default presence* is the subject — headings, body, any
 * element the reader is supposed to meet head-on. No ledger entry needed;
 * it's just the default render.
 *
 * IMPORTANT: if you change a value in globals.css, change it here too.
 * The test in __tests__/alpha-sync.test.ts catches drift.
 *
 * Credits: Tanya D. (UIX spec #80 — role-based 4-rung vocabulary, first-
 * scroll shape test, loading-skeleton collapse, layer-audit deletions),
 * Mike K. (architect napkin #24 — CSS-canonical + sync-test + adoption-
 * guard pattern, scope fence, snap-not-preserve migration, explicit Motion
 * carve-out), Elon M. (first-principles teardown that produced the 4-rung
 * number and the Motion-endpoint ownership split), Paul K. (business
 * outcome — body gains authority because everything around it steps back
 * the same amount).
 */

// ─── Rung vocabulary — mirrors --sys-alpha-* in app/globals.css ────────────

/**
 * Four rungs, named by UX role, ordered lightest → heaviest presence.
 *
 * Naming is by *what the reader does with the element*, not by how loud it
 * "feels." A divider USES `hairline`; a footnote USES `recede`. Do NOT add
 * rungs like `divider-alpha` or `footnote-alpha` — those are uses, not atoms.
 */
export const ALPHA = {
  hairline: 0.10, // --sys-alpha-hairline
  muted:    0.30, // --sys-alpha-muted
  recede:   0.50, // --sys-alpha-recede
  quiet:    0.70, // --sys-alpha-quiet
} as const;

export type AlphaRung = keyof typeof ALPHA;

/** Ordered lightest → heaviest presence. Used by the invariant + guard msg. */
export const ALPHA_ORDER: readonly AlphaRung[] =
  ['hairline', 'muted', 'recede', 'quiet'] as const;

// ─── Helpers — pure, each ≤ 10 LOC ─────────────────────────────────────────

/** Numeric alpha for a named rung. Pure. */
export const alphaOf = (r: AlphaRung): number => ALPHA[r];

/** CSS custom-property reference for a named rung. Pure. */
export const cssVarOf = (r: AlphaRung): string => `var(--sys-alpha-${r})`;

/** Tailwind class fragment (e.g. "opacity-muted"). Pure. */
export const classOf = (r: AlphaRung): string => `opacity-${r}`;

/**
 * Snap an arbitrary 0..1 alpha to the nearest ledger rung. Pure.
 *
 * Used by the migration review to answer "this was `opacity-60`, which
 * rung?" — whichever `snapToRung(0.6)` returns. Ties pick the lower rung
 * (more step-back = more conservative voice).
 */
export function snapToRung(alpha: number): AlphaRung {
  const a = Math.min(1, Math.max(0, alpha));
  const [best] = ALPHA_ORDER.map(
    (r) => [r, Math.abs(ALPHA[r] - a)] as const,
  ).sort(([, da], [, db]) => da - db);
  return best[0];
}

// ─── Invariants — a test can lock these down ───────────────────────────────

/**
 * Must hold: every rung in `ALPHA_ORDER` is in `ALPHA`, values are strictly
 * ascending (lightest → heaviest), every value is in the open interval
 * (0, 1) — because 0 and 1 are Motion's endpoints, not rungs. Pure.
 */
export function alphaInvariantHolds(): boolean {
  if (ALPHA_ORDER.length !== Object.keys(ALPHA).length) return false;
  if (!ALPHA_ORDER.every((r) => r in ALPHA)) return false;
  if (!ALPHA_ORDER.every((r) => ALPHA[r] > 0 && ALPHA[r] < 1)) return false;
  return ALPHA_ORDER.every(
    (r, i) => i === 0 || ALPHA[r] > ALPHA[ALPHA_ORDER[i - 1]],
  );
}

// ─── Allow-list token for explicit exemptions ──────────────────────────────

/**
 * Inline `// alpha-ledger:exempt — <reason>` comment marks a line as an
 * honest exception. The only well-known reason is "motion fade endpoint"
 * (`opacity-0` / `opacity-100` used as transition endpoints, owned by
 * Motion). Reviewer-visible tokens beat invisible drift — same rule as
 * Elevation's ELEVATION_LEDGER_EXEMPT_TOKEN.
 *
 * Usage in source:
 *   return 'opacity-0 translate-y-enter-sm'; // alpha-ledger:exempt — motion fade endpoint
 */
export const ALPHA_LEDGER_EXEMPT_TOKEN = 'alpha-ledger:exempt';

/**
 * Path-allow-list for Motion's endpoint-owning module. This file is the ONE
 * home for `opacity-0` / `opacity-100` without per-line exemption comments.
 * Any other file using those classes must earn an inline exempt token.
 *
 * The adoption test reads this; change it here and the test updates.
 */
export const ALPHA_MOTION_ENDPOINT_PATHS: readonly string[] = [
  'lib/utils/animation-phase.ts',
] as const;
