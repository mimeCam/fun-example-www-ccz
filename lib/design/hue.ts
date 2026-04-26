/**
 * hue — pure palette geometry helpers (hex ↔ RGB ↔ HSL, circular Δh).
 *
 * Single typed home for the trio of HSL helpers the project's audits and
 * lerps already lean on:
 *
 *   • `lib/design/contrast.ts`              (hexToRgb @ 0..255 — WCAG path)
 *   • `lib/thermal/thermal-tokens.ts`        (hexToHsl + lerp — color path)
 *   • `lib/design/__tests__/focus-ink-…`     (hexToRgb01 / hexToHsl / Δh — physics)
 *
 * Until now the math was cloned in three places at three unit conventions
 * ([0..255] ints, [0..1] floats, h°·s100·l100). Canonicalizing the 0..1
 * form here closes the unit drift Elon sniffed at (#54 §3): `hexToRgb01`
 * is the kernel; `lib/design/contrast.ts` becomes a 4-line `* 255 | 0`
 * shim around it. One unit, one source of truth (Mike napkin / Elon §3).
 *
 * **Same wheel.** These helpers also live on the same wheel the thermal
 * token walks; per-surface collisions, when a future surface paints both
 * a static voice and `--token-accent`, land in
 * `__tests__/archetype-hue-distance.test.ts` — Jason F.'s salvageable
 * insight, sized to its evidence (Elon §4; Mike napkin POI #6).
 *
 * **Rule of three.** Promotion is gated by need, not by ceremony: the
 * non-trivial trio (`hexToRgb01`, `hexToHsl`, `circularHueDelta`) earns
 * the shared module because drift would silently matter (HSL conversion
 * is non-trivial; ΔH wraps at 360°). The trivial `parseInt(hex, 16) / 255`
 * micro-helper does not — Mike #78 §6 #1: rule of three is the gate, not
 * the goal.
 *
 * **No polymorphism.** Pure functions over plain data. No classes, no
 * accessors, no `voiceByPosture()` ergonomic on top. *Polymorphism is a
 * killer* (voice-ledger.ts:18; AGENTS.md repeated).
 *
 * **No cross-ledger.** This module knows nothing about `lib/thermal/` or
 * `lib/design/voice-ledger.ts`. The audit *test* knows about all three;
 * the helper module stays surface-agnostic. (Paul §"What I am explicitly
 * not asking for"; Mike #70 §A — *no ninth ledger*.)
 *
 * Pure, no DOM, no deps. Each helper ≤ 10 LOC.
 *
 * Credits: Mike K. (napkin — the rule-of-three promotion shape, the
 * 0..1-canonical unit call, the 6-file budget); Elon M. (#54 §3 — the
 * unit-drift teardown that motivated the kernel); Jason F. (the "same
 * wheel" framing, salvaged into the docblock); Krystle C. (the engineering
 * shape that motivates the receipt audit downstream).
 */

// ─── Hex parsing — strict, throws on malformed input ─────────────────────

/** `#rrggbb` → [r, g, b] each in [0, 1]. The canonical kernel. Pure. */
export function hexToRgb01(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`hexToRgb01: bad hex: ${hex}`);
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}

/** `#rrggbb` → [r, g, b] each in [0, 255] ints. Shim over `hexToRgb01`. Pure. */
export function hexToRgb255(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb01(hex);
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// ─── Hex → HSL ───────────────────────────────────────────────────────────

/** HSL channels — h in [0, 360), s/l in [0, 1]. Pure. */
export interface HSL { readonly h: number; readonly s: number; readonly l: number }

/** `#rrggbb` → { h:[0,360), s:[0,1], l:[0,1] }. Pure. */
export function hexToHsl(hex: string): HSL {
  const [r, g, b] = hexToRgb01(hex);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const l = (mx + mn) / 2;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  return { h: hueChannel(r, g, b, mx, d), s, l };
}

/** Hue channel (degrees) for a non-grey RGB triple. Pure, ≤ 10 LOC. */
function hueChannel(r: number, g: number, b: number, mx: number, d: number): number {
  if (mx === r) return (((g - b) / d + (g < b ? 6 : 0)) * 60) % 360;
  if (mx === g) return (((b - r) / d + 2) * 60) % 360;
  return (((r - g) / d + 4) * 60) % 360;
}

// ─── Circular Δh — survives the 0°/360° wrap ─────────────────────────────

/**
 * Shortest arc between two hue angles in degrees. Pure, ≤ 10 LOC.
 * Always returns a value in [0, 180]. Survives the wrap:
 *   `circularHueDelta(350, 10) === 20`   not 340.
 *   `circularHueDelta(0,   0)  === 0`.
 */
export function circularHueDelta(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360;
  return Math.min(raw, 360 - raw);
}
