/**
 * action-receipt-allowlist — single source of truth for the canonical
 * receipt-bearing JSX hosts the `action-receipt-fence` keys against.
 *
 * A "receipt-bearing host" is a JSX primitive whose press-side semantics
 * end with a settled-state acknowledgement that lands in two organs at
 * once (visible delta + screen-reader peer) sourced from one statement —
 * OR whose receipt IS the route change (link-shaped hosts). Two physics,
 * one set; no ninth ledger. Six entries, all named in `AGENTS.md` Design
 * Rules and pinned to a kernel file:
 *
 *   • `ActionPressable`  — the canonical fingertip witness (Mike #26 §3,
 *                          Tanya UX §5; `components/shared/ActionPressable.tsx`).
 *   • `Pressable`        — the consent primitive ActionPressable wraps;
 *                          its press-phase machine IS the receipt edge
 *                          (`components/shared/Pressable.tsx`).
 *   • `Toast`            — the room-voice receipt for non-fingertip
 *                          actions (`components/shared/Toast.tsx`).
 *   • `TextLink`         — the link primitive whose receipt is the route
 *                          (`components/shared/TextLink.tsx`).
 *   • `Link` / `NextLink` — `next/link` aliases; same route-is-receipt
 *                          contract.
 *
 * Capitalized custom components NOT in this set are presumed to bottom
 * out on one of these primitives — the fence walks recursively, so the
 * leaf catches the silent button regardless of intermediate composition
 * (Mike napkin §6 — kernel-first, not AST). When that bottom-out is
 * intentionally absent (a navigation `<a>`, an off-screen `<form>`),
 * the call site carries `// receipt-opt-out: <reason>` on the handler
 * line — `OPT_OUT_TOKEN` is the only legal escape hatch.
 *
 * Allowlist edits require a code-review checklist item: *does this host
 * implement the `ActionPressable`-shape phase + SR peer pair?* If not,
 * decline the addition. Two paths in, one path out — no backdoors.
 *
 * Pure data. No imports. No side effects. ≤ 40 LoC by construction.
 *
 * Credits: Mike K. (architect napkin #94 §3 — kernel + axes + allowlist
 * shape, "no ninth ledger" framing, the rule-of-three guard on kernel
 * extension, the failure-prose-as-product principle); Tanya D. (UX #54
 * §0 + §7 — two-rule doctrine, the "canonical: ActionPressable" /
 * "canonical: LeanArrow" pinning, the "no toast for fingertip-local
 * actions" disambiguation that keeps Toast on the room-voice side);
 * Paul K. + Elon M. (via Mike #94 — the punch-list-to-multiplier
 * trim that scoped this allowlist to six entries instead of fifteen);
 * the `_jsx-fence-walker.ts` kernel (the transport layer this allowlist
 * informs without owning).
 */

// ─── The set ─────────────────────────────────────────────────────────────

/**
 * The six canonical hosts. Order is not load-bearing; sort by name for
 * stable failure prose. Frozen in array form so the fence can iterate
 * once and so future docs can render the list verbatim.
 */
export const RECEIPT_BEARING_HOSTS: readonly string[] = Object.freeze([
  'ActionPressable',
  'Link',
  'NextLink',
  'Pressable',
  'TextLink',
  'Toast',
]);

/** Set form for O(1) lookup at the fence's hot loop. */
export const RECEIPT_BEARING_HOST_SET: ReadonlySet<string> =
  new Set<string>(RECEIPT_BEARING_HOSTS);

// ─── Predicates ──────────────────────────────────────────────────────────

/** True iff the JSX host name is a canonical receipt-bearing primitive. */
export function isAllowlistedHost(name: string): boolean {
  return RECEIPT_BEARING_HOST_SET.has(name);
}

/**
 * True iff the host name is a custom React component (Capitalized first
 * char) — the fence presumes these compose down to an allowlisted leaf
 * and lets the recursive walker catch the bottom. Lowercase hosts
 * (`button`, `div`, `span`, `a`, `form`) are raw DOM and fail without
 * an explicit opt-out comment.
 */
export function isCustomComponent(name: string): boolean {
  if (name.length === 0) return false;
  const first = name.charCodeAt(0);
  return first >= 65 && first <= 90; // 'A'..'Z'
}

// ─── Opt-out ledger token ────────────────────────────────────────────────

/**
 * The one legal escape hatch — `// receipt-opt-out: <reason>` on the
 * same source line as the handler attribute. The reason is captured
 * for review (printed in the failure body when an opt-out shadows a
 * later violation), never asserted. Abuse is visible at a glance.
 */
export const OPT_OUT_TOKEN = 'receipt-opt-out:';
