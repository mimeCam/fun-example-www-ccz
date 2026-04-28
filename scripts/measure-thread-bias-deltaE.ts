/**
 * measure-thread-bias-deltaE — Golden Thread accent-bias perceptual measure.
 *
 *   Measured threshold:  ΔE2000 ∈ [0.8, 1.8] vs. the stranger baseline.
 *   JND class:           sub-conscious recognition (signature, not status).
 *   Failure mode fenced: signature → status drift, in either direction.
 *
 * Three private helpers (CSS Filter Effects 1 §13.2 hue-rotate matrix in
 * gamma-encoded sRGB → CIE Lab via parametric D65→`refWhite` Bradford
 * adaptation → CIE 2000 ΔE) compose into one public surface,
 * `measureDeltaE2000(baselineHex, biasDeg, refWhite?)`. `refWhite` defaults
 * to `D50_WHITE` (existing call sites stay byte-identical); `D55_WHITE` and
 * `D75_WHITE` are the panel-white-point sensitivity targets that ask the
 * one falsifiable question Mike #7 keeps from Elon's pass: does the ±3°
 * geometry guard hold under ±1000K of panel calibration drift? The CLI
 * tail prints all three columns as a hand-runnable receipt for designers
 * — the script does nothing surprising at import time (no top-level side
 * effects); the CLI gate is the standard `require.main === module` shape.
 *
 * Usage (designer receipt):
 *   $ npx tsx scripts/measure-thread-bias-deltaE.ts
 *
 * Imported by:
 *   lib/design/__tests__/accent-bias-calibration.fence.test.ts
 *
 * Co-located with caller until rule-of-three fires (Mike §3, Elon §6 — a
 * `lib/design/perceptual/` ledger waits for calibration #2). When a
 * second perceptual window arrives (motion-JND on crossfades is the
 * obvious candidate), promote `measureDeltaE2000` and let the second
 * caller pay for the move.
 *
 * Each helper ≤ 10 lines by Sid's contract. ΔE2000 splits across
 * `deltaE2000` + `deltaE2000Sum` + `rotationT` + `rotationTermRT` +
 * `meanHueDeg` + `deltaHueDeg` + `hueAngleDeg` so every line of the
 * formula stays auditable in isolation.
 *
 * Credits:
 *   • Mike Koch (architect, _reports/from-michael-koch-project-architect-7.md
 *     — White-Point Sensitivity slice; prior #35) — the napkin §1, module
 *     map §3, the ten POIs §4: CSS-spec hue-rotate matrix (POI 2),
 *     parametric Bradford adaptation (POI 2 — rule-of-three has fired
 *     *inside the helper* now that D50, D55, D75 are three calibration
 *     targets), `BRAND.gold` baseline (POI 4); CSS-spec hue-rotate stays
 *     in gamma-encoded sRGB regardless of refWhite (POI 4); the rule-of-
 *     three discipline that keeps the helper in `scripts/` rather than
 *     minting `lib/design/perceptual/` on N=1 perceptual measure today.
 *   • Tanya Donska (UIX #88) — the felt-experience contract this fence
 *     guards: §3.2 the [0.8, 1.8] perceptual window literal, §3.3 the
 *     thermal × lean composition, §4 the "no shadow / no border / no
 *     translucency" stance the calibration is the math witness for.
 *   • Krystle Clear (VP Product) — slice scope, window literal, LoC budget,
 *     acceptance criteria.
 *   • Paul Kim (Strategist) — signature-not-status framing, sub-JND
 *     ceiling, the business non-negotiable that drift on either side
 *     kills the killer feature.
 *   • Elon Musk (First Principles) — drop the rebrand, keep the kernel:
 *     ship the ΔE2000 anchor, defer the perceptual ledger directory.
 *   • Sid (50-yr coder) — the ≤10 LoC per helper budget the math has to
 *     fit; the pure-helpers / single-public-surface shape lifted from
 *     `THREAD_PRE_LIT_OPACITY` (ledger-as-string-export pattern).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

type RGB = readonly [number, number, number]; // sRGB (gamma-encoded), 0..1
type XYZ = readonly [number, number, number]; // CIE XYZ tristimulus
type Lab = readonly [number, number, number]; // CIE L*a*b*

// ─── Hex parsing — pure, ≤10 LoC ─────────────────────────────────────────────

/** Parse a 6-digit hex color (with or without `#`) into normalized sRGB. */
function hexToRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`hexToRgb: not a 6-digit hex color: "${hex}"`);
  const n = parseInt(m[1], 16);
  return [
    ((n >> 16) & 0xff) / 255,
    ((n >> 8) & 0xff) / 255,
    (n & 0xff) / 255,
  ] as const;
}

/** Clamp a scalar to the unit interval. */
function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

// ─── CSS-spec hue-rotate matrix — gamma-encoded sRGB, ≤10 LoC ───────────────

/**
 * CSS Filter Effects Level 1 §13.2 hue-rotate matrix, applied in
 * gamma-encoded sRGB (the same pipeline browsers use for
 * `filter: hue-rotate(…)`). HSL rotate-and-back-convert is *close* but
 * not byte-equivalent for low-chroma stops near the violet→gold ramp;
 * the [0.8, 1.8] window is narrow enough that the discrepancy can flip
 * a pass/fail (Mike §4 POI 2). Mirror what the browser does.
 */
function hueRotate(rgb: RGB, degrees: number): RGB {
  const a = (degrees * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const [r, g, b] = rgb;
  return [
    clamp01((0.213 + c * 0.787 - s * 0.213) * r + (0.715 - c * 0.715 - s * 0.715) * g + (0.072 - c * 0.072 + s * 0.928) * b),
    clamp01((0.213 - c * 0.213 + s * 0.143) * r + (0.715 + c * 0.285 + s * 0.140) * g + (0.072 - c * 0.072 - s * 0.283) * b),
    clamp01((0.213 - c * 0.213 - s * 0.787) * r + (0.715 - c * 0.715 + s * 0.715) * g + (0.072 + c * 0.928 + s * 0.072) * b),
  ] as const;
}

// ─── sRGB → CIE Lab (D50) — pipeline, each step ≤10 LoC ─────────────────────

/** sRGB companding inverse — gamma-encoded scalar → linear scalar. */
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Linear sRGB → CIE XYZ (D65 reference white, IEC 61966-2-1 matrix). */
function linearRgbToXyzD65(rgb: RGB): XYZ {
  const [r, g, b] = rgb;
  return [
    0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
    0.0193339 * r + 0.1191920 * g + 0.9503041 * b,
  ] as const;
}

// ─── Bradford / von Kries chromatic adaptation — D65 → arbitrary refWhite ───
//
// One parametric helper instead of three hard-coded matrices. Rule-of-three
// has fired *inside the helper*: D50, D55, D75 are now three calibration
// targets, so the math earns generalisation (Mike #7 §4 POI 2). The forward
// matrix `BFD` is the CIE 159:2004 Bradford cone-response matrix; `BFD_INV`
// is its analytic inverse. Source white is fixed at D65 (sRGB authoring).

const BFD: ReadonlyArray<XYZ> = [
  [ 0.8951,  0.2664, -0.1614],
  [-0.7502,  1.7135,  0.0367],
  [ 0.0389, -0.0685,  1.0296],
];
const BFD_INV: ReadonlyArray<XYZ> = [
  [ 0.9869929, -0.1470543,  0.1599627],
  [ 0.4323053,  0.5183603,  0.0492912],
  [-0.0085287,  0.0400428,  0.9684867],
];

/** sRGB authoring white-point — D65 tristimulus (IEC 61966-2-1). */
const D65_WHITE: XYZ = [0.95047, 1.0, 1.08883] as const;

/** D50 reference white (CIE 1964 supplementary observer). Default ref. */
export const D50_WHITE: XYZ = [0.96422, 1.0, 0.82521] as const;
/** D55 — warm panel (~5500K). One of three white-point sensitivity targets. */
export const D55_WHITE: XYZ = [0.95682, 1.0, 0.92149] as const;
/** D75 — cool panel (~7500K). One of three white-point sensitivity targets. */
export const D75_WHITE: XYZ = [0.94972, 1.0, 1.22638] as const;

/** 3×3 matrix · 3-vector multiply. */
function mul3(M: ReadonlyArray<XYZ>, v: XYZ): XYZ {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ] as const;
}

/**
 * Bradford / von Kries chromatic adaptation: CIE XYZ from D65 → `dstWhite`.
 * One parametric helper — von Kries scaling in cone space, inverse Bradford
 * back to XYZ. Stranger floor preserved: identical inputs produce identical
 * outputs at any `dstWhite`, so 0° lean ⇒ ΔE2000 = 0 by construction.
 */
function adaptD65to(xyz: XYZ, dstWhite: XYZ): XYZ {
  const [Ls, Ms, Ss] = mul3(BFD, D65_WHITE);
  const [Ld, Md, Sd] = mul3(BFD, dstWhite);
  const [L,  M,  S ] = mul3(BFD, xyz);
  return mul3(BFD_INV, [L * Ld / Ls, M * Md / Ms, S * Sd / Ss]);
}

/** Lab piecewise non-linearity `f(t)` — cube root above the (6/29)³ knee. */
function fLab(t: number): number {
  const KNEE = 216 / 24389;            // (6/29)^3
  return t > KNEE ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
}

/** CIE XYZ (adapted to `refWhite`) → CIE Lab. */
function xyzToLab(xyz: XYZ, refWhite: XYZ): Lab {
  const fx = fLab(xyz[0] / refWhite[0]);
  const fy = fLab(xyz[1] / refWhite[1]);
  const fz = fLab(xyz[2] / refWhite[2]);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)] as const;
}

/**
 * Compose: gamma-encoded sRGB → CIE Lab (adapted to `refWhite`).
 * Default `refWhite = D50_WHITE` keeps every existing call site byte-
 * identical (the original D65→D50 → Lab pipeline). D55 / D75 are the
 * panel-white-point sensitivity targets; the math is the same shape.
 */
function srgbToLab(rgb: RGB, refWhite: XYZ = D50_WHITE): Lab {
  const lin: RGB = [srgbToLinear(rgb[0]), srgbToLinear(rgb[1]), srgbToLinear(rgb[2])];
  return xyzToLab(adaptD65to(linearRgbToXyzD65(lin), refWhite), refWhite);
}

// ─── ΔE2000 — split across ≤10-LoC helpers ──────────────────────────────────

const RAD = Math.PI / 180;
const POW25_7 = Math.pow(25, 7);

/** Hue angle in degrees, normalized to [0, 360). */
function hueAngleDeg(b: number, ap: number): number {
  if (b === 0 && ap === 0) return 0;
  const h = (Math.atan2(b, ap) * 180) / Math.PI;
  return h < 0 ? h + 360 : h;
}

/** Mean of two hue angles in degrees, with the ΔE2000 wraparound rule. */
function meanHueDeg(h1: number, h2: number, cprod: number): number {
  if (cprod === 0) return h1 + h2;
  if (Math.abs(h1 - h2) <= 180) return (h1 + h2) / 2;
  return ((h1 + h2) < 360) ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2;
}

/** Δh' in degrees, with the wraparound rule (gray short-circuits to 0). */
function deltaHueDeg(h1: number, h2: number, cprod: number): number {
  if (cprod === 0) return 0;
  const d = h2 - h1;
  return d > 180 ? d - 360 : (d < -180 ? d + 360 : d);
}

/** ΔE2000 hue-weighting term `T(hbar)`. */
function rotationT(hbar: number): number {
  return 1 - 0.17 * Math.cos(RAD * (hbar - 30))
           + 0.24 * Math.cos(RAD * 2 * hbar)
           + 0.32 * Math.cos(RAD * (3 * hbar + 6))
           - 0.20 * Math.cos(RAD * (4 * hbar - 63));
}

/** ΔE2000 cross-term `RT` — rotation around the blue-violet hue cluster. */
function rotationTermRT(hbar: number, Cbar: number): number {
  const Cbar7 = Math.pow(Cbar, 7);
  const RC = 2 * Math.sqrt(Cbar7 / (Cbar7 + POW25_7));
  const dTheta = 30 * Math.exp(-Math.pow((hbar - 275) / 25, 2));
  return -Math.sin(RAD * 2 * dTheta) * RC;
}

/** ΔE2000 — CIE 2000 color-difference between two CIE Lab values. */
function deltaE2000(a: Lab, b: Lab): number {
  const C1 = Math.hypot(a[1], a[2]), C2 = Math.hypot(b[1], b[2]);
  const cbar7 = Math.pow((C1 + C2) / 2, 7);
  const G = 0.5 * (1 - Math.sqrt(cbar7 / (cbar7 + POW25_7)));
  const a1p = (1 + G) * a[1], a2p = (1 + G) * b[1];
  const C1p = Math.hypot(a1p, a[2]), C2p = Math.hypot(a2p, b[2]);
  const h1 = hueAngleDeg(a[2], a1p), h2 = hueAngleDeg(b[2], a2p);
  return deltaE2000Sum(a[0], b[0], C1p, C2p, h1, h2);
}

/** Final assembly of ΔE2000 — weightings (`SL/SC/SH`) + `RT` + Pythagorean sum. */
function deltaE2000Sum(L1: number, L2: number, C1p: number, C2p: number, h1: number, h2: number): number {
  const cprod = C1p * C2p;
  const dL = L2 - L1, dC = C2p - C1p;
  const dH = 2 * Math.sqrt(cprod) * Math.sin((RAD * deltaHueDeg(h1, h2, cprod)) / 2);
  const Lbar = (L1 + L2) / 2, Cbar = (C1p + C2p) / 2, hbar = meanHueDeg(h1, h2, cprod);
  const SL = 1 + (0.015 * Math.pow(Lbar - 50, 2)) / Math.sqrt(20 + Math.pow(Lbar - 50, 2));
  const tL = dL / SL, tC = dC / (1 + 0.045 * Cbar), tH = dH / (1 + 0.015 * Cbar * rotationT(hbar));
  return Math.sqrt(tL * tL + tC * tC + tH * tH + rotationTermRT(hbar, Cbar) * tC * tH);
}

// ─── Public surface — single composition entry point ────────────────────────

/**
 * Measure CIE 2000 ΔE between a baseline color and the same color rendered
 * under `filter: hue-rotate(<biasDeg>)` per the CSS Filter Effects 1 spec.
 *
 *   measureDeltaE2000('#f0c674', +6)              → ~1.5  (warm explorer lean)
 *   measureDeltaE2000('#f0c674',  0)              →  0    (stranger ≡ today)
 *   measureDeltaE2000('#f0c674', +2.5, D55_WHITE) → warm-panel sensitivity
 *
 * The single public composition: hex → CSS-spec hue-rotate (gamma-encoded
 * sRGB) → linear sRGB → CIE XYZ (D65) → Bradford D65→`refWhite` → CIE Lab →
 * ΔE2000. `refWhite` defaults to `D50_WHITE` — every existing call site
 * stays byte-identical. D55 / D75 are panel-white-point sensitivity targets
 * (Mike #7 §3 — does the ±3° geometry guard hold under ±1000K of drift?).
 */
export function measureDeltaE2000(
  baselineHex: string,
  biasDeg: number,
  refWhite: XYZ = D50_WHITE,
): number {
  const base = hexToRgb(baselineHex);
  const bent = hueRotate(base, biasDeg);
  return deltaE2000(srgbToLab(base, refWhite), srgbToLab(bent, refWhite));
}

// ─── CLI tail — hand-runnable receipt; no top-level side effects ────────────

/**
 * The five archetypes' applied lean — hand-mirrored from
 * `lib/design/accent-bias.ts __testing__.THREAD_BIAS_BY_ARCHETYPE` so the
 * CLI receipt has zero non-pure imports. The fence test imports the SSOT.
 */
const THREAD_BIAS_TABLE: ReadonlyArray<readonly [string, number]> = [
  ['deep-diver', -2.5], ['explorer', +2.5], ['faithful', +1.5],
  ['resonator', -1.5], ['collector', -2.0],
];

/**
 * Two-baseline witness: the warm spine fill stop (`BRAND.gold`) anchors
 * the calibration; the cool spine fill stop (`BRAND.primary`) is the
 * second witness across the violet→gold thermal gradient. Tanya UIX #92
 * §11 / Elon §4 — the gradient is honored at both ends. Receipt-only;
 * the fence test pins only the warm baseline today (Slice 3 lifts the
 * cool baseline into a fence assertion when the second-surface rule-of-
 * three fires).
 */
const BASELINES: ReadonlyArray<readonly [string, string]> = [
  ['#f0c674', 'warm spine fill stop (BRAND.gold)'],
  ['#7b2cbf', 'cool spine fill stop (BRAND.primary)'],
];

/**
 * The three panel-white-point columns the receipt now prints. D50 is the
 * baseline (today's behavior, unchanged); D55 is the warm-panel sensitivity
 * (~5500K — D55-ish evening lamp); D75 is the cool-panel sensitivity
 * (~7500K — D75-ish daylight monitor). Same Whisper Budget across all three.
 */
const REF_WHITE_COLS: ReadonlyArray<readonly [string, XYZ]> = [
  ['D50', D50_WHITE], ['D55', D55_WHITE], ['D75', D75_WHITE],
];

/** Format a single archetype row as `archetype  ±N°  D50: X.XXX  D55: …  D75: …`. */
function formatRow(name: string, deg: number, baseline: string): string {
  const sign = deg > 0 ? '+' : '';
  const lean = `${sign}${deg}°`.padStart(6);
  const cols = REF_WHITE_COLS
    .map(([k, w]) => `${k}: ${measureDeltaE2000(baseline, deg, w).toFixed(3)}`)
    .join('  ');
  return `  ${name.padEnd(11)}  ${lean}   ${cols}`;
}

/** Print one baseline's calibration block — five rows × three columns. */
function printBaselineBlock(baseline: string, label: string): void {
  console.log(`\n· baseline ${baseline}  (${label})`);
  for (const [name, deg] of THREAD_BIAS_TABLE) {
    console.log(formatRow(name, deg, baseline));
  }
}

/** Print the CLI receipt to stdout. Side-effect (console). */
function printReceipt(): void {
  console.log(`\nGolden Thread accent-bias calibration`);
  console.log(`recognition whisper budget: ΔE2000 ∈ [0.8, 1.8]   (warm)  /  [0.7, 1.8]   (cool)`);
  console.log(`panel white-point sensitivity: D50 (today)  ·  D55 (~5500K, warm)  ·  D75 (~7500K, cool)`);
  for (const [hex, label] of BASELINES) printBaselineBlock(hex, label);
  console.log('');
}

// Run only when invoked directly (`tsx scripts/...`), never at import time —
// the fence test imports `measureDeltaE2000` and must not see CLI output.
if (require.main === module) {
  printReceipt();
}
