/**
 * ThreadMode — the driver's three postures, resolved from accessibility.
 *
 * Reduced-motion is a *mode*, not an if-else sprinkled through the driver
 * and its consumers. Three postures, one resolver:
 *
 *   smooth — RAF-driven tween; sub-pixel. Default.
 *   snap   — write raw depth every tick; no tween. prefers-reduced-motion.
 *   off    — driver parks; depth stays at its last snap point. Reserved
 *            for an explicit opt-out (not wired to any OS signal today).
 *
 * The value of this tiny module is that every subscriber reads the same
 * `ThreadMode` string — no one forks "is reduced-motion?" logic per site.
 *
 * Credits: Mike K. (napkin §5.4 — "reduced-motion is a mode, not an
 * if-else"; three-posture surface), Tanya D. (UIX spec #81 §5 — the
 * Thread must stay gated the same way under reduced-motion).
 */

/** Three postures the ThreadDriver can operate in. Ordered loudest → quietest. */
export type ThreadMode = 'smooth' | 'snap' | 'off';

/** The canonical default — used by SSR and before subscription lands. */
export const DEFAULT_MODE: ThreadMode = 'smooth';

/**
 * Resolve mode from the OS-level reduced-motion flag. Pure, ≤ 10 LOC.
 *
 * `off` is not reachable from the OS signal — it's reserved for a future
 * explicit reader opt-out (e.g. a per-archetype quiet toggle). Keeping
 * it in the union means subscribers already branch on three values and
 * won't need a refactor when that opt-out lands.
 */
export function resolveMode(prefersReducedMotion: boolean): ThreadMode {
  return prefersReducedMotion ? 'snap' : 'smooth';
}

/** True iff the driver should keep running a RAF loop in this mode. Pure. */
export function isActive(mode: ThreadMode): boolean {
  return mode !== 'off';
}

/** True iff the tween should be bypassed (raw depth → display in one step). Pure. */
export function isSnap(mode: ThreadMode): boolean {
  return mode === 'snap';
}
