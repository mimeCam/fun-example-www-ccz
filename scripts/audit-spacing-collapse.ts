/**
 * audit-spacing-collapse — find every site where a portal short-circuits
 * to `null` while a sibling silently compensates with a `mt-sys-N` rung.
 *
 *   $ npx tsx scripts/audit-spacing-collapse.ts
 *
 * Run locally; tune the regex against the next finding. **NOT** wired
 * into CI (Mike #2 §6.5 — report-only tool, not a gate; scope-creep ban).
 *
 * What this catches (Mike #2 §6.1):
 *   – `if (surface !== 'whisper') return null;` with a sibling that
 *     carries a top-margin rung in the same render tree. The sibling
 *     is silently doing the portal's job — polymorphism via margin
 *     arithmetic. Move the margin to the portal's envelope (use
 *     `<CollapsibleSlot>` from `components/shared/`).
 *
 * What this does NOT catch (and that's fine):
 *   – Conditional renders behind a more complex predicate.
 *   – Margin-on-padding compositions inside a `style={{ ... }}` block.
 *   – Collapses through nested fragments more than one component deep.
 *   The scanner reports the obvious cases; the next genuine miss earns
 *   a regex tune. (Mike #2 §6.5 — "let the next finding earn its tuning.")
 *
 * Output: a punch list per finding — file path, line numbers for the
 * portal short-circuit and the suspected compensating sibling, plus the
 * one-sentence remediation lens.
 *
 * Credits: Mike K. (#2 §6.1 — the static-scanner punch-list, the
 * "report-only, not a gate" discipline, the regex shape), Elon M.
 * (the "audit other zero-height-portal-adjacent spacing sites" call
 * Mike credits in #2 §Credits), Tanya D. (#3 §5 — the lens this script
 * prints as the remediation hint).
 */

import { readFileSync, statSync, readdirSync } from 'fs';
import { join, relative, resolve } from 'path';

// ─── Configuration — pure constants ──────────────────────────────────────

const ROOT = resolve(__dirname, '..');
const SCAN_DIRS = ['app', 'components', 'lib'] as const;
const SCAN_EXTS = ['.ts', '.tsx'] as const;
const SKIP_DIRS = new Set(['node_modules', '.next', '__tests__', 'logs']);

/**
 * The portal-collapse regex. Catches `surface !== 'X' return null`
 * shapes — both arrow form (`=>`) and statement form (`if (...) return`).
 */
const PORTAL_COLLAPSE = /surface\s*!==\s*['"]\w+['"][\s\S]{0,40}?return\s+null/g;

/** A `mt-sys-N` Tailwind class anywhere in the file. */
const TOP_MARGIN_CLASS = /\bmt-sys-(\d+)\b/g;

/** The one-sentence remediation lens, printed at the bottom of each finding. */
const REMEDIATION_LENS =
  'Move the breath to the portal envelope: wrap with <CollapsibleSlot top? bottom?> ' +
  'so the gap survives the null branch. Mike #2 §5 / Tanya #3 §5.';

// ─── Pure helpers — each ≤10 LOC ─────────────────────────────────────────

/** Recursively walk a directory, yielding every file path under it. */
function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

/** True iff the file path ends in one of the scanned extensions. */
const isScanTarget = (path: string): boolean =>
  SCAN_EXTS.some((ext) => path.endsWith(ext));

/** Convert a string offset into a 1-based line number. Pure. */
function lineOf(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

/** Match a regex globally and return all `{ index, match }` pairs. Pure. */
function findAll(source: string, rx: RegExp): Array<{ index: number; text: string }> {
  return Array.from(source.matchAll(rx)).map((m) => ({
    index: m.index ?? 0,
    text: m[0],
  }));
}

/**
 * One finding: a file with at least one portal collapse AND at least
 * one `mt-sys-N` reference somewhere in the same file. Pure data.
 */
interface Finding {
  readonly file: string;
  readonly portalLines: readonly number[];
  readonly marginLines: readonly number[];
}

/** Build a Finding from a file's source, or `null` when nothing matches. */
function findingFor(file: string, source: string): Finding | null {
  const portals = findAll(source, PORTAL_COLLAPSE);
  if (portals.length === 0) return null;
  const margins = findAll(source, TOP_MARGIN_CLASS);
  if (margins.length === 0) return null;
  return buildFinding(file, source, portals, margins);
}

/** Compose the Finding record from raw matches. Pure. */
function buildFinding(
  file: string,
  source: string,
  portals: ReadonlyArray<{ index: number }>,
  margins: ReadonlyArray<{ index: number }>,
): Finding {
  return {
    file,
    portalLines: portals.map((p) => lineOf(source, p.index)),
    marginLines: margins.map((m) => lineOf(source, m.index)),
  };
}

// ─── Reporting — each ≤10 LOC ────────────────────────────────────────────

/** Print one finding's punch list to stdout. Side-effect (console). */
function printFinding(f: Finding): void {
  const rel = relative(ROOT, f.file);
  console.log(`\n  ${rel}`);
  console.log(`    portal-collapse:  line(s) ${f.portalLines.join(', ')}`);
  console.log(`    mt-sys-N nearby:  line(s) ${f.marginLines.join(', ')}`);
  console.log(`    lens:             ${REMEDIATION_LENS}`);
}

/** Print the audit header. Side-effect (console). */
function printHeader(): void {
  console.log('━'.repeat(72));
  console.log('audit-spacing-collapse — portal-null + sibling-margin punch list');
  console.log('━'.repeat(72));
}

/** Print the audit footer with the running counts. Side-effect (console). */
function printFooter(scanned: number, found: number): void {
  console.log('\n' + '━'.repeat(72));
  console.log(`scanned ${scanned} file(s) · ${found} finding(s)`);
  console.log('━'.repeat(72) + '\n');
}

// ─── Entry — orchestration only, ≤10 LOC ─────────────────────────────────

/** Run the audit. Returns the count of findings (for an exit code). */
function audit(): number {
  printHeader();
  let scanned = 0, found = 0;
  for (const file of allScanTargets()) {
    scanned++;
    const finding = findingFor(file, readFileSync(file, 'utf-8'));
    if (finding) { printFinding(finding); found++; }
  }
  printFooter(scanned, found);
  return found;
}

/** Iterator of every scan target across the configured roots. Pure. */
function* allScanTargets(): Generator<string> {
  for (const dir of SCAN_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      if (isScanTarget(file)) yield file;
    }
  }
}

audit();
