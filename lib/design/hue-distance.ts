/**
 * hue-distance — per-surface dual-axis kernel shared by sibling-voice audits.
 *
 * Three audits today live on the same shape: a *surface* paints ≥ 2 voice
 * families from one register (archetype, worldview, textlink-passage); on
 * each surface the minimum distance between any two of those families
 * must clear an architectural floor on **two** axes — the HSL Δh wheel
 * AND OKLab ΔE perceptual space. Sibling violets that share a chip must
 * distinguish on a real screen, not merge into "some violet pill with
 * different copy" (Tanya UX #12 §2). The audits differ only in *which
 * families* paint *which surface* — the math is identical.
 *
 * **Two parallel axes, identical caller shape.** Δh is the wheel ruler;
 * ΔE is the eyeball ruler that catches low-chroma collapse the wheel
 * cannot see (Mike napkin #131 POI #1; Tanya UX #37 §2). The kernel
 * surfaces both — `deltaHue`/`worstPair`/`surfaceReceipt` for Δh,
 * `deltaEPair`/`worstPerceptualPair`/`dualReceipt` for the dual receipt
 * — at identical signatures. Audits gate on both; the kernel does not
 * pick floor numbers (those live in the audit docblocks, defended on
 * first principles — Mike POI #6).
 *
 * **Polymorphism is a killer — extract the kernel, don't subclass.**
 * Mike napkin: one stateless kernel, three callers, no class hierarchy
 * (AGENTS.md §"Always simplify"). Until this module landed, the four
 * pure helpers below were cloned inside `archetype-hue-distance.test.ts`;
 * a second audit (`worldview-hue-distance.test.ts`) would have made the
 * clone load-bearing — drift = silent regression. One place, one truth.
 *
 * **Math kernel sits one floor down.** `circularHueDelta` and `hexToHsl`
 * stay in `lib/design/hue.ts` (the canonical palette geometry kernel —
 * AGENTS.md §"Key Paths"). This module is the *audit kernel*: pair
 * generation, table formatting, worst-case projection, the assertion.
 * Two layers, no overlap.
 *
 * **No new constants in source.** Per-audit floors (`HUE_FLOOR_DEG`)
 * live in the test file, not in `color-constants.ts` — the floor is an
 * audit assertion, not a paint value (Mike napkin POI #6: conflating
 * those is how design systems start growing constants nobody can find).
 *
 * Pure, no DOM, no Canvas, no deps. Each helper ≤ 10 LOC.
 *
 * Credits: Mike K. (napkin "Sibling Voice Hue Distance (2)" — the
 * one-kernel-two-callers shape, the "no class hierarchy" call, the
 * docblock-as-receipt convention #95 §6); Krystle C. (the per-surface
 * audit pattern this kernel formalises); Tanya D. (UX #60 §3 / UX #67 §3
 * — "shape decides group; numbers, not adjectives" — the snapshot is
 * the trust signal); the existing `archetype-hue-distance.test.ts` (the
 * shape this kernel was lifted from — most decisions paid for already).
 */

import { circularHueDelta, hexToHsl, oklchDeltaE } from './hue';

// ─── Family-resolver shape — caller supplies the family→hex map ──────────

/**
 * Resolver from a family token (`"accent"`, `"cyan"`, …) to its painted
 * `#rrggbb`. Each audit owns its own map so the kernel stays
 * surface-agnostic. The audit reads, never writes.
 */
export type FamilyHex = Readonly<Record<string, string>>;

/** Hue (degrees) of a family's painted hex. Pure, ≤ 10 LOC. */
export function hueOf(family: string, hex: FamilyHex): number {
  const h = hex[family];
  if (!h) throw new Error(`hue-distance: unknown family ${family}`);
  return hexToHsl(h).h;
}

/** Δh between two families' painted hexes — circular, [0, 180]. Pure. */
export function deltaHue(a: string, b: string, hex: FamilyHex): number {
  return circularHueDelta(hueOf(a, hex), hueOf(b, hex));
}

// ─── Pair generation — every unordered pair from a family list ───────────

/** Every unordered pair from a family list. Pure, ≤ 10 LOC. */
export function familyPairs(families: readonly string[]): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (let i = 0; i < families.length; i++) {
    for (let j = i + 1; j < families.length; j++) out.push([families[i], families[j]]);
  }
  return out;
}

// ─── Receipt projections — per-surface table + worst-case scalar ─────────

/** Δh table for one surface — `{ "<a>↔<b>": "X.XX°", … }`. Pure, ≤ 10 LOC. */
export function deltaTable(
  families: readonly string[],
  hex: FamilyHex,
): Record<string, string> {
  return Object.fromEntries(
    familyPairs(families).map(([a, b]) => [`${a}↔${b}`, `${deltaHue(a, b, hex).toFixed(2)}°`]),
  );
}

/** Worst (smallest) Δh on a surface, plus the pair that produced it. Pure. */
export function worstPair(
  families: readonly string[],
  hex: FamilyHex,
): { pair: string; dh: number } {
  let worst = { pair: '', dh: Infinity };
  for (const [a, b] of familyPairs(families)) {
    const dh = deltaHue(a, b, hex);
    if (dh < worst.dh) worst = { pair: `${a}↔${b}`, dh };
  }
  return worst;
}

// ─── Receipt projection — one table per surface (the snapshot shape) ─────

/** `Record<surface, Record<"<a>↔<b>", "X.XX°">>` — the byte-pinned receipt. */
export type SurfaceDeltaReceipt = Record<string, Record<string, string>>;

/** Per-surface Δh tables — one row per surface. Pure, ≤ 10 LOC. */
export function surfaceReceipt(
  surfaces: Readonly<Record<string, readonly string[]>>,
  hex: FamilyHex,
): SurfaceDeltaReceipt {
  return Object.fromEntries(
    Object.entries(surfaces).map(([s, families]) => [s, deltaTable(families, hex)]),
  );
}

// ─── ΔE axis — sibling to Δh, identical caller shape ─────────────────────
//
// HSL Δh is a hue-angle ruler; OKLab ΔE is the perceptual ruler that
// catches low-chroma collapse the wheel cannot see (Mike napkin #131
// POI #1, Tanya UX #37 §2). Three pure helpers mirror the Δh trio above
// — `deltaEPair` ↔ `deltaHue`, `worstPerceptualPair` ↔ `worstPair`,
// `dualReceipt` ↔ `surfaceReceipt`. Same kernel shape, second instrument.
// Floors stay per-audit; the kernel does not pick numbers.

/** Resolved hex for a family — throws on unknown, mirrors `hueOf`. Pure. */
function hexOf(family: string, hex: FamilyHex): string {
  const h = hex[family];
  if (!h) throw new Error(`hue-distance: unknown family ${family}`);
  return h;
}

/** ΔE between two families' painted hexes — OKLab Euclidean. Pure. */
export function deltaEPair(a: string, b: string, hex: FamilyHex): number {
  return oklchDeltaE(hexOf(a, hex), hexOf(b, hex));
}

/** Worst (smallest) ΔE on a surface, plus the pair that produced it. Pure. */
export function worstPerceptualPair(
  families: readonly string[],
  hex: FamilyHex,
): { pair: string; dE: number } {
  let worst = { pair: '', dE: Infinity };
  for (const [a, b] of familyPairs(families)) {
    const dE = deltaEPair(a, b, hex);
    if (dE < worst.dE) worst = { pair: `${a}↔${b}`, dE };
  }
  return worst;
}

/** `Record<surface, Record<"<a>↔<b>", "X.XX° · ΔE Y.YY">>` — dual-axis receipt. */
export type DualSurfaceReceipt = Record<string, Record<string, string>>;

/** Per-surface dual-axis tables — Δh and ΔE in the same row. Pure, ≤ 10 LOC. */
export function dualReceipt(
  surfaces: Readonly<Record<string, readonly string[]>>,
  hex: FamilyHex,
): DualSurfaceReceipt {
  return Object.fromEntries(
    Object.entries(surfaces).map(([s, families]) => [s, dualRow(families, hex)]),
  );
}

/** Δh · ΔE row for one surface — `{ "<a>↔<b>": "X.XX° · ΔE Y.YY" }`. Pure. */
function dualRow(families: readonly string[], hex: FamilyHex): Record<string, string> {
  return Object.fromEntries(
    familyPairs(families).map(([a, b]) => [
      `${a}↔${b}`,
      `${deltaHue(a, b, hex).toFixed(2)}° · ΔE ${deltaEPair(a, b, hex).toFixed(2)}`,
    ]),
  );
}
