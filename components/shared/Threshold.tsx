/**
 * Threshold — the visual shell of the ceremony-aware modal primitive.
 *
 * You step through a threshold and the room sets you back down where you
 * were standing. Two presentations, zero new tokens:
 *   • variant="center"        → The Chamber (replaces ThreadKeepsake's shell).
 *   • variant="drawer-right"  → The Side Room (replaces ResonanceDrawer's shell).
 *
 * The primitive owns the invariants (portal, backdrop, ARIA, focus, ESC,
 * scroll-lock); the caller owns the chrome of the chamber beyond it.
 *
 * Credits: Mike K. (headless API), Tanya D. (variant shape + a11y polish),
 * Paul K. (must-haves), Krystle C. (original scope). See AGENTS.md.
 */

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useThreshold, type ThresholdOptions } from '@/lib/hooks/useThreshold';

// ─── Types ─────────────────────────────────────────────────────────────────

export type ThresholdVariant = 'center' | 'drawer-right';

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

const BACKDROP_CLASS =
  'fixed inset-0 z-sys-backdrop bg-void/65 backdrop-blur-sm ' +
  'motion-safe:animate-fade-in motion-reduce:opacity-100';

const CHAMBER_BASE =
  'relative pointer-events-auto bg-surface/95 backdrop-blur-sm ' +
  'thermal-shadow thermal-radius overflow-hidden';

const CENTER_LAYOUT =
  'fixed inset-0 z-sys-drawer flex items-center justify-center ' +
  'p-sys-6 pointer-events-none';

const DRAWER_LAYOUT =
  'fixed top-0 right-0 bottom-0 z-sys-drawer flex pointer-events-none';

// ─── Portal host — avoids SSR window reference ─────────────────────────────

function usePortalTarget(): Element | null {
  const [target, setTarget] = useState<Element | null>(null);
  useEffect(() => setTarget(document.body), []);
  return target;
}

// ─── Variant stylers — pure + trivially testable ───────────────────────────

function chamberClass(
  variant: ThresholdVariant,
  prefersReducedMotion: boolean,
  extra?: string,
): string {
  const entrance = entranceClass(variant, prefersReducedMotion);
  const shape = variantShape(variant);
  return [CHAMBER_BASE, shape, entrance, extra].filter(Boolean).join(' ');
}

function entranceClass(variant: ThresholdVariant, reduced: boolean): string {
  if (reduced) return 'motion-safe:animate-fade-in';
  if (variant === 'drawer-right') return 'animate-slide-in-right';
  return 'animate-fade-in';
}

function variantShape(variant: ThresholdVariant): string {
  if (variant === 'drawer-right') return DRAWER_SHAPE;
  return CENTER_SHAPE;
}

const CENTER_SHAPE =
  'w-full max-w-2xl border border-fog/30';

const DRAWER_SHAPE =
  'h-full w-full max-w-sm border-l-2 ' +
  'flex flex-col overflow-y-auto';

function layoutClass(variant: ThresholdVariant): string {
  return variant === 'drawer-right' ? DRAWER_LAYOUT : CENTER_LAYOUT;
}

// ─── Drawer accent spine — reuses thermal-accent CSS var ───────────────────

function drawerAccentStyle(variant: ThresholdVariant): React.CSSProperties | undefined {
  if (variant !== 'drawer-right') return undefined;
  return { borderLeftColor: 'var(--token-accent)' };
}

// ─── The component ─────────────────────────────────────────────────────────

export function Threshold(props: ThresholdProps): JSX.Element | null {
  const { isOpen, labelledBy, describedBy, variant = 'center',
          className, children } = props;
  const api = useThreshold(props);
  const target = usePortalTarget();

  if (!isOpen || !target) return null;

  return createPortal(
    <ThresholdTree
      api={api}
      variant={variant}
      labelledBy={labelledBy}
      describedBy={describedBy}
      className={className}
    >
      {children}
    </ThresholdTree>,
    target,
  );
}

// ─── Render tree — split so the outer fn stays ≤10 lines ───────────────────

interface TreeProps {
  api: ReturnType<typeof useThreshold>;
  variant: ThresholdVariant;
  labelledBy: string;
  describedBy?: string;
  className?: string;
  children: ReactNode;
}

function ThresholdTree({
  api, variant, labelledBy, describedBy, className, children,
}: TreeProps) {
  return (
    <>
      <div className={BACKDROP_CLASS} {...api.backdropProps} />
      <div className={layoutClass(variant)}>
        <Chamber
          api={api} variant={variant}
          labelledBy={labelledBy} describedBy={describedBy}
          className={className}
        >
          {children}
        </Chamber>
      </div>
    </>
  );
}

interface ChamberProps extends Omit<TreeProps, 'api'> {
  api: ReturnType<typeof useThreshold>;
}

function Chamber({
  api, variant, labelledBy, describedBy, className, children,
}: ChamberProps) {
  return (
    <div
      ref={api.containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      tabIndex={-1}
      style={drawerAccentStyle(variant)}
      className={chamberClass(variant, api.prefersReducedMotion, className)}
    >
      {/* the chamber beyond the threshold */}
      {children}
    </div>
  );
}
