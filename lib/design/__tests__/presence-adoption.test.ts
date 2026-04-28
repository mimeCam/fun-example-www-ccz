/**
 * Presence Adoption — chrome-rhythm continuity-contract grep-fence.
 *
 * Three sibling chrome surfaces (`AmbientNav`, `NextRead`, `GoldenThread`)
 * share the visibility contract: appearance ⊕ disappearance MUST ride
 * opacity, never `return null`. This test pins the contract:
 *
 *   1. The three callers route through `presenceClassOf` from
 *      `@/lib/design/presence` — the import line is present and at
 *      least one call resolves at module scope.
 *   2. The motion fade endpoints (`'opacity-0 pointer-events-none'` and
 *      the lone `'opacity-100'` literal) live ONLY in the helper file
 *      under the `ALPHA_MOTION_ENDPOINT_PATHS` carve-out. Components
 *      and apps must compose presence through the call, not the literal.
 *   3. The presence invariant holds (the type-level + runtime-level
 *      proof that `gone` carries `pointer-events-none` and the visible
 *      rungs do not).
 *
 * Mirrors the shape of `alpha-adoption.test.ts` and
 * `nav-voice-adoption.test.ts` — same kernel walker pattern, same
 * grep-fence rigor. The failure message names the file, the line, and
 * the helper to route through, so the fix is one import away (Mike #38
 * §4 — failure-message-is-documentation).
 *
 * Credits: Mike K. (architect napkin #18 §2.3 — fence-test pattern,
 * three-caller positive pin, outside-fence ban, kernel-walker shape
 * lifted from `alpha-adoption`), Tanya D. (UIX #44 §4, §10 — the
 * continuity contract this fence enforces; the "no chrome surface
 * unmounts mid-glance" verdict), Krystle C. (rule-of-three doctrine
 * the three-caller assertion respects), Jason F. (`presence.ts`
 * filename + verb-named rungs).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  presenceClassOf,
  presenceAriaHidden,
  presenceInvariantHolds,
  PRESENCE_ORDER,
} from '../presence';
import { ALPHA_MOTION_ENDPOINT_PATHS } from '../alpha';
import { collectFiles, lineIsExempt, relativePath, stripComments } from './_fence';

const ROOT = join(__dirname, '..', '..', '..');

/** The three chrome callers the contract names. */
const CHROME_CALLERS = [
  'components/navigation/AmbientNav.tsx',
  'components/reading/NextRead.tsx',
  'components/reading/GoldenThread.tsx',
] as const;

/** Helper path — the one home for the motion fade endpoint literals. */
const HELPER_PATH = 'lib/design/presence.ts';

/** The literal substring the fence forbids outside the carve-out. */
const PRESENCE_HIDDEN_LITERAL = 'opacity-0 pointer-events-none';

/** Directories scanned for outside-fence drift. Same footprint as alpha-adoption. */
const SCAN_DIRS = ['components', 'lib/utils', 'lib/hooks', 'lib/sharing', 'app'];

// ─── 1 · The three chrome callers route through the helper ────────────────

describe('presence adoption — the three chrome surfaces import the helper', () => {
  it.each(CHROME_CALLERS)('%s imports `presenceClassOf` from `@/lib/design/presence`', (rel) => {
    const src = readFileSync(join(ROOT, rel), 'utf8');
    expect(src).toContain("from '@/lib/design/presence'");
    expect(src).toContain('presenceClassOf');
  });

  it.each(CHROME_CALLERS)('%s imports `presenceAriaHidden` for the ARIA carrier', (rel) => {
    const src = readFileSync(join(ROOT, rel), 'utf8');
    expect(src).toContain('presenceAriaHidden');
  });

  it.each(CHROME_CALLERS)('%s no longer carries the `opacity-0 pointer-events-none` literal', (rel) => {
    // The endpoint pair lives in the helper, not the call site. The
    // call site composes via `presenceClassOf(...)` — one home, three
    // thin call sites (Mike #18 §2.2).
    const src = stripComments(readFileSync(join(ROOT, rel), 'utf8'));
    expect(src).not.toContain(PRESENCE_HIDDEN_LITERAL);
  });
});

// ─── 2 · Outside-fence ban — the literal lives ONLY in the helper ─────────

describe('presence adoption — `opacity-0 pointer-events-none` is helper-only', () => {
  /** Files that legitimately own the motion fade endpoint pair. */
  const ALLOW = new Set<string>([HELPER_PATH, ...ALPHA_MOTION_ENDPOINT_PATHS]);

  /** Walk every scannable file; collect lines that carry the forbidden literal. */
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
      !ln.includes(PRESENCE_HIDDEN_LITERAL) || lineIsExempt(original, i, 'alpha-ledger:exempt')
        ? []
        : [{ file: rel, line: i + 1, match: original[i].trim() }],
    );
  }

  it('no `opacity-0 pointer-events-none` literal outside the helper carve-out', () => {
    const hits = findOutsideFenceHits();
    const fixHint =
      `    → route through presenceClassOf('gone') from @/lib/design/presence,\n` +
      `      or mark the line with  // alpha-ledger:exempt — <honest reason>`;
    const message = hits
      .map((v) => `  ${v.file}:${v.line} — ${v.match}\n${fixHint}`)
      .join('\n');
    expect(hits.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (hits.length > 0) throw new Error('\n' + message);
  });

  it('the helper file owns the literal (positive pin)', () => {
    const src = readFileSync(join(ROOT, HELPER_PATH), 'utf8');
    expect(src).toContain(PRESENCE_HIDDEN_LITERAL);
  });

  it('the helper path is in `ALPHA_MOTION_ENDPOINT_PATHS`', () => {
    expect(ALPHA_MOTION_ENDPOINT_PATHS).toContain(HELPER_PATH);
  });
});

// ─── 3 · Helper invariants — the type + runtime proof ─────────────────────

describe('presenceClassOf — JIT-safe literal factory', () => {
  it('emits the canonical strings for each rung', () => {
    expect(presenceClassOf('gone')).toBe(PRESENCE_HIDDEN_LITERAL);
    expect(presenceClassOf('attentive')).toBe('opacity-100');
    expect(presenceClassOf('gifted')).toBe('opacity-100');
  });

  it('every rung in `PRESENCE_ORDER` resolves through the helper', () => {
    PRESENCE_ORDER.forEach((p) => {
      expect(typeof presenceClassOf(p)).toBe('string');
      expect(presenceClassOf(p).length).toBeGreaterThan(0);
    });
  });

  it('only the `gone` rung carries `pointer-events-none`', () => {
    expect(presenceClassOf('gone')).toContain('pointer-events-none');
    expect(presenceClassOf('attentive')).not.toContain('pointer-events-none');
    expect(presenceClassOf('gifted')).not.toContain('pointer-events-none');
  });

  it('the structural invariant holds', () => {
    expect(presenceInvariantHolds()).toBe(true);
  });
});

describe('presenceAriaHidden — ARIA carrier mirrors the visibility split', () => {
  it('returns `"true"` for `gone` (off the accessibility tree)', () => {
    expect(presenceAriaHidden('gone')).toBe('true');
  });

  it('returns `undefined` for visible rungs (omits the attribute)', () => {
    expect(presenceAriaHidden('attentive')).toBeUndefined();
    expect(presenceAriaHidden('gifted')).toBeUndefined();
  });
});

// ─── 4 · `latent` is NOT in this sprint — rule-of-zero veto ───────────────

describe('presence ledger — `latent` posture is deliberately absent', () => {
  it('PRESENCE_ORDER has exactly three rungs (gone | attentive | gifted)', () => {
    // Elon §3.2 / Mike #18 §2.4 / Tanya UIX #44 §1: `latent` ships when
    // its consumer ships (the cross-session `__rt=1` binding). Adding
    // it without a caller is rule-of-zero — speculative abstraction.
    // When the next sprint earns the fourth rung, this assertion grows
    // by one, and the fence-test rows grow by one. Doctrine arrives
    // with its consumer, not before.
    expect(PRESENCE_ORDER).toEqual(['gone', 'attentive', 'gifted']);
  });

  it('the helper source does NOT yet declare a `latent` member', () => {
    const src = readFileSync(join(ROOT, HELPER_PATH), 'utf8');
    expect(src).not.toMatch(/['"]latent['"]/);
  });
});
