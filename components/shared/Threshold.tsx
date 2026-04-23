/**
 * Threshold — the visual shell of the ceremony-aware modal primitive.
 *
 * You step through a threshold and the room sets you back down where you
 * were standing. Two presentations, zero new tokens:
 *   • variant="center"        → The Chamber (replaces ThreadKeepsake's shell).
 *   • variant="drawer-right"  → The Side Room (replaces ResonanceDrawer's shell).
 *
 * The primitive owns the invariants (portal, backdrop, ARIA, focus, ESC,
 * scroll-lock, four-state phase machine); the caller owns the chrome of
 * the chamber beyond it. Exit plays a **staggered** choreography —
 * the chamber recedes first; the backdrop dims a beat later; same 150 ms.
 *
 * Credits: Mike K. (headless API + phase machine napkin), Tanya D. (variant
 * shape, a11y polish, staggered-exit cadence), Paul K. (must-haves),
 * Krystle C. (deferred-unmount scope), Jason F. (staggered backdrop idea).
 */

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useThreshold, type ThresholdOptions } from '@/lib/hooks/useThreshold';
import {
  type Phase, type ThresholdVariant,
  resolveChamberAnimationClass, resolveBackdropAnimationClass,
  resolveBackdropStyle, resolveChamberExitStyle,
} from '@/lib/utils/animation-phase';

// ─── Types ─────────────────────────────────────────────────────────────────

export type { ThresholdVariant };

export interface ThresholdProps extends ThresholdOptions {
  /** `id` of the heading inside `children` — wired to aria-labelledby. */
  labelledBy: string;
  /** Optional `id` of a description element — wired to aria-describedby. */
  describedBy?: string;
  /** Visual arrangement. Defaults to `center`. */
  variant?: ThresholdVariant;
  /** Extra className merged onto the chamber surface (caller owns width). */
  className?: string;
  /** Caller-owned body. Three slots are a caller convention, not a prop. */
  children: ReactNode;
}

// ─── Design-system constants (locked — do not parameterise) ────────────────

// alpha-ledger:exempt — motion fade endpoint (reduced-motion baseline at full presence)
const BACKDROP_BASE =
  'fixed inset-0 z-sys-backdrop bg-void/65 backdrop-blur-sm ' +
  'motion-reduce:opacity-100';

const CHAMBER_BASE =
  'relative pointer-events-auto bg-surface/95 backdrop-blur-sm ' +
  'thermal-shadow thermal-radius overflow-hidden';

const CENTER_LAYOUT =
  'fixed inset-0 z-sys-drawer flex items-center justify-center ' +
  'p-sys-6 pointer-events-none';

const DRAWER_LAYOUT =
  'fixed top-0 right-0 bottom-0 z-sys-drawer flex pointer-events-none';

const CENTER_SHAPE = 'w-full max-w-2xl border border-fog/30';
const DRAWER_SHAPE = 'h-full w-full max-w-sm border-l-2 flex flex-col overflow-y-auto';

// ─── Portal host — avoids SSR window reference ─────────────────────────────

function usePortalTarget(): Element | null {
  const [target, setTarget] = useState<Element | null>(null);
  useEffect(() => setTarget(document.body), []);
  return target;
}

// ─── Variant stylers — pure + trivially testable ───────────────────────────

interface ClassCtx {
  phase: Phase;
  variant: ThresholdVariant;
  reduced: boolean;
  extra?: string;
}

function chamberClass(ctx: ClassCtx): string {
  const animation = resolveChamberAnimationClass(ctx.phase, ctx.variant, ctx.reduced);
  const shape = variantShape(ctx.variant);
  return [CHAMBER_BASE, shape, animation, ctx.extra].filter(Boolean).join(' ');
}

function variantShape(variant: ThresholdVariant): string {
  return variant === 'drawer-right' ? DRAWER_SHAPE : CENTER_SHAPE;
}

function layoutClass(variant: ThresholdVariant): string {
  return variant === 'drawer-right' ? DRAWER_LAYOUT : CENTER_LAYOUT;
}

function backdropClass(phase: Phase, reduced: boolean): string {
  const anim = resolveBackdropAnimationClass(phase, reduced);
  return [BACKDROP_BASE, anim].filter(Boolean).join(' ');
}

// ─── Drawer accent spine — reuses thermal-accent CSS var ───────────────────

function drawerAccentStyle(variant: ThresholdVariant): React.CSSProperties | undefined {
  if (variant !== 'drawer-right') return undefined;
  return { borderLeftColor: 'var(--token-accent)' };
}

/** Compose accent + exit styles. Border dissolves first on close. */
function chamberStyle(
  variant: ThresholdVariant,
  phase: Phase,
  reduced: boolean,
): React.CSSProperties | undefined {
  const accent = drawerAccentStyle(variant);
  const exit = resolveChamberExitStyle(phase, reduced);
  if (!accent && !exit) return undefined;
  return { ...accent, ...exit };
}

// ─── The component ─────────────────────────────────────────────────────────

export function Threshold(props: ThresholdProps): JSX.Element | null {
  const api = useThreshold(props);
  const target = usePortalTarget();
  if (api.phase === 'closed' || !target) return null;
  return createPortal(<ThresholdTree api={api} props={props} />, target);
}

// ─── Render tree — split so the outer fn stays ≤10 lines ───────────────────

interface TreeProps {
  api: ReturnType<typeof useThreshold>;
  props: ThresholdProps;
}

function ThresholdTree({ api, props }: TreeProps) {
  const { variant = 'center' } = props;
  return (
    <>
      <Backdrop api={api} />
      <div className={layoutClass(variant)}>
        <Chamber api={api} props={props} />
      </div>
    </>
  );
}

function Backdrop({ api }: { api: ReturnType<typeof useThreshold> }) {
  const cls = backdropClass(api.phase, api.prefersReducedMotion);
  const style = resolveBackdropStyle(api.phase, api.prefersReducedMotion);
  return <div className={cls} style={style} {...api.backdropProps} />;
}

function Chamber({ api, props }: TreeProps) {
  const { variant = 'center', labelledBy, describedBy, className, children } = props;
  const ctx: ClassCtx = {
    phase: api.phase, variant,
    reduced: api.prefersReducedMotion, extra: className,
  };
  return (
    <ChamberSurface api={api} ctx={ctx}
      labelledBy={labelledBy} describedBy={describedBy}>
      {children}
    </ChamberSurface>
  );
}

interface SurfaceProps {
  api: ReturnType<typeof useThreshold>;
  ctx: ClassCtx;
  labelledBy: string;
  describedBy?: string;
  children: ReactNode;
}

function ChamberSurface({
  api, ctx, labelledBy, describedBy, children,
}: SurfaceProps) {
  return (
    <div
      ref={api.containerRef}
      role="dialog" aria-modal="true"
      aria-labelledby={labelledBy} aria-describedby={describedBy}
      tabIndex={-1}
      style={chamberStyle(ctx.variant, ctx.phase, ctx.reduced)}
      className={chamberClass(ctx)}
      onAnimationEnd={api.onChamberAnimationEnd}
    >
      {children}
    </div>
  );
}
