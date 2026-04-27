/**
 * ActionPressable — fingertip-local "I heard you" for async actions.
 *
 * Wraps `<Pressable>` (default `variant="ghost" size="sm"`) and adds the
 * success affordance: during `settled` the action glyph swaps to
 * `<CheckIcon>` and the verb shifts to past tense (Copy → Copied, Save →
 * Saved, Link → Copied, Share → Shared) for ~1000 ms, then the button
 * quietly returns to `idle`. Primary CTAs opt into the same witness via
 * `variant="solid" size="md"` — same phase machine, same SR peer, same
 * width-disciplined bounding box (Mike #26 §3 / Tanya #81 §5).
 *
 * Compose-only primitive (Mike §6.2):
 *   • mechanical (down/release) → `<Pressable>` (untouched)
 *   • semantic   (work succeeded) → owned by `useActionPhase` at the call
 *     site; *this* component is presentational and stateless.
 *
 * Caller pattern:
 *   const slot = useActionPhase(busy);
 *   <ActionPressable phase={slot.phase} reduced={slot.reduced} … />
 *   // …after the awaitable resolves:
 *   slot.pulse(ok);
 *
 * Width discipline (Tanya §6): the bounding box does not move across the
 * four phases. Past-tense labels are within ±1 ch of their idle siblings.
 *
 * Single grep-able home for the affordance. Future async surfaces
 * (ReadersMark, subscribe buttons, etc.) adopt by swapping in this
 * component plus its hook — no per-call-site choreography.
 *
 * Stereo at the fingertip (Mike #71 / Tanya #89): a third inner peer
 * `<PhaseAnnouncement>` mounts an `sr-only aria-live="polite"` span on
 * the `idle → settled` edge so a screen-reader receives the same word
 * the eye sees, sourced from the same `resolvePhaseLabel`. Zero pixels,
 * zero new layers — the receipt lands in two organs from one source.
 *
 * Credits: Mike K. (napkin §4 — compose-only primitive, two-layer split,
 * `phase` prop; #71 — `PhaseAnnouncement` peer, same-source rule; #26 §3 —
 * `variant` pass-through is presentational, semantic layer untouched),
 * Tanya D. (UX §5 — icon swap, verb tense, color = text-foreground only,
 * no shadow/scale/chromatic aberration; #89 — fingertip receipt covenant
 * with no new visible stage; #81 §5 — primary CTA is not exempt from the
 * fingertip witness), Krystle C. (original spec — primary excluded,
 * fail-quiet covenant, byte-identity wiring), Elon M. (mechanical-vs-
 * semantic split, what-we-actually-own physics; #26 §4 — extend, do not
 * sibling), Sid (this lift — single home; this round — primary CTA opt-in
 * via variant pass-through, no new primitive).
 */

'use client';

import { Pressable, type PressVariant, type PressSize } from '@/components/shared/Pressable';
import { CheckIcon } from '@/components/shared/Icons';
import {
  type ActionPhase,
  announceOnSettle,
  resolvePhaseLabel, resolveSwapStyle, showsCheck,
} from '@/lib/utils/action-phase';

// ─── Public API ────────────────────────────────────────────────────────────

export interface ActionPressableProps {
  onClick: () => void;
  /** Composed phase from `useActionPhase`. Owned by the call site. */
  phase: ActionPhase;
  /** Live reduced-motion flag (from `useActionPhase`). */
  reduced: boolean;
  /** The idle-state glyph. CheckIcon swaps in during `settled`. */
  icon: JSX.Element;
  /** Idle verb. Tanya §5.2 — single word; matches secondary-row siblings. */
  idleLabel: string;
  /** Past-tense witness verb (`Copied` / `Saved`). Within ±1 ch of idle. */
  settledLabel: string;
  /** Long-form name surfaced via `aria-label` and `title`. */
  hint: string;
  /** Extra className appended to the Pressable. */
  className?: string;
  /**
   * Visual variant pass-through to `<Pressable>`. Default `'ghost'`
   * preserves the secondary-row look. `'solid'` is for primary CTAs that
   * need the same fingertip witness — same gold skin, same check swap,
   * same hold (Mike #26 §3 / Tanya #81 §5). `'icon'` intentionally stays
   * gated: icon-only buttons rarely have a verb to past-tense flip.
   */
  variant?: PressVariant;
  /**
   * Density pass-through. Default `'sm'` matches the secondary-row siblings;
   * `'md'` is the primary-CTA tap target (Tanya #81 §6 — 48pt earned by the
   * inner `<Pressable>` size resolver, no per-call-site math).
   */
  size?: PressSize;
  /**
   * Visible-label discipline. Default `'visible'` paints `<PhaseLabel>` next
   * to the glyph (the secondary-row pattern). `'hidden'` omits the visible
   * label entirely — for icon-only call sites that paint the verb in an
   * external tooltip (ShareOverlay's icon row, Mike #100 §5 path A). The
   * SR receipt still lands via `<PhaseAnnouncement>`; `aria-label={hint}`
   * carries the static name, so the witness reaches both organs without a
   * double-paint of the verb in the icon row. (Tanya UIX #99 §6 path A.)
   */
  labelMode?: 'visible' | 'hidden';
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ActionPressable(props: ActionPressableProps): JSX.Element {
  const { phase, reduced, variant = 'ghost', size = 'sm', labelMode = 'visible' } = props;
  return (
    <Pressable
      variant={variant}
      size={size}
      onClick={props.onClick}
      disabled={phase === 'busy'}
      aria-label={props.hint}
      title={props.hint}
      className={mergeClass('gap-sys-2', props.className)}
    >
      <PhaseGlyph phase={phase} reduced={reduced} idle={props.icon} />
      {labelMode === 'visible' && (
        <PhaseLabel
          phase={phase} reduced={reduced}
          idle={props.idleLabel} settled={props.settledLabel}
        />
      )}
      <PhaseAnnouncement
        phase={phase}
        idle={props.idleLabel} settled={props.settledLabel}
      />
    </Pressable>
  );
}

// ─── Inner — glyph swap layer ──────────────────────────────────────────────

interface PhaseGlyphProps {
  phase: ActionPhase;
  reduced: boolean;
  idle: JSX.Element;
}

function PhaseGlyph({ phase, reduced, idle }: PhaseGlyphProps): JSX.Element {
  const showCheck = showsCheck(phase);
  return (
    <span
      key={showCheck ? 'check' : 'idle'}
      className="inline-flex motion-safe:animate-fade-in"
      style={resolveSwapStyle(phase, reduced)}
    >
      {showCheck ? <CheckIcon size={14} /> : idle}
    </span>
  );
}

// ─── Inner — label swap layer ──────────────────────────────────────────────

interface PhaseLabelProps {
  phase: ActionPhase;
  reduced: boolean;
  idle: string;
  settled: string;
}

function PhaseLabel({ phase, reduced, idle, settled }: PhaseLabelProps): JSX.Element {
  const text = resolvePhaseLabel(phase, idle, settled);
  return (
    <span
      key={phase}
      className="motion-safe:animate-fade-in"
      style={resolveSwapStyle(phase, reduced)}
    >
      {text}
    </span>
  );
}

// ─── Inner — SR-only fingertip receipt (Tanya #89 §5 / Mike #71 §4.2) ──────

interface PhaseAnnouncementProps {
  phase: ActionPhase;
  idle: string;
  settled: string;
}

/**
 * Stereo without a new stage: a polite live region that mounts only on
 * `settled` and sources its text from the same `resolvePhaseLabel` the
 * visible label uses. Byte-identical paint and voice by construction —
 * drift is impossible unless a future contributor adds a deliberate
 * second call site (Mike §6.1: same-source rule is load-bearing).
 *
 * Mount-on-settled / unmount-on-idle is the firing edge — the live node
 * appears with the witness and is removed before another press can land,
 * which is what gives us the once-per-settle covenant Tanya §5.1 names.
 *
 * Reduced-motion-immune: this paints zero pixels, so there is no fade
 * to collapse — the witness lands intact (Tanya §6.2). Quiet-zone-immune
 * by mount location: page-scope `ToastHost` is muffled during the
 * keepsake reveal; the fingertip receipt is local, so it still fires —
 * the press *just* happened, this is its receipt (Tanya §4.3).
 */
function PhaseAnnouncement(p: PhaseAnnouncementProps): JSX.Element | null {
  if (!announceOnSettle(p.phase)) return null;
  const text = resolvePhaseLabel(p.phase, p.idle, p.settled);
  return (
    <span className="sr-only" aria-live="polite" aria-atomic="true">
      {text}
    </span>
  );
}

// ─── Tiny utility ──────────────────────────────────────────────────────────

function mergeClass(a: string, b?: string): string {
  return b ? `${a} ${b}` : a;
}
