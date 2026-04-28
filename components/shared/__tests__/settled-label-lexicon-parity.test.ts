/**
 * settled-label-lexicon-parity — fence smoke around the fingertip witness'
 * verb vocabulary.
 *
 * Mike #94 §2.4 — "each of the five carriers' `settledLabel` resolves
 * through `reply-lexicon.ts` and not a hard-coded string literal." Tanya
 * UX #76 §3.4 — "visible label stays hard-coded English-past-tense; the
 * archetype tone lives elsewhere." Both are satisfied by the same
 * discipline: the visible JSX literal is written in plain English, but its
 * legality is gated by a *closed set* the lexicon owns
 * (`SETTLED_RECEIPT_VERBS`).
 *
 * Two axes — kernel-first, no AST. Rides `_fence.ts` (the same kernel the
 * label-swap-width / action-receipt / lean-arrow fences share).
 *
 *   Axis A — Carrier inventory.
 *     Every `<ActionPressable …>` opening tag in `app/` + `components/`
 *     either carries a literal `settledLabel="X"` attribute, OR forwards
 *     a prop (e.g. `<SecondaryAction settledLabel={p.settledLabel} />`).
 *     Forwarders are out of this fence's scope — the tail-call lands on a
 *     literal somewhere up the tree, and that literal IS scanned. We
 *     count the literals, not the JSX hosts.
 *
 *   Axis B — Vocabulary lock.
 *     Each `settledLabel="X"` literal — after stripping a single trailing
 *     punctuation character (`!` / `.`) and the surrounding quotes — must
 *     belong to `SETTLED_RECEIPT_VERBS` from `lib/sharing/reply-lexicon.ts`.
 *     A literal off the set is the bug Mike named: a future contributor
 *     hard-coded `"Copied"` (or worse, `"Yay!"`) without crossing the
 *     lexicon module. The carrier loses voice-discipline; the row's two-
 *     organ paint (eye + ear) drifts apart. The fence catches it before
 *     the reader does.
 *
 * Failure prose is the product (Mike §6 / Tanya §2). Three blocks per
 * violation: `loc — summary` / `detail` / `prescription`. The contributor
 * sees the legal vocabulary and the path back to it.
 *
 * Scope:
 *   IN  — `app/**`, `components/**` (the reader-facing surface)
 *   OUT — `__tests__/**` (kernel walker's `isScannableFile` excludes them)
 *   OUT — `lib/**` (no JSX hosts; the lexicon itself lives there)
 *
 * Credits: Mike K. (#94 §2.4 — "settledLabel resolves through the
 * lexicon", §6.6 — "fix by routing — not by adding strings"; the
 * three-block failure-prose template), Tanya D. (UX #76 §3.4 — "visible
 * label hard-coded English-past-tense; status quo holds; this audit
 * confirms no bug lurks"), Krystle C. (the original verb-table that
 * `SETTLED_RECEIPT_VERBS` enumerates), Sid (this lift — fifth tenant on
 * `_fence.ts`, no new conventions).
 */

import {
  preloadFiles,
  readBalancedDelimiters,
  lineAt,
  formatBlock,
} from '../../../lib/design/__tests__/_fence';
import { SETTLED_RECEIPT_VERBS } from '@/lib/sharing/reply-lexicon';

// ─── Scan footprint ────────────────────────────────────────────────────────

const SCAN_DIRS: readonly string[] = ['app', 'components'];
const HOST_NAME = 'ActionPressable';

const preloadAll = (): readonly { rel: string; src: string }[] =>
  preloadFiles(SCAN_DIRS);

// ─── JSX opening-tag walker (parallels label-swap-width-fence shape) ──────

interface HostOpening { index: number; attrs: string }

function findHostOpenings(src: string): HostOpening[] {
  const out: HostOpening[] = [];
  const rx = new RegExp(`<${HOST_NAME}\\b`, 'g');
  for (const m of src.matchAll(rx)) {
    const start = (m.index ?? 0) + m[0].length;
    const end = findElementClose(src, start);
    if (end < 0) continue;
    out.push({ index: m.index ?? 0, attrs: src.slice(start, end) });
  }
  return out;
}

function findElementClose(src: string, start: number): number {
  let i = start;
  while (i < src.length) {
    const c = src[i];
    if (c === '{') {
      const r = readBalancedDelimiters(src, i, '{', '}');
      if (r === null) return -1;
      i = r.end + 1; continue;
    }
    if (c === '>') return i;
    i++;
  }
  return -1;
}

// ─── settledLabel extraction ──────────────────────────────────────────────

interface LabelLiteral { value: string; index: number }

/**
 * Pull a `settledLabel="…"` STRING literal off the host's attrs body.
 * Returns `null` for forwarded props (`settledLabel={p.settledLabel}`) —
 * those lower into a literal somewhere up the tree, not here.
 */
function extractSettledLabelLiteral(attrs: string): LabelLiteral | null {
  const m = /\bsettledLabel\s*=\s*(["'])([^"']*)\1/.exec(attrs);
  if (m === null) return null;
  return { value: m[2], index: m.index ?? 0 };
}

// ─── Vocabulary check ────────────────────────────────────────────────────

const LEGAL_VERB_SET: ReadonlySet<string> = new Set(SETTLED_RECEIPT_VERBS);

/** Strip a single trailing `!` or `.` from a settled label, if present. */
function stripTrailingPunctuation(value: string): string {
  return value.replace(/[!.]+$/, '');
}

/** True iff the literal is a legal verb after one trailing-punct strip. */
function isLegalSettledLabel(value: string): boolean {
  return LEGAL_VERB_SET.has(stripTrailingPunctuation(value));
}

// ─── Violation collection ────────────────────────────────────────────────

interface Violation { file: string; line: number; literal: string }

function violationsForFile(rel: string, src: string): Violation[] {
  return findHostOpenings(src)
    .map((op) => violationForOpening(rel, src, op))
    .filter((v): v is Violation => v !== null);
}

function violationForOpening(
  rel: string, src: string, op: HostOpening,
): Violation | null {
  const lit = extractSettledLabelLiteral(op.attrs);
  if (lit === null) return null;                      // forwarded prop
  if (isLegalSettledLabel(lit.value)) return null;    // canonical verb
  return { file: rel, line: lineAt(src, op.index), literal: lit.value };
}

let cachedViolations: Violation[] | null = null;

function scanAllViolations(): Violation[] {
  if (cachedViolations !== null) return cachedViolations;
  cachedViolations = preloadAll()
    .filter(({ rel }) => rel.endsWith('.tsx'))
    .flatMap(({ rel, src }) => violationsForFile(rel, src));
  return cachedViolations;
}

// ─── Failure prose (Mike §6 — failure messages are documentation) ─────────

function vocabularyTable(): string {
  return SETTLED_RECEIPT_VERBS
    .map((v) => `      • "${v}"  (or "${v}!" — exclamation tolerated)`)
    .join('\n');
}

function formatViolation(v: Violation): string {
  const summary = `<${HOST_NAME} settledLabel="${v.literal}"> is off-vocabulary`;
  const body =
    `    The fingertip witness has a closed verb vocabulary owned by\n` +
    `    \`lib/sharing/reply-lexicon.ts\` (Mike #94 §2.4 — settledLabel\n` +
    `    resolves through the lexicon; Tanya UX #76 §3.4 — visible label\n` +
    `    stays hard-coded English-past-tense). Legal labels:\n\n` +
    vocabularyTable() + `\n\n` +
    `    Either pick one of the legal verbs, or extend the lexicon's\n` +
    `    \`SETTLED_RECEIPT_VERBS\` set after a code review (a sixth verb\n` +
    `    is the rule-of-three trigger for promoting the JSDoc carrier\n` +
    `    list to a const; see ActionPressable.tsx top-of-file).`;
  return formatBlock(`${v.file}:${v.line}`, summary, body);
}

// ─── Tests ───────────────────────────────────────────────────────────────

describe('settled-label-lexicon-parity — Axis A · carrier inventory', () => {
  it('SETTLED_RECEIPT_VERBS is the documented closed set (3 verbs today)', () => {
    expect([...SETTLED_RECEIPT_VERBS]).toEqual(['Copied', 'Saved', 'Shared']);
  });

  it('at least four settledLabel literals exist in the scanned tree', () => {
    // Floor: ReturnLetter (1) + ShareOverlay (1) + QuoteKeepsake.PrimaryShare
    // + .SecondaryAction (forwards) + ThreadKeepsake.PrimaryShare
    // + .SecondaryAction (forwards) + SelectionShareTrigger (1) ≈ 4 literals.
    // Forwarded props don't count; literal extraction is the floor.
    const total = preloadAll()
      .filter(({ rel }) => rel.endsWith('.tsx'))
      .reduce((n, { src }) => n + countLiteralsIn(src), 0);
    expect(total).toBeGreaterThanOrEqual(4);
  });
});

function countLiteralsIn(src: string): number {
  return findHostOpenings(src)
    .filter((op) => extractSettledLabelLiteral(op.attrs) !== null)
    .length;
}

describe('settled-label-lexicon-parity — Axis B · vocabulary lock', () => {
  it('every settledLabel literal is in SETTLED_RECEIPT_VERBS (after trailing-punct strip)', () => {
    const violations = scanAllViolations();
    expect(violations.map((v) => `${v.file}:${v.line} "${v.literal}"`)).toEqual([]);
    if (violations.length > 0) {
      throw new Error('\n' + violations.map(formatViolation).join('\n\n'));
    }
  });

  it('the legal-verb table the failure prose names is non-empty', () => {
    expect(vocabularyTable().split('\n').length).toBe(SETTLED_RECEIPT_VERBS.length);
  });

  it('the trailing-punctuation stripper is one char only (Tanya §3.4)', () => {
    // The lexicon admits exclamation as an emphasis-tinted variant of the
    // verb (ShareOverlay's "Copied!"). Multiple trailing punctuation marks
    // ("Copied!!", "Copied?!") are off-spec — the stripper proves it.
    expect(stripTrailingPunctuation('Copied')).toBe('Copied');
    expect(stripTrailingPunctuation('Copied!')).toBe('Copied');
    expect(stripTrailingPunctuation('Copied.')).toBe('Copied');
    expect(stripTrailingPunctuation('Yay')).toBe('Yay');
    expect(isLegalSettledLabel('Copied')).toBe(true);
    expect(isLegalSettledLabel('Copied!')).toBe(true);
    expect(isLegalSettledLabel('Yay')).toBe(false);
  });
});
