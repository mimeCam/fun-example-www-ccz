/**
 * share-pulse-symmetry — the fence that pins the dyadic gold-pulse contract.
 *
 * The share gesture warms the *same paragraph* at both ends with the *same*
 * primitive. Recipient: `useSharedHighlightOnLand` →
 * `scrollToSharedHighlight` → `createTemporaryHighlight` →
 * `pulseElementGold`. Sender: `SelectionShareTrigger.useShareClick` →
 * `pulseElementGold`. Two callers, one atom, one source of gold.
 *
 * Pinned axes (one falsifiable claim per `it`):
 *
 *   1. Positive existence — `pulseElementGold` is imported by exactly two
 *      non-test files: `lib/sharing/highlight-finder.ts` (recipient
 *      passthrough) AND `components/resonances/SelectionShareTrigger.tsx`
 *      (sender direct). A third importer fails the fence; either of the
 *      two missing fails the fence.
 *   2. One color source — `var(--gold)` appears exactly once in the helper
 *      (inside `HIGHLIGHT_TINT`). No raw rgba, no `lighter-on-sender`
 *      fork, no `var(--gold) 12%` drift.
 *   3. Reduced-motion parity — both call-sites consult `useReducedMotion`
 *      in their transitive closure (sender directly; recipient via
 *      `useSharedHighlightOnLand`).
 *   4. Witness gate — the sender call defers the pulse by
 *      `MOTION.crossfade + MOTION_REDUCED_MS` so the popover-exit beat
 *      clears the stage (Tanya UIX §2 sequenced timeline).
 *   5. Hold parity — `PULSE_DWELL_MS` is the single home for the 3 s
 *      teardown. Both callers reach for the same constant.
 *
 * The failure message IS the documentation (Mike #38 §4). When CI goes
 * red, the next maintainer can fix it without a metaphor lookup.
 *
 * Credits: Mike K. (#92 — the fence napkin: positive existence, three
 * axes minimum, one assertion per claim), Tanya D. (#68 — added the
 * witness-gate axis and the hold-parity axis; "five axes, one shape"),
 * Sid (this lift; walker pattern from `orphan-graduates.fence.test.ts`,
 * one-color-source pattern from `chrome-color-mix-banned.fence.test.ts`).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');
const SCAN_DIRS = ['app', 'components', 'lib'];
const SCAN_EXTS = new Set<string>(['.ts', '.tsx']);

const HELPER_REL = 'lib/sharing/highlight-pulse.ts';
const HELPER_FULL = join(ROOT, HELPER_REL);
/**
 * Match either the absolute `@/lib/sharing/highlight-pulse` import (the
 * convention from `components/`) or the relative `./highlight-pulse`
 * sibling import (the convention inside `lib/sharing/`).
 */
const IMPORT_RX =
  /from\s+['"](?:@\/lib\/sharing\/highlight-pulse|\.\/highlight-pulse)['"]/;

/** The two — and only two — non-test files allowed to import the helper. */
const EXPECTED_IMPORTERS: ReadonlySet<string> = new Set([
  'lib/sharing/highlight-finder.ts',
  'components/resonances/SelectionShareTrigger.tsx',
]);

// ─── File walker (lifted from orphan-graduates — copy, do not reinvent) ──

function isScannableFile(p: string): boolean {
  const ext = p.slice(p.lastIndexOf('.'));
  if (!SCAN_EXTS.has(ext)) return false;
  if (p.endsWith('.test.ts') || p.endsWith('.test.tsx')) return false;
  if (p.endsWith('.d.ts')) return false;
  return !p.includes(`${sep}__tests__${sep}`);
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (isScannableFile(full)) acc.push(full);
  }
  return acc;
}

function relPath(full: string): string {
  return relative(ROOT, full).split(sep).join('/');
}

function collectScannableFiles(): string[] {
  return SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
}

function findImporters(): string[] {
  return collectScannableFiles()
    .filter((p) => p !== HELPER_FULL && IMPORT_RX.test(readFileSync(p, 'utf8')))
    .map(relPath);
}

// ─── 1 · Positive existence — exactly two callers, named ─────────────────

describe('share-pulse-symmetry · two callers, one primitive', () => {
  it('exactly the two expected files import @/lib/sharing/highlight-pulse', () => {
    const importers = new Set(findImporters());
    const missing = [...EXPECTED_IMPORTERS].filter((p) => !importers.has(p));
    const extra = [...importers].filter((p) => !EXPECTED_IMPORTERS.has(p));
    if (missing.length > 0 || extra.length > 0) {
      throw new Error(
        '\nshare-pulse-symmetry: importer set drifted.\n' +
        (missing.length
          ? `  Missing (the dyad lost a leg): ${missing.join(', ')}\n`
          : '') +
        (extra.length
          ? `  Unexpected (a third caller appeared): ${extra.join(', ')}\n`
          : '') +
        '  Expected exactly two non-test importers — the recipient passthrough\n' +
        '  in highlight-finder.ts and the sender direct call in\n' +
        '  SelectionShareTrigger.tsx. New "two-mind moments" inherit the\n' +
        '  primitive on their own merits, with their own fence amendment.\n',
      );
    }
    expect(importers.size).toBe(EXPECTED_IMPORTERS.size);
  });

  it('the recipient call-site (highlight-finder.ts) is wired', () => {
    const src = readFileSync(join(ROOT, 'lib/sharing/highlight-finder.ts'), 'utf8');
    expect(src).toMatch(/pulseElementGold/);
    expect(src).toMatch(IMPORT_RX);
  });

  it('the sender call-site (SelectionShareTrigger.tsx) is wired', () => {
    const src = readFileSync(
      join(ROOT, 'components/resonances/SelectionShareTrigger.tsx'),
      'utf8',
    );
    expect(src).toMatch(/pulseElementGold/);
    expect(src).toMatch(IMPORT_RX);
  });
});

// ─── 2 · One color source ────────────────────────────────────────────────

describe('share-pulse-symmetry · one source of gold', () => {
  it('var(--gold) appears exactly once in the helper (excluding docs)', () => {
    // Strip comments so the docstring's quote of HIGHLIGHT_TINT doesn't
    // double-count. We're guarding shipped *code*, not prose.
    const code = stripComments(readFileSync(HELPER_FULL, 'utf8'));
    const matches = code.match(/var\(--gold\)/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('the helper does not ship a raw rgba literal as a fork', () => {
    const code = stripComments(readFileSync(HELPER_FULL, 'utf8'));
    expect(code).not.toMatch(/rgba\s*\(\s*\d/);
  });

  it('no caller shadows the tint with its own var(--gold) literal', () => {
    // The two importers must rely on HIGHLIGHT_TINT — neither may inline
    // its own gold mixer. Comments are stripped so the docstring's
    // example inside SelectionShareTrigger does not false-positive.
    for (const rel of EXPECTED_IMPORTERS) {
      const stripped = stripComments(readFileSync(join(ROOT, rel), 'utf8'));
      expect(stripped).not.toMatch(/var\(--gold\)/);
    }
  });
});

// ─── 3 · Reduced-motion parity ───────────────────────────────────────────

describe('share-pulse-symmetry · reduced-motion parity', () => {
  it('the sender call-site reads useReducedMotion directly', () => {
    const src = readFileSync(
      join(ROOT, 'components/resonances/SelectionShareTrigger.tsx'),
      'utf8',
    );
    expect(src).toMatch(/useReducedMotion/);
    expect(src).toMatch(/from\s+['"]@\/lib\/hooks\/useReducedMotion['"]/);
  });

  it('the recipient closure reaches useReducedMotion via the landing hook', () => {
    const src = readFileSync(
      join(ROOT, 'lib/hooks/useSharedHighlightOnLand.ts'),
      'utf8',
    );
    expect(src).toMatch(/useReducedMotion/);
    expect(src).toMatch(/scrollToSharedHighlight\([^)]*reduced/);
  });
});

// ─── 4 · Witness gate (sender-side timing) ───────────────────────────────

describe('share-pulse-symmetry · witness gate', () => {
  it('sender defers via MOTION.crossfade + MOTION_REDUCED_MS', () => {
    const src = readFileSync(
      join(ROOT, 'components/resonances/SelectionShareTrigger.tsx'),
      'utf8',
    );
    // Greppable — the gate constant must be composed from the two
    // canonical motion atoms, NOT a magic literal.
    expect(src).toMatch(/MOTION\.crossfade\s*\+\s*MOTION_REDUCED_MS/);
    expect(src).toMatch(/SHARE_PULSE_GATE_MS/);
  });

  it('the gate value matches the popover-exit beat (130 ms)', () => {
    // Pin the math to the design-system ledger. If MOTION.crossfade
    // shifts (it should not), this test fires before the field does.
    const motion = require('@/lib/design/motion');
    expect(motion.MOTION.crossfade + motion.MOTION_REDUCED_MS).toBe(130);
  });
});

// ─── 5 · Hold parity ─────────────────────────────────────────────────────

describe('share-pulse-symmetry · hold parity', () => {
  it('PULSE_DWELL_MS is exported from the helper as 3000 ms', () => {
    const { PULSE_DWELL_MS } = require('../highlight-pulse');
    expect(PULSE_DWELL_MS).toBe(3000);
  });

  it('the recipient call-site uses PULSE_DWELL_MS (no magic 3000)', () => {
    const stripped = stripComments(
      readFileSync(join(ROOT, 'lib/sharing/highlight-finder.ts'), 'utf8'),
    );
    expect(stripped).toMatch(/PULSE_DWELL_MS/);
    // Allow the literal in the helper's home only — the recipient must
    // not re-encode `3000` as a magic number.
    expect(stripped).not.toMatch(/setTimeout\([^,]+,\s*3000\)/);
  });

  it('the sender call-site uses PULSE_DWELL_MS (no magic 3000)', () => {
    const stripped = stripComments(
      readFileSync(
        join(ROOT, 'components/resonances/SelectionShareTrigger.tsx'),
        'utf8',
      ),
    );
    expect(stripped).toMatch(/PULSE_DWELL_MS/);
    expect(stripped).not.toMatch(/setTimeout\([^,]+,\s*3000\)/);
  });
});

// ─── Comment stripper — minimal, line-preserving ─────────────────────────

/**
 * Three-pass strip — JSX `{/* … *\/}`, JS block `/* … *\/`, JS line `// …`.
 * Lifted from `lib/design/__tests__/_fence.ts`'s `stripComments` (the
 * canonical kernel) but inlined here so this fence is dependency-free
 * and the failure stack is one frame shorter.
 */
function stripComments(src: string): string {
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, ' '));
}
