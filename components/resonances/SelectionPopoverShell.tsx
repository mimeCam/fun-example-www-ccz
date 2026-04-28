/**
 * SelectionPopoverShell — the floating chrome around the selection actions.
 *
 * One paint, many actions. The shell owns the surface (`var(--token-surface)`),
 * the depth beat (`float`), and the accent halo. Action buttons inside are
 * transparent — no per-button shadow stacking — so adding a sibling action
 * (gem · share · …) does not double-paint the bloom.
 *
 * Lifted from `SelectionPopoverTrigger.tsx` when the share gesture
 * graduated (Mike #39 §3 — wire the orphan, share + resonance ride one
 * popover). Tanya UIX shape: one shell, gap-sys-2 between siblings, the
 * row never re-flows when an action button enters its `settled` phase.
 *
 * Credits: Tanya D. (the two-layer composition — depth + accent halo,
 * `whisper`-shape with `--token-accent` instead of gold; the gap-sys-2
 * row rhythm), Mike K. (the lift; one shell, many actions; preserves
 * "compose, don't migrate"), Sid (≤ 10 LOC per helper, single home for
 * the FLOAT_STYLE literal).
 */
'use client';

import type { ReactNode } from 'react';
import { cssVarOf } from '@/lib/design/elevation';

/* Floating layer = depth (`float`) + accent halo. The two-layer composition
   is Tanya §3.1's call: depth (black) for honest lift, accent halo for the
   thermal personality. Both shadows resolve through the elevation ledger;
   the accent layer mirrors `whisper` shape but pulls the active accent
   instead of gold (popover slot is thermal-aware per §1). */
const ACCENT_HALO =
  '0 0 12px color-mix(in srgb, var(--token-accent) 20%, transparent)';

const SHELL_STYLE = {
  background: 'var(--token-surface)',
  boxShadow: `${cssVarOf('float')}, ${ACCENT_HALO}`,
} as const;

interface ShellProps {
  children: ReactNode;
}

/**
 * Renders the floating popover surface. Children are laid out in a row
 * with `gap-sys-2`; the shell is rounded `sys-full` so the corner radius
 * matches the icon-button's silhouette.
 */
export function SelectionPopoverShell({ children }: ShellProps) {
  return (
    <div
      className="flex items-center gap-sys-2 rounded-sys-full px-sys-2 py-sys-1"
      style={SHELL_STYLE}
    >
      {children}
    </div>
  );
}

// ─── Test seam — pure handles for the per-file SSR pin ─────────────────────
export const __testing__ = { ACCENT_HALO, SHELL_STYLE } as const;
