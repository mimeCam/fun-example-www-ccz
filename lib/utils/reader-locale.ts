/**
 * Reader-Locale Substrate — every reader-facing date renders in the
 * reader's OS locale.
 *
 * The site does not get to choose what month it is for the reader.
 * Three named flavors cover the entire reader-facing footprint:
 *
 *   formatReaderShortDate("2026-04-25") → "Apr 25"   (en-US)
 *                                       → "25 Apr"   (en-GB)
 *                                       → "4月25日"   (ja-JP)
 *
 *   formatReaderMonthDay("2026-04-25")  → "April 25"  (en-US)
 *                                       → "25 April"  (en-GB)
 *
 *   formatReaderLongDate("2026-04-25")  → "April 25, 2026" (en-US)
 *                                       → "25 April 2026"  (en-GB)
 *
 * Each flavor delegates to a private `format()` core that calls
 * `new Intl.DateTimeFormat(undefined, options)`. The first arg is
 * ALWAYS `undefined` — never a string literal. `undefined` defers to
 * the runtime's full resolution chain (page <html lang> → OS), works
 * server-side, and honors the printer's locale on paper.
 *
 * Why named flavors and not a single `format(iso, opts)` function:
 *   declarative call sites (`formatReaderShortDate(iso)`), zero
 *   options-surface drift, mirrors `formatReadingTime` in this folder.
 *   Polymorphism via a discriminated `kind` arg would be a maze for
 *   future readers. Adding a 4th flavor is the day a surface needs it,
 *   not before.
 *
 * Why the literal `en-US` is named in this docstring:
 *   To name the forbidden default in the only file allowed to know
 *   about it. The substrate's centrality guard is comment-blind, so
 *   this docstring legitimately says the words it forbids elsewhere.
 *   Same idiom as `lib/utils/read-progress.ts` naming `min read` in
 *   its JSDoc to document the rule. Don't force docstrings to invent
 *   euphemisms — that ages worse than the guard.
 *
 * Reader-invariant carve-out:
 *   `lib/sharing/thread-render.ts` formats an ISO date for the keepsake
 *   SVG. That artifact is *reader-invariant* (a shared snapshot must
 *   render byte-identically for every viewer), so it is exempt — see
 *   the `// reader-invariant: locale-independent` marker on its
 *   `formatDate()` helper.
 *
 * Credits:
 *   • Mike K. (architect #76) — the napkin plan, three-flavor public
 *     surface, substrate location next to `reading-time.ts`, copy-from-
 *     promise-guard rule, LOC budget, drift-site mapping.
 *   • Tanya D. (UIX #2) — the on-screen behavior of "the date that bows":
 *     no animation, no toast, no badge, no negotiation. The substrate
 *     ships invisible work.
 *   • Krystle Clear (referenced via Mike) — original substrate-plus-
 *     guard shape, drift-site teardown, the keepsake SVG carve-out.
 *   • Jason F. (referenced via Mike) — the renamed exemption marker
 *     `// reader-invariant: locale-independent`, the substrate-self-
 *     assertion that pins the substrate from secretly locking a locale.
 *   • Paul K. (referenced via Mike) — "CI failures name the promise,
 *     not the rule"; the standing operating principle this substrate
 *     and its guard execute against.
 *
 * Lineage: copy-job from `lib/utils/reading-time.ts` (named flavors)
 * + `lib/utils/__tests__/promise-centrality-guard.test.ts` (the perimeter).
 * No new tooling. No new dependency. Reuse, not invention.
 */

/** Options for the long-form, year-bearing flavor. */
const LONG_OPTIONS: Intl.DateTimeFormatOptions = { dateStyle: 'long' };

/** Options for the month + day, no year. Used in letter sign-offs. */
const MONTH_DAY_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'long',
  day: 'numeric',
};

/** Options for the whisper short form. Used in micro-meta lines. */
const SHORT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
};

/**
 * Private core. Validates the ISO string and defers to the runtime's
 * locale resolution chain via `undefined`. Returns `''` on bad input —
 * the substrate never throws on a malformed publishedAt.
 */
function format(iso: string | undefined | null, options: Intl.DateTimeFormatOptions): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, options).format(d);
}

/**
 * "Apr 25" / "25 Apr" / "4月25日" — the whisper short form for ambient
 * meta lines. No year. Use this on the Mirror MetaLine and any other
 * surface where compactness matters more than the year.
 */
export function formatReaderShortDate(iso: string | undefined | null): string {
  return format(iso, SHORT_OPTIONS);
}

/**
 * "April 25" / "25 April" — the long-month-no-year form. Use this on
 * letter sign-offs and other surfaces where the month wants to be
 * spelled out but the year would feel bureaucratic.
 */
export function formatReaderMonthDay(iso: string | undefined | null): string {
  return format(iso, MONTH_DAY_OPTIONS);
}

/**
 * "25 April 2026" / "April 25, 2026" — the print-grade long form.
 * Use this on paper provenance and any surface where the year is part
 * of the artifact's permanence.
 */
export function formatReaderLongDate(iso: string | undefined | null): string {
  return format(iso, LONG_OPTIONS);
}
