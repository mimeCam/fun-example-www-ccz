/**
 * Motion Adoption Test — bare-ms / duration-* adoption guardrail.
 *
 * Every interactive surface on the site speaks one dialect of time
 * owned by `lib/design/motion.ts`. This test fails when:
 *
 *   - a bare millisecond string literal (`'150ms'`), a seconds literal
 *     (`'1.5s'`), or a Tailwind arbitrary duration (`duration-[200ms]`)
 *     slips into `components/**`, `lib/hooks/**`, or `lib/utils/**`;
 *   - a raw numeric `setTimeout(_, <ms>)` call appears in the same dirs
 *     (Mike K. §4b — the exact shape the Golden Thread's `T_LINGER=2000`
 *     constant drifted as, hiding from the string/TW scanners).
 *
 * This is not ESLint — it is a jest test. One file, zero config, one
 * allow-list. Mirrors the pattern of `pressable-adoption.test.ts`,
 * `field-adoption.test.ts`, `textlink-adoption.test.ts`.
 *
 * Paul's KPI (from the reports): `grep` for raw `ms` / `s` literals in
 * `components/**` outside `motion.ts` and tests → 0. Without this test,
 * we will regress within 3 sprints. With it, we will not.
 *
 * Credits: Mike K. (napkin §7 — adoption-guard spec; napkin #38 §4b —
 * setTimeout scanner + guard-before-diff sequence), Paul K. (KPI),
 * Tanya D. (the "why it matters" in §7 of the UX spec; UIX #69 — the
 * flagship-as-violator framing), Elon M. (the drift catches that prove
 * the test has teeth).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

/** Files that legitimately own time literals (the module itself + CSS). */
const ALLOW = new Set<string>([
  'lib/design/motion.ts',
]);

/** Directories to scan. */
const SCAN_DIRS = ['components', 'lib/utils', 'lib/hooks'];

/** File extensions to scan. */
const SCAN_EXTS = new Set<string>(['.ts', '.tsx']);

// ─── File walker (pure, ≤ 10 LOC each) ─────────────────────────────────────

function isScannableFile(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.'));
  if (!SCAN_EXTS.has(ext)) return false;
  if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) return false;
  if (path.endsWith('.d.ts')) return false;
  return !path.includes(`${sep}__tests__${sep}`);
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (isScannableFile(full)) acc.push(full);
  }
  return acc;
}

function collectFiles(): string[] {
  return SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
}

function relativePath(full: string): string {
  return relative(ROOT, full).split(sep).join('/');
}

// ─── Pattern scanners (pure, each returns a boolean) ───────────────────────

/** Match a quoted string literal whose contents are `<digits>ms` or `<digits>s`. */
function hasQuotedTimeLiteral(src: string): boolean {
  if (/['"`]\d+\s*ms['"`]/.test(src)) return true;
  return /['"`]\d+(?:\.\d+)?\s*s['"`]/.test(src);
}

/** Match a Tailwind arbitrary-duration class like `duration-[200ms]`. */
function hasTailwindArbitraryDuration(src: string): boolean {
  return /duration-\[\d+\s*ms\]/.test(src);
}

/** Match a `delay-[200ms]` Tailwind arbitrary delay. */
function hasTailwindArbitraryDelay(src: string): boolean {
  return /delay-\[\d+\s*ms\]/.test(src);
}

/**
 * Match a `setTimeout(_, N)` call where N is a numeric literal ≥ 10.
 * Allows `0` (microtask defer) and 1-9ms (sub-frame, rarely named). Anything
 * larger is a beat and should live in `MOTION` or `CEREMONY` (or a named
 * constant that quotes one). `\d{2,}` requires two or more digits to hit.
 *
 * Shape of the catch — mirrors the Thread drift exactly:
 *     setTimeout(() => setPhase('fading'), 2000)   ← caught
 *     setTimeout(() => setPhase('fading'), T_LINGER) ← caught (see next scanner)
 */
function hasNumericSetTimeout(src: string): boolean {
  return /setTimeout\s*\(\s*[^,]+,\s*\d{2,}\s*\)/.test(src);
}

// ─── Violation collector (single source of truth) ──────────────────────────

type Kind = 'quoted-time' | 'tw-duration' | 'tw-delay' | 'num-settimeout';

interface Violation {
  file: string;
  kind: Kind;
}

function check(path: string, src: string): Violation[] {
  const rel = relativePath(path);
  if (ALLOW.has(rel)) return [];
  const out: Violation[] = [];
  if (hasQuotedTimeLiteral(src)) out.push({ file: rel, kind: 'quoted-time' });
  if (hasTailwindArbitraryDuration(src)) out.push({ file: rel, kind: 'tw-duration' });
  if (hasTailwindArbitraryDelay(src)) out.push({ file: rel, kind: 'tw-delay' });
  if (hasNumericSetTimeout(src)) out.push({ file: rel, kind: 'num-settimeout' });
  return out;
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) => check(p, readFileSync(p, 'utf8')));
}

// ─── Tests — the whole point ───────────────────────────────────────────────

describe('motion adoption — every beat speaks one dialect', () => {
  const violations = findAllViolations();

  it('no quoted time literals (e.g. "150ms", "1.5s") outside lib/design/motion.ts', () => {
    const hits = violations.filter((v) => v.kind === 'quoted-time');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no Tailwind arbitrary durations (e.g. duration-[200ms])', () => {
    const hits = violations.filter((v) => v.kind === 'tw-duration');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no Tailwind arbitrary delays (e.g. delay-[400ms])', () => {
    const hits = violations.filter((v) => v.kind === 'tw-delay');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  /**
   * The flagship-catch: `setTimeout(fn, 2000)` or any raw numeric beat.
   * The failure message names `MOTION.*` / `CEREMONY.*` because that's
   * where the value should live. Per Mike K. §4b + Tanya D. §3.1:
   * the Thread's `T_LINGER` const is the poster child this scanner closes.
   */
  it('no numeric setTimeout literals (e.g. setTimeout(fn, 2000))', () => {
    const hits = violations.filter((v) => v.kind === 'num-settimeout');
    const message = hits
      .map(
        (v) =>
          `  ${v.file} — raw setTimeout(_, N) literal\n` +
          `    → use MOTION.* (150–1500) or CEREMONY.* (breath/giftDelay/glowHold)\n` +
          `      from lib/design/motion.ts, or a named constant that quotes one.`,
      )
      .join('\n');
    expect(hits.map((v) => v.file)).toEqual([]);
    if (hits.length > 0) throw new Error('\n' + message);
  });
});

// ─── Positive test — the module itself IS allowed to own numbers ───────────

describe('motion adoption — motion.ts is the one legitimate home', () => {
  it('lib/design/motion.ts contains numeric duration definitions', () => {
    const src = readFileSync(join(ROOT, 'lib/design/motion.ts'), 'utf8');
    expect(src).toMatch(/crossfade:\s*120/);
    expect(src).toMatch(/instant:\s*150/);
    expect(src).toMatch(/settle:\s*1500/);
  });
});

// ─── globals.css orphaned duration guard ──────────────────────────────────
//
// The TS/TSX scanners above guard components/ and lib/ against raw time
// literals. But CSS keyframes and `animation:`/`transition:` declarations
// in app/globals.css are opaque to those scanners — any hardcoded `Xms` or
// `X.Xs` in a CSS animation property is a future drift vector that the
// MOTION vocabulary can never enforce. This scanner closes that gap.
//
// Allow-listed exceptions (documented, intentional):
//   --thread-breathe-duration   — ThreadPulse RAF physics constant (2800ms tide cadence)
//   --sys-anim-thermal          — atmospheric ambient shift, slower than settle by design
//   --sys-skeleton-beat         — Skeleton pulse (1000ms = MOTION.linger, CSS-only alias)
//   --ch-color-dur / --ch-*     — choreography plan vars set by ThermalProvider at runtime
//
// Pattern: bare numeric milliseconds in CSS animation/transition VALUE positions
// (after the property name), outside --sys-* / --ch-* / --token-* / var() refs.
//
// Credits: Mike K. (napkin §5 — gap identification, scanner spec),
//          Paul K. (BA report — "orphaned literals are time bombs"),
//          Tanya D. (UIX §6 — all durations must map to named custom properties).

describe('motion adoption — globals.css orphaned duration guard', () => {
  function loadGlobalsCss(): string {
    return readFileSync(join(ROOT, 'app/globals.css'), 'utf8');
  }

  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  /** Strip var(prop, fallback) references — fallback values are CSS safety nets,
   *  not anonymous magic literals. We do not want to flag them as orphans.
   *  Example: `var(--rise-delay, 0ms)` → `var(STRIPPED)` */
  function stripVarFallbacks(line: string): string {
    return line.replace(/var\([^)]+\)/g, 'var(STRIPPED)');
  }

  function isAllowListedLine(line: string): boolean {
    // Exception: --thread-breathe-duration (RAF physics constant, documented)
    if (/--thread-breathe-duration/.test(line)) return true;
    // Exception: --sys-anim-* declarations (define named tokens — allow-list the block)
    if (/--sys-anim-/.test(line)) return true;
    // Exception: --sys-skeleton-beat (CSS-only alias for MOTION.linger, locked by sync test)
    if (/--sys-skeleton-beat/.test(line)) return true;
    // Exception: choreography plan vars (ThermalProvider-controlled, not design beats)
    if (/--ch-/.test(line)) return true;
    // Exception: pure CSS custom property declarations (left-hand side)
    // These define named tokens — their values are the system source, not orphans.
    if (/^\s*--[\w-]+:/.test(line)) return true;
    return false;
  }

  /** 0.01ms is the universal reduced-motion floor constant (MOTION_REDUCED_MS = 10).
   *  It appears in prefers-reduced-motion blocks and forced-colors blocks.
   *  It is not a design beat — it is the floor below which animations are imperceptible.
   *  Allow-list it explicitly so the scanner does not flag accessibility overrides. */
  function isReducedMotionFloor(line: string): boolean {
    return /\b0\.01ms\b/.test(line);
  }

  /** 0ms (zero delay/duration) is trivially zero — not a named beat. Allow-list. */
  function isTrivialZero(line: string): boolean {
    return /\b0ms\b/.test(line) && !/\d+0ms\b/.test(line);
  }

  function findOrphanedDurations(css: string): string[] {
    const stripped = stripComments(css);
    const violations: string[] = [];
    stripped.split('\n').forEach((line, idx) => {
      if (isAllowListedLine(line)) return;
      if (isReducedMotionFloor(line)) return;
      const lineWithoutVars = stripVarFallbacks(line);
      if (isTrivialZero(lineWithoutVars)) return;
      // Match bare numeric ms/s values in animation/transition value positions.
      // Catches: `animation: foo 400ms ...`, `transition: color 0.8s ...`
      // Does NOT catch: `--sys-*: 120ms` (allow-listed above) or var() refs (stripped).
      const hasMs = /(?<![a-zA-Z-])\d+ms\b/.test(lineWithoutVars);
      const hasS  = /(?<![a-zA-Z-])\d+(?:\.\d+)?s\b/.test(lineWithoutVars);
      if (hasMs || hasS) {
        violations.push(`  line ${idx + 1}: ${line.trim()}`);
      }
    });
    return violations;
  }

  it('no orphaned raw ms/s duration literals in animation or transition declarations', () => {
    const css = loadGlobalsCss();
    const violations = findOrphanedDurations(css);
    const message =
      violations.length > 0
        ? `\nOrphaned time literals found in app/globals.css:\n` +
          violations.join('\n') +
          `\n\nFix: wire to --sys-anim-* (aliasing --sys-time-*) or document the exception.\n` +
          `See AGENTS.md §Motion Beat Pairing Contract.`
        : '';
    expect(violations).toEqual([]);
    if (violations.length > 0) throw new Error(message);
  });
});
