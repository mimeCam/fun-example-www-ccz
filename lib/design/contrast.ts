/**
 * contrast — pure WCAG helpers shared across design tests.
 *
 * Extracted from `lib/utils/__tests__/contrast.test.ts` so the new
 * `ambient-surfaces.test.ts` matrix can assert ≥ 4.5:1 on `::selection`
 * and ≥ 3:1 on the scrollbar thumb without cloning this math again.
 * One implementation, two test callers — shared-code dividend (Mike §3).
 *
 * No DOM, no Canvas. Pure math, per WCAG 2.1 §1.4.3.
 *
 * **Hex parsing is delegated to `lib/design/hue.ts`** — the canonical
 * 0..1 kernel. `hexToRgb` here is now a 4-line shim around `hexToRgb255`;
 * one unit, one source of truth (Mike napkin / Sid 2026-04-26 — kills the
 * 0..255 vs 0..1 unit drift Elon sniffed at, #54 §3).
 *
 * Credits: Mike K. (napkin §3 — extract-and-share), Elon M. (encode-as-math).
 */

import { hexToRgb255 } from './hue';

// ─── sRGB → linear luminance ──────────────────────────────────────────────

/** Single channel decode: companded sRGB → linear light. */
export function srgbChannel(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** Relative luminance of an opaque `#rrggbb` colour. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbChannel(r)
       + 0.7152 * srgbChannel(g)
       + 0.0722 * srgbChannel(b);
}

/** WCAG contrast ratio between two opaque colours. */
export function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (la + 0.05) / (lb + 0.05);
}

// ─── Alpha compositing (approximates `color-mix( α, transparent)`) ────────

/** Composite `top` over `bg` at alpha α; returns a hex colour. */
export function compositeOver(top: string, bg: string, alpha: number): string {
  const ac = hexToRgb(top);
  const bc = hexToRgb(bg);
  const out = ac.map((v, i) => Math.round(v * alpha + bc[i] * (1 - alpha)));
  return rgbToHex(out[0], out[1], out[2]);
}

// ─── Hex ↔ RGB (small, exported so tests can assert sanity cheaply) ───────

/**
 * `#rrggbb` → [r, g, b] each in [0, 255]. Pure, ≤ 10 LOC. Shim over
 * `hexToRgb255` in `lib/design/hue.ts` — the canonical 0..1 kernel lives
 * there; this re-export keeps the WCAG path on its native 0..255 ints.
 */
export function hexToRgb(hex: string): [number, number, number] {
  return hexToRgb255(hex);
}

export function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
