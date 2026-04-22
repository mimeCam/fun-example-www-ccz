/**
 * Pressable — the thermal-aware consent primitive.
 *
 * One button voice for the site. Reads `--token-accent` for focus (via the
 * global `:focus-visible` rule — never overrides). Three variants, two
 * sizes. Disabled tint pulls 35% of the *current* accent into mist, so it
 * stays native to the room's temperature.
 *
 * Variants (locked — triggers design review to extend):
 *   • solid  — primary consent ("yes, proceed")
 *   • ghost  — secondary consent ("not now")
 *   • icon   — silent action (close, save)
 *
 * asChild: cloneElement-based Slot. The child becomes the rendered element
 * (useful when the trigger is semantically a `<Link>` or another native tag).
 * Child is responsible for being interactive; we do not promote `<div>` to
 * button role. Pressable merges className, style, ref, and event handlers.
 *
 * Credits: Mike K. (napkin + LOC budget), Tanya D. (variant surface spec,
 * disabled tint, press choreography), Krystle C. (primitive scope + migration
 * order), Jason F. (focus=thermal reassignment), Elon M. (contrast gate,
 * shared-easing-not-shared-duration correction), Paul K. (acceptance §9).
 */

'use client';

import {
  cloneElement, forwardRef, isValidElement,
  type ButtonHTMLAttributes, type CSSProperties,
  type ForwardedRef, type MouseEventHandler, type ReactElement,
  type ReactNode, type Ref,
} from 'react';
import {
  type PressVariant, type PressSize,
  composePressableClass, resolvePressStyle,
} from '@/lib/utils/press-phase';
import { usePressPhase } from '@/lib/hooks/usePressPhase';

// ─── Public API ────────────────────────────────────────────────────────────

export type { PressVariant, PressSize };

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'style' | 'children'
>;

export interface PressableProps extends NativeButtonProps {
  /** Visual + semantic intent. Default `solid`. */
  variant?: PressVariant;
  /** Density. Default `md`. `icon` variant ignores this (square). */
  size?: PressSize;
  /** Clone handlers/style onto the sole child instead of rendering <button>. */
  asChild?: boolean;
  /** Extra className appended after the variant recipe. */
  className?: string;
  /** Inline styles merged after the phase-machine transform. */
  style?: CSSProperties;
  children: ReactNode;
}

// ─── The component ────────────────────────────────────────────────────────

export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(
  function Pressable(props, ref) {
    const { asChild, ...rest } = props;
    if (asChild) return <PressableSlot {...rest} forwardedRef={ref} />;
    return <PressableButton {...rest} forwardedRef={ref} />;
  },
);

// ─── Native <button> path — the common case ───────────────────────────────

interface InternalProps extends Omit<PressableProps, 'asChild'> {
  forwardedRef: ForwardedRef<HTMLButtonElement>;
}

function PressableButton(props: InternalProps): JSX.Element {
  const { variant = 'solid', size = 'md', disabled = false } = props;
  const { phase, reduced, handlers } = usePressPhase(disabled);
  const style = mergeStyles(resolvePressStyle(phase, variant, reduced), props.style);
  const className = composePressableClass({
    variant, size, disabled, extra: props.className,
  });
  return renderButton(props, { className, style, disabled, handlers });
}

interface ButtonRender {
  className: string;
  style: CSSProperties | undefined;
  disabled: boolean;
  handlers: ReturnType<typeof usePressPhase>['handlers'];
}

function renderButton(props: InternalProps, r: ButtonRender): JSX.Element {
  return (
    <button
      {...stripManaged(props)}
      ref={props.forwardedRef}
      type={props.type ?? 'button'}
      disabled={r.disabled}
      className={r.className}
      style={r.style}
      {...r.handlers}
    />
  );
}

/** Drop props we render explicitly so they don't clobber the merged output. */
function stripManaged(props: InternalProps): NativeButtonProps {
  const {
    variant: _v, size: _s, forwardedRef: _r,
    className: _c, style: _st, disabled: _d, type: _t,
    ...rest
  } = props;
  return rest;
}

// ─── asChild path — in-house Slot (~30 LOC) ───────────────────────────────

function PressableSlot(props: InternalProps): JSX.Element | null {
  const { children, variant = 'solid', size = 'md', disabled = false } = props;
  const { phase, reduced, handlers } = usePressPhase(disabled);
  if (!isValidElement(children)) return null;
  const pressStyle = resolvePressStyle(phase, variant, reduced);
  const cloned = buildSlotProps(
    children.props as SlotChildProps,
    { variant, size, disabled, props, pressStyle, handlers },
  );
  return cloneElement(children as ReactElement<SlotChildProps>, cloned);
}

interface SlotCtx {
  variant: PressVariant;
  size: PressSize;
  disabled: boolean;
  props: InternalProps;
  pressStyle: CSSProperties | undefined;
  handlers: ReturnType<typeof usePressPhase>['handlers'];
}

function buildSlotProps(child: SlotChildProps, c: SlotCtx): Partial<SlotChildProps> {
  return {
    className: mergeClassNames(
      composePressableClass({ variant: c.variant, size: c.size, disabled: c.disabled, extra: c.props.className }),
      child.className,
    ),
    style: mergeStyles(c.pressStyle, { ...c.props.style, ...child.style }),
    ref: c.props.forwardedRef as unknown as Ref<unknown>,
    ...mergeHandlers(child, c.handlers, c.props.onClick),
    'aria-disabled': c.disabled || undefined,
  };
}

// ─── Merge utilities — pure, 2-3 LOC each ─────────────────────────────────

interface SlotChildProps {
  className?: string;
  style?: CSSProperties;
  'aria-disabled'?: boolean;
  ref?: Ref<unknown>;
  onClick?: MouseEventHandler<HTMLElement>;
  onPointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerLeave?: () => void;
  onPointerCancel?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLElement>) => void;
  onBlur?: () => void;
}

function mergeClassNames(a?: string, b?: string): string {
  return [a, b].filter(Boolean).join(' ');
}

function mergeStyles(
  a?: CSSProperties,
  b?: CSSProperties,
): CSSProperties | undefined {
  if (!a && !b) return undefined;
  return { ...a, ...b };
}

function mergeHandlers(
  child: SlotChildProps,
  ours: ReturnType<typeof usePressPhase>['handlers'],
  ownClick?: MouseEventHandler<HTMLElement>,
): Partial<SlotChildProps> {
  return {
    ...mergePointerHandlers(child, ours),
    ...mergeKeyHandlers(child, ours),
    onBlur: chainVoid(child.onBlur, ours.onBlur),
    onClick: chain(child.onClick, ownClick),
  };
}

function mergePointerHandlers(
  child: SlotChildProps,
  ours: ReturnType<typeof usePressPhase>['handlers'],
): Partial<SlotChildProps> {
  return {
    onPointerDown: chain(child.onPointerDown, ours.onPointerDown),
    onPointerUp: chain(child.onPointerUp, ours.onPointerUp),
    onPointerLeave: chainVoid(child.onPointerLeave, ours.onPointerLeave),
    onPointerCancel: chainVoid(child.onPointerCancel, ours.onPointerCancel),
  };
}

function mergeKeyHandlers(
  child: SlotChildProps,
  ours: ReturnType<typeof usePressPhase>['handlers'],
): Partial<SlotChildProps> {
  return {
    onKeyDown: chain(child.onKeyDown, ours.onKeyDown),
    onKeyUp: chain(child.onKeyUp, ours.onKeyUp),
  };
}

function chain<T extends unknown[]>(
  a?: (...args: T) => void,
  b?: (...args: T) => void,
): ((...args: T) => void) | undefined {
  if (!a && !b) return undefined;
  return (...args: T) => { a?.(...args); b?.(...args); };
}

function chainVoid(
  a?: () => void,
  b?: () => void,
): (() => void) | undefined {
  if (!a && !b) return undefined;
  return () => { a?.(); b?.(); };
}
