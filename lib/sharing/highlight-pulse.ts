/**
 * highlight-pulse — the gold-pulse primitive shared by every share gesture.
 *
 * One atom, one primitive, two callers (sender + recipient). The recipient's
 * `scrollToSharedHighlight` lit a paragraph with this exact wash; the sender
 * (the link icon inside `SelectionPopover`) now lights the **same** paragraph
 * at copy-ok via the **same** helper. Symmetry is by construction — the
 * fence in `share-pulse-symmetry.fence.test.ts` keeps it that way.
 *
 * What lives here (single home for each constant):
 *   • `HIGHLIGHT_TINT` — `color-mix(in srgb, var(--gold) 10%, transparent)`.
 *     The thermal mixer warms the wash with the rest of the site; no raw
 *     rgba, no per-caller fork (Tanya UIX §3 — "one source").
 *   • `HIGHLIGHT_TRANSITION` — `background-color 0.3s ease, transform 0.3s
 *     ease`. The 0.3 s tail is the *fade-out* on cleanup; the inbound paint
 *     is instant.
 *   • `pulse-highlight` keyframes — `scale(1.005)` × 2 over 1 s. Sub-pixel
 *     scale; the wash carries the witness, the scale is residue (Tanya
 *     §"room-loud only on failure").
 *   • `PULSE_DWELL_MS` — 3000 ms. Both callers tear down on the same beat.
 *
 * What does NOT live here:
 *   • Lookup. `findTextInDocument` stays in `highlight-finder.ts`; this
 *     primitive operates on a resolved element ref.
 *   • Scroll. The recipient owns scrolling; the sender's quote is already
 *     in viewport (the popover blooms above it).
 *   • Cleanup timer. The caller owns `setTimeout(cleanup, PULSE_DWELL_MS)`
 *     so each call site can compose its own teardown beat (Mike #92 §POI 5).
 *
 * Reduced-motion contract (symmetric):
 *   `reduced=true`  → tint applied + held; scale animation skipped.
 *   `reduced=false` → tint applied + held; scale runs `1s ease-in-out × 2`.
 *
 * Credits: Mike K. (#92 — the napkin: extract the pulse, wire two callers,
 * fence the symmetry; "compose, don't migrate"), Tanya D. (UIX — same gold
 * at both ends, same hold, no chrome on content), Sid (this lift; ≤ 10
 * LOC per helper, idempotent keyframes, caller-owned timer).
 */

/** Inbound: instant. Outbound: 0.3 s tail. Same beat at both call sites. */
export const HIGHLIGHT_TRANSITION =
  'background-color 0.3s ease, transform 0.3s ease';

/** Hold the gold for one breath, then fade through the transition tail. */
export const PULSE_DWELL_MS = 3000;

/**
 * Gold @ 10% via the design-system mixer. The thermal engine repaints the
 * underlying `--gold` token; the wash warms with the room temperature.
 * One literal, one home — `share-pulse-symmetry` fence asserts uniqueness.
 */
export const HIGHLIGHT_TINT =
  'color-mix(in srgb, var(--gold) 10%, transparent)';

const HIGHLIGHT_KEYFRAMES_ID = 'pulse-highlight-keyframes';
const KEYFRAMES_CSS =
  '@keyframes pulse-highlight {' +
  '0%,100% { transform: scale(1); }' +
  '50% { transform: scale(1.005); }' +
  '}';

/** Inject the `pulse-highlight` keyframes once per document. Idempotent. */
function ensurePulseKeyframes(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(HIGHLIGHT_KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = HIGHLIGHT_KEYFRAMES_ID;
  style.textContent = KEYFRAMES_CSS;
  document.head.appendChild(style);
}

/** Snapshot of the element's pre-pulse inline-style values, for cleanup. */
interface StyleSnapshot {
  transition: string;
  backgroundColor: string;
  animation: string;
}

/** Capture the inline-style values the pulse will overwrite. Pure-ish. */
function snapshotStyle(el: HTMLElement): StyleSnapshot {
  return {
    transition: el.style.transition,
    backgroundColor: el.style.backgroundColor,
    animation: el.style.animation,
  };
}

/** Paint the gold tint + (when motion-allowed) run the sub-pixel scale. */
function paintPulse(el: HTMLElement, reduced: boolean): void {
  el.style.transition = HIGHLIGHT_TRANSITION;
  el.style.backgroundColor = HIGHLIGHT_TINT;
  if (!reduced) el.style.animation = 'pulse-highlight 1s ease-in-out 2';
}

/** Restore the element's pre-pulse inline-style values. */
function restoreStyle(el: HTMLElement, snap: StyleSnapshot): void {
  el.style.transition = snap.transition;
  el.style.backgroundColor = snap.backgroundColor;
  el.style.animation = snap.animation;
}

/**
 * Pulse a paragraph element gold. Applies tint immediately, runs the
 * `pulse-highlight` scale (when motion is permitted), and returns a
 * cleanup function the caller schedules at `PULSE_DWELL_MS`.
 *
 * Idempotent across re-entries: a second call re-snapshots, repaints,
 * and the *latest* cleanup wins on teardown.
 *
 * @param el      Paragraph (or other block element) to warm.
 * @param reduced Honor `prefers-reduced-motion`: skip the scale animation.
 * @returns       Cleanup that restores the element's pre-pulse styles.
 */
export function pulseElementGold(
  el: HTMLElement,
  reduced = false,
): () => void {
  ensurePulseKeyframes();
  const snap = snapshotStyle(el);
  paintPulse(el, reduced);
  return () => restoreStyle(el, snap);
}

// ─── Test seam — pure handles for the source-pin / unit tests ─────────────
//
// Exposes the kernel pieces so the unit test can exercise the keyframe
// installer's idempotency, the snapshot/restore round-trip, and the
// reduced-motion fork without standing up a full DOM scene.
export const __testing__ = {
  HIGHLIGHT_KEYFRAMES_ID,
  KEYFRAMES_CSS,
  ensurePulseKeyframes,
  snapshotStyle,
  paintPulse,
  restoreStyle,
} as const;
