/**
 * ActionPressable — fingertip-local "I heard you" for async actions.
 *
 * Wraps `<Pressable variant="ghost">` and adds the success affordance:
 * during `settled` the action glyph swaps to `<CheckIcon>` and the verb
 * shifts to past tense (Copy → Copied, Save → Saved, Link → Copied) for
 * ~1200 ms, then the button quietly returns to `idle`.
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
 * Credits: Mike K. (napkin §4 — compose-only primitive, two-layer split,
 * `phase` prop), Tanya D. (UX §5 — icon swap, verb tense, color =
 * text-foreground only, no shadow/scale/chromatic aberration), Krystle C.
 * (original spec — primary excluded, fail-quiet covenant), Elon M.
 * (mechanical-vs-semantic split), Sid (this lift — single home).
 */

'use client';

import { Pressable } from '@/components/shared/Pressable';
import { CheckIcon } from '@/components/shared/Icons';
import {
  type ActionPhase,
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
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ActionPressable(props: ActionPressableProps): JSX.Element {
  const { phase, reduced } = props;
  return (
    <Pressable
      variant="ghost"
      size="sm"
      onClick={props.onClick}
      disabled={phase === 'busy'}
      aria-label={props.hint}
      title={props.hint}
      className={mergeClass('gap-sys-2', props.className)}
    >
      <PhaseGlyph phase={phase} reduced={reduced} idle={props.icon} />
      <PhaseLabel
        phase={phase} reduced={reduced}
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

// ─── Tiny utility ──────────────────────────────────────────────────────────

function mergeClass(a: string, b?: string): string {
  return b ? `${a} ${b}` : a;
}
