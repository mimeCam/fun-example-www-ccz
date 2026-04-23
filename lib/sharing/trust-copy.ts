/**
 * Trust copy — the reader-invariant /trust page's single string export.
 *
 * Three plainspoken sentences, no metaphors, no "poetry." Followed by a
 * five-entry list of the invariant surfaces the reader can see or feel.
 *
 * Archetype-invariant by construction. The 5 → 3 lexicon fold in
 * `lib/sharing/reply-lexicon.ts` is EXPLICITLY SKIPPED here — the page
 * itself is reader-invariant; warming the copy per archetype would
 * contradict the room. One voice. One surface. Tanya #76 §10.
 *
 * List discipline (Tanya #76 §10):
 *   • Exactly five entries today. NOT six. If a sixth invariant surface
 *     ships, it REPLACES an entry — the list does not grow. A growing list
 *     becomes a feature log, which is the "cold-spine-as-named-doctrine"
 *     failure mode Elon flagged.
 *   • Each entry names a surface the reader can verify with their own eyes
 *     or keyboard. No dev-hygiene items (`// reader-invariant` tag, test
 *     modules). Those live in code, never surface.
 *
 * Credits: Tanya D. (UX spec #76 §10 — copy shape, list cap, meta-loop close),
 * Paul K. (the "published fence" business instinct that motivated the list),
 * Elon M. (the "page must BE cold, not TALK about cold" discipline — the
 * three-sentence cap, the rejection of "manifesto" register).
 */

/** Three-sentence opening. Plainspoken. Receipt, not manifesto. */
export const TRUST_HEADLINE = 'On Trust' as const;

export const TRUST_PARAGRAPH: readonly string[] = [
  'Some parts of this site never read you.',
  'They look the same for everyone, every time.',
  'That is on purpose.',
] as const;

/**
 * Five invariant surfaces. Each string names a reader-verifiable thing.
 * The tuple type locks cardinality at exactly five — a sixth entry fails
 * the type check, enforcing Tanya §10's "list does not grow" rule.
 */
export const TRUST_INVARIANTS: readonly [string, string, string, string, string] = [
  'The focus ring',
  'The skip-link',
  'The share envelope’s left rule',
  'The thread keepsake’s timestamp',
  'This page',
];

/** Compile-time guard: cardinality must be exactly 5. */
export function invariantCount(): number {
  return TRUST_INVARIANTS.length;
}
