/**
 * Thermal Animation — pure function mapping thermal score (0-100) to animation tokens.
 *
 * No React, no DOM, no window. Stateless. Testable.
 * Returns CSS custom property values for animation-duration, intensity, and scale.
 *
 * Three animations layer to create the "alive" feeling:
 * - breath: subtle scale pulse on the body wrapper
 * - glow: opacity oscillation on accent elements
 * - drift: horizontal micro-shift on whisper text
 */

// ─── State thresholds (must match thermal-score.ts) ──────

const DORMANT = 18;
const STIRRING = 50;
const WARM = 80;

// ─── Animation anchor values per state boundary ──────────

interface BreathConfig { cycleSec: number; scalePeak: number }
interface GlowConfig { cycleSec: number; minOpacity: number; maxOpacity: number }
interface DriftConfig { cycleSec: number; rangePx: number }

// Inverted speed curves: early relationship = nervous energy (fast).
// Deep intimacy = settled comfort (slow). At peak warmth, the room is calm.
// Magnitudes raised above human just-noticeable-difference thresholds:
//   size JND ≈ 1%, opacity JND ≈ 5-8%, position JND ≈ 2-3px.

const BREATH: Record<string, BreathConfig> = {
  dormant:  { cycleSec: 0, scalePeak: 0 },
  stirring: { cycleSec: 4, scalePeak: 0.015 },
  warm:     { cycleSec: 6, scalePeak: 0.020 },
  luminous: { cycleSec: 8, scalePeak: 0.025 },
};

const GLOW: Record<string, GlowConfig> = {
  dormant:  { cycleSec: 0, minOpacity: 0, maxOpacity: 0 },
  stirring: { cycleSec: 5, minOpacity: 0.15, maxOpacity: 0.30 },
  warm:     { cycleSec: 7, minOpacity: 0.20, maxOpacity: 0.40 },
  luminous: { cycleSec: 9, minOpacity: 0.30, maxOpacity: 0.55 },
};

const DRIFT: Record<string, DriftConfig> = {
  dormant:  { cycleSec: 0, rangePx: 0 },
  stirring: { cycleSec: 6, rangePx: 3 },
  warm:     { cycleSec: 8, rangePx: 5 },
  luminous: { cycleSec: 10, rangePx: 7 },
};

// ─── Helpers ─────────────────────────────────────────────

function stateBand(score: number): string {
  if (score < DORMANT) return 'dormant';
  if (score < STIRRING) return 'stirring';
  if (score < WARM) return 'warm';
  return 'luminous';
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function bandProgress(score: number): { band: string; t: number } {
  const band = stateBand(score);
  const lo = score < DORMANT ? 0 : score < STIRRING ? DORMANT : score < WARM ? STIRRING : WARM;
  const hi = score < DORMANT ? DORMANT : score < STIRRING ? STIRRING : score < WARM ? WARM : 100;
  const range = hi - lo || 1;
  return { band, t: Math.max(0, Math.min(1, (score - lo) / range)) };
}

// ─── Types ───────────────────────────────────────────────

export interface AnimationTokens {
  '--token-breath-speed': string;   // cycle duration in ms, '0' = disabled
  '--token-breath-scale': string;   // peak scale delta, '0' = disabled
  '--token-glow-speed': string;     // cycle duration in ms
  '--token-glow-min': string;       // min opacity (0-1)
  '--token-glow-max': string;       // max opacity (0-1)
  '--token-drift-speed': string;    // cycle duration in ms
  '--token-drift-range': string;    // max translateX in px
}

// ─── Public API ──────────────────────────────────────────

/** Compute animation CSS tokens from a 0-100 thermal score. */
export function computeAnimationTokens(score: number): AnimationTokens {
  const { band, t } = bandProgress(score);

  const breath = BREATH[band];
  const glow = GLOW[band];
  const drift = DRIFT[band];

  return {
    '--token-breath-speed': breath.cycleSec === 0
      ? '0' : `${Math.round((breath.cycleSec + t * 0.5) * 1000)}ms`,
    '--token-breath-scale': breath.scalePeak === 0
      ? '0' : (breath.scalePeak + t * 0.0005).toFixed(5),
    '--token-glow-speed': glow.cycleSec === 0
      ? '0' : `${Math.round((glow.cycleSec + t * 0.5) * 1000)}ms`,
    '--token-glow-min': glow.minOpacity === 0
      ? '0' : lerp(glow.minOpacity, glow.minOpacity + 0.02, t).toFixed(3),
    '--token-glow-max': glow.maxOpacity === 0
      ? '0' : lerp(glow.maxOpacity, glow.maxOpacity + 0.03, t).toFixed(3),
    '--token-drift-speed': drift.cycleSec === 0
      ? '0' : `${Math.round((drift.cycleSec + t * 0.5) * 1000)}ms`,
    '--token-drift-range': drift.rangePx === 0
      ? '0' : lerp(drift.rangePx, drift.rangePx + 0.5, t).toFixed(2),
  };
}
