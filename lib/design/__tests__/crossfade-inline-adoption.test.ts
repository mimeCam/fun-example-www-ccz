/**
 * Crossfade-Inline Adoption — single-source-of-truth fence for the carrier
 * the chrome-rhythm continuity contract names.
 *
 * Three sibling chrome surfaces (`AmbientNav`, `NextRead`, `GoldenThread`)
 * plus AmbientNav's per-link hover swap share ONE carrier:
 * `gestureClassesOf('crossfade-inline')` → `'duration-crossfade ease-out'`
 * (120 ms, ease-out — Tanya UIX §4 row 1). Pre-lift, three of the call
 * sites re-derived the carrier under three different local names
 * (`NAV_HOVER_GESTURE`, `NEXT_READ_GESTURE`, `PRESENCE_GESTURE`) — three
 * drift-prone copies of the same string. Mike napkin #22 / Krystle's
 * rule-of-three lift collapsed them to one named export
 * (`CROSSFADE_INLINE` in `lib/design/gestures.ts`); this fence pins the
 * lift structurally:
 *
 *   1. **Positive pin** — `gestures.ts` exports the constant, and its
 *      runtime value equals the verb's row in the Atlas. The chrome-
 *      rhythm contract is byte-identical to the source it lifts from.
 *   2. **Outside-fence ban** — under `components/**` and `app/**`, the
 *      literal expression `gestureClassesOf('crossfade-inline')` appears
 *      ZERO times. The verb has one source of truth; new consumers
 *      import the constant.
 *   3. **Caller positive pin** — the four documented consumers each
 *      import `CROSSFADE_INLINE` from the canonical seam, so a future
 *      reviewer reading any one site finds the carrier one import away.
 *
 * The fix-hint failure message names the file, the line, and the import
 * to route through (Mike #38 §4 — failure-message-is-documentation).
 *
 * Mirrors the shape of `presence-adoption.test.ts` and
 * `gestures-call-site-rhythm.test.ts` — same kernel walker, same
 * grep-fence rigor. Pure source-string lint; no DOM, no React render.
 *
 * Credits: Mike K. (architect napkin #22 — the rule-of-three lift, the
 * verb-named constant home, the fence-as-architecture point #2: "without
 * the new fence test, the next contributor will quietly re-derive the
 * carrier in a fourth component"; the kernel-walker shape lifted from
 * `alpha-adoption`/`presence-adoption`), Tanya D. (UIX §4.1, §4.2 — the
 * chrome-rhythm contract this fence enforces; the "felt as one breath"
 * verdict the constant lift delivers), Krystle C. (rule-of-three doctrine
 * the lift respects), Elon M. (the carrier-vs-rung separability read —
 * the fourth consumer at `AmbientNav.tsx:140` is the load-bearing
 * counterexample that justifies a bare carrier constant rather than a
 * `chromeCrossfadeOf(rung)` cell helper), Paul K. ("felt, not announced"
 * — the load-bearing outcome the single carrier protects).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CROSSFADE_INLINE,
  gestureClassesOf,
} from '../gestures';
import { collectFiles, lineIsExempt, relativePath, stripComments } from './_fence';

const ROOT = join(__dirname, '..', '..', '..');

/** The four call sites that share the carrier (chrome-rhythm + per-link hover). */
const CARRIER_CALLERS: readonly string[] = [
  'components/navigation/AmbientNav.tsx',
  'components/reading/NextRead.tsx',
  'components/reading/GoldenThread.tsx',
] as const;

/** Helper path — the one home for the verb-named carrier constant. */
const HELPER_PATH = 'lib/design/gestures.ts';

/** The forbidden re-derivation expression. The verb has one source of truth. */
const FORBIDDEN_CALL = "gestureClassesOf('crossfade-inline')";

/** Directories scanned for outside-fence drift. Same footprint as alpha-adoption. */
const SCAN_DIRS = ['components', 'app'];

// ─── 1 · Positive pin — the constant exists, equals the row ───────────────

describe('CROSSFADE_INLINE — the carrier has one source of truth', () => {
  it('exports a non-empty string from `lib/design/gestures.ts`', () => {
    expect(typeof CROSSFADE_INLINE).toBe('string');
    expect(CROSSFADE_INLINE.length).toBeGreaterThan(0);
  });

  it('equals the verb row — `duration-crossfade ease-out` (120 ms, ease-out)', () => {
    expect(CROSSFADE_INLINE).toBe('duration-crossfade ease-out');
    expect(CROSSFADE_INLINE).toBe(gestureClassesOf('crossfade-inline'));
  });

  it('the helper file declares the export at module scope', () => {
    const src = readFileSync(join(ROOT, HELPER_PATH), 'utf8');
    expect(src).toMatch(/export\s+const\s+CROSSFADE_INLINE\b/);
  });
});

// ─── 2 · Outside-fence ban — the literal call belongs to the helper ───────

describe('crossfade-inline adoption — `gestureClassesOf(\'crossfade-inline\')` is helper-only', () => {
  /** Files that legitimately spell the literal call — only the helper home. */
  const ALLOW = new Set<string>([HELPER_PATH]);

  /** Walk every scannable file; collect lines that re-derive the carrier. */
  function findOutsideFenceHits(): Array<{ file: string; line: number; match: string }> {
    return collectFiles(SCAN_DIRS).flatMap((p) => scanOne(p));
  }

  /** Scan one file — skip allow-listed paths and exempt-tagged lines. ≤ 10 LOC. */
  function scanOne(full: string): Array<{ file: string; line: number; match: string }> {
    const rel = relativePath(full);
    if (ALLOW.has(rel)) return [];
    const original = readFileSync(full, 'utf8').split(/\r?\n/);
    const code = stripComments(readFileSync(full, 'utf8')).split(/\r?\n/);
    return code.flatMap((ln, i) =>
      !ln.includes(FORBIDDEN_CALL) || lineIsExempt(original, i, 'gesture-ledger:exempt')
        ? []
        : [{ file: rel, line: i + 1, match: original[i].trim() }],
    );
  }

  it('no `gestureClassesOf(\'crossfade-inline\')` re-derivation under components/** or app/**', () => {
    const hits = findOutsideFenceHits();
    const fixHint =
      `    → import { CROSSFADE_INLINE } from '@/lib/design/gestures' and reference it directly,\n` +
      `      or mark the line with  // gesture-ledger:exempt — <honest reason>`;
    const message = hits
      .map((v) => `  ${v.file}:${v.line} — ${v.match}\n${fixHint}`)
      .join('\n');
    expect(hits.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (hits.length > 0) throw new Error('\n' + message);
  });
});

// ─── 3 · Caller positive pin — the four sites import the constant ─────────

describe('crossfade-inline adoption — every consumer imports the carrier', () => {
  it.each(CARRIER_CALLERS)('%s imports `CROSSFADE_INLINE` from `@/lib/design/gestures`', (rel) => {
    const src = readFileSync(join(ROOT, rel), 'utf8');
    expect(src).toMatch(
      /import\s*\{[^}]*\bCROSSFADE_INLINE\b[^}]*\}\s*from\s*['"]@\/lib\/design\/gestures['"]/,
    );
  });

  it.each(CARRIER_CALLERS)('%s references `CROSSFADE_INLINE` at least once', (rel) => {
    const src = stripComments(readFileSync(join(ROOT, rel), 'utf8'));
    expect(src).toMatch(/\bCROSSFADE_INLINE\b/);
  });
});
