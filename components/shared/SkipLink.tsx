/**
 * SkipLink — the cold-start handshake. Reader-invariant chrome surface.
 *
 * Closes the published-promise gap at `lib/sharing/trust-copy.ts:43` —
 * the `/trust` page names "The skip-link" as the second of five reader-
 * invariant surfaces. This component is that surface.
 *
 * Contract (the five non-negotiables of a reader-invariant surface, per
 * `lib/design/focus.ts`):
 *   1. Does NOT warm with engagement.     — step-function presence.
 *   2. Does NOT personalize by archetype. — same six words for every reader.
 *   3. Does NOT fork with thermal state.  — copy and paint are byte-stable.
 *   4. Clears WCAG SC 1.4.11.             — focus ring inherits the global
 *                                            two-stop box-shadow at α=0.8.
 *   5. Paints under forced-colors: active — Highlight outline + Canvas/CanvasText
 *                                            (handled by the global
 *                                            `@media (forced-colors: active)`
 *                                            block in `globals.css`).
 *
 * Mounted as the FIRST CHILD of `<body>` in `app/layout.tsx`. A keyboard
 * reader's first Tab keystroke lands here. CSS-only slide-in via the
 * `.sys-skiplink` rule's focused-state transform — no client state, no
 * client component. Tab fires before hydration; the link works pre-
 * hydrate. (Elon §4.4.)
 *
 * No `useRouter`, no JS handoff. Browser default `href="#main-content"`
 * scrolls + focuses the landmark. The `id="main-content"` audit lives in
 * `lib/sharing/__tests__/trust-promise-honored.test.ts` — every route's
 * top-level wrapper carries the id, or the build breaks.
 *
 * Not a ledger. Cardinality-1 systems are named constants. The CSS class
 * `.sys-skiplink` and this 1-component file are the entire surface area.
 *
 * Credits: Mike K. (napkin §"Architecture" — server component, CSS-only
 * slide, mount-as-first-child robustness, the kill-list on a new ledger
 * row), Tanya D. (UX spec §3 / §4 / §5 — the visual posture, the locked
 * copy, the anti-spec discipline), Paul K. (the must-have "cold-start
 * primacy" framing), Elon M. (CSS-only animation pre-hydration; reduced-
 * motion as a tested invariant), Krystle C. (the `FOCUS.*` magic numbers
 * the focus ring inherits).
 */

import type { JSX } from 'react';

// ─── Locked copy — byte-identical for every reader, every page ────────────
//
// // reader-invariant — six words, no period. Identical at score 0 and
// score 100. Identical for every archetype. The string lives at the
// declaration site, not in `voice-ledger.ts` — the lexicon's 5 → 3 fold
// would contradict the contract.
const SKIPLINK_COPY = 'Skip to main content' as const;

// ─── Public API ────────────────────────────────────────────────────────────

export interface SkipLinkProps {
  /** Hash target — must resolve to a real landmark on every route. */
  readonly target: string;
}

// ─── Component — server component, no `'use client'` ─────────────────────

/**
 * The cold-start handshake. Server component; first focusable node after
 * `<body>`. CSS-only slide. The `.sys-skiplink` rule lives in
 * `app/globals.css`; the sync guard is `skip-link-sync.test.ts`.
 *
 * // reader-invariant — no thermal hooks, no archetype reads, no client state.
 */
export function SkipLink({ target }: SkipLinkProps): JSX.Element {
  return (
    <a href={target} className="sys-skiplink" data-sys-skiplink="">
      {SKIPLINK_COPY}
    </a>
  );
}

/** Exported for tests — the locked copy, single source of truth. */
export const SKIPLINK_TEXT = SKIPLINK_COPY;

/** Exported for tests — the CSS class the slide-in rule binds to. */
export const SKIPLINK_CLASS = 'sys-skiplink' as const;
