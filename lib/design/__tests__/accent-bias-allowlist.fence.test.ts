/**
 * Accent-Bias Allow-List — single-call-site fence.
 *
 * The architectural fence around the metaphor (Mike napkin #77 §4 row,
 * Tanya UIX #28 §4 layer audit): only `components/reading/GoldenThread.tsx`
 * is allowed to author an inline JSX `style={…}` block that carries a
 * `hue-rotate(...)` filter reading `--thread-bias`. Any other file doing
 * the same thing fails CI before review notices.
 *
 * Why a fence instead of a code-review checklist (Mike #77 §5 POI 1):
 *   • Stops a "subtle archetype lean" from copy-paste-spreading to
 *     `AmbientNav`, `NextRead`, the `ArchetypeChip` border, or any
 *     other chrome surface — every new lean is a rung change and earns
 *     a fresh review (Tanya UIX #28 §5 — the chip is rung 3, the spine
 *     is rung 2; mixing rungs collapses the ladder).
 *   • Stops `--accent-bias` (the WHEEL ANCHOR, NOT the applied delta)
 *     from being consumed directly with a `hue-rotate` — anchor values
 *     are full-wheel positions (e.g. 280° for deep-diver) and would
 *     spin the entire thermal palette far past JND.
 *   • Forecloses the speculative-abstraction trap: rule of three has
 *     not fired. The carrier expression is named after the surface
 *     (`THREAD_*`); when surface #2 wants to lean, it earns a new
 *     surface-keyed delta — not a copy-paste through this fence.
 *
 * Pure source-string lint. Uses the canonical kernel (`runJsxBlocks`
 * for the JSX-block fences, `runLinePatterns` for the doctrine pin) so
 * comment-stripping is shared and the kernel cache is honored.
 *
 * Allow-list shape:
 *   • The kernel modules (`lib/design/**`, `lib/return/**`,
 *     `lib/thermal/**`) are out-of-scan by directory — the carrier
 *     expression legitimately lives in `lib/design/accent-bias.ts`.
 *   • Inside the scan footprint (`app/**`, `components/**`), exactly
 *     one path is allow-listed: the wrapper that owns the wire-up.
 *
 * Credits: Mike K. (architect, napkin #77 §4 — fence shape, scan dirs,
 * allow-list doctrine; the rule-of-zero discipline the fence enforces),
 * Tanya D. (UIX #28 §3 — applied vs. anchor reconciliation; UIX #28 §5
 * — layer audit, the rung-by-rung map of which surfaces may lean and
 * which may not), Sid (the source-string fence pattern lifted from
 * `presence-pre-lit-allowlist.test.ts` byte-for-byte).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  runJsxBlocks,
  runLinePatterns,
  type FenceDecl,
  type JsxBlockDecl,
  type Violation,
} from './_fence';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Scan footprint ───────────────────────────────────────────────────────

/** Directories scanned for inline `style={{ filter: 'hue-rotate(...)' }}` shapes. */
const SCAN_DIRS: readonly string[] = ['app', 'components'];

/** The one allow-listed call site — the canonical wrapper. */
const ALLOWED_CALL_SITE = 'components/reading/GoldenThread.tsx';
const ALLOW_SET: ReadonlySet<string> = new Set<string>([ALLOWED_CALL_SITE]);

// ─── The probes — the carrier expression fragments we are gating ──────────

const HUE_ROTATE_RX = /hue-rotate\s*\(/;
const THREAD_BIAS_RX = /var\(--thread-bias/;

const FENCE: JsxBlockDecl = {
  scanDirs: SCAN_DIRS,
  anchor: /style\s*=\s*\{/g,
  open: '{',
  close: '}',
  probes: [
    { regex: HUE_ROTATE_RX, kind: 'hue-rotate-copycat' },
    { regex: THREAD_BIAS_RX, kind: 'thread-bias-copycat' },
  ],
  allow: ALLOW_SET,
};

// ─── Failure prose — failure-message-is-documentation (Mike #38 §4) ───────

function formatViolation(v: Violation): string {
  return (
    `  ${v.file} — inline style={…} carries ${v.kind}\n` +
    `    [lane: ambient — sealed]\n` +
    `    → only ${ALLOWED_CALL_SITE} may lean via THREAD_ACCENT_BIAS_FILTER\n` +
    `      on the AMBIENT lane (the Golden Thread spine fill — the one\n` +
    `      site-state-triggered surface that consumes --thread-bias).\n` +
    `      The AMBIENT lane is SEALED — no new entries this year.\n` +
    `      A new gesture-triggered surface (caret-color, link :active flash,\n` +
    `      …) belongs to the RECIPROCAL lane — see\n` +
    `      \`focus-reciprocal-lane.fence.test.ts\` and\n` +
    `      \`accent-bias.ts §"Two-Lane Contract"\`. A new leaning surface\n` +
    `      earns its own surface-keyed delta and a fresh review — not a\n` +
    `      copy-paste through this fence.`
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('accent-bias — single call-site allow-list', () => {
  const violations = runJsxBlocks(FENCE);

  it('no inline style={…} authors hue-rotate(...) outside GoldenThread.tsx', () => {
    const hits = violations.filter((v) => v.kind === 'hue-rotate-copycat');
    if (hits.length > 0) throw new Error('\n' + hits.map(formatViolation).join('\n'));
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no inline style={…} reads var(--thread-bias…) outside GoldenThread.tsx', () => {
    const hits = violations.filter((v) => v.kind === 'thread-bias-copycat');
    if (hits.length > 0) throw new Error('\n' + hits.map(formatViolation).join('\n'));
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('the allow-list contains exactly one entry (the canonical surface)', () => {
    expect([...ALLOW_SET]).toEqual([ALLOWED_CALL_SITE]);
  });

  it('the canonical surface still carries the wire-up (positive pin)', () => {
    // If the allow-listed file ever stops carrying the carrier, the
    // fence is guarding nothing — fail loudly so the allow-list shrinks.
    const src = readFileSync(join(ROOT, ALLOWED_CALL_SITE), 'utf8');
    expect(src).toMatch(/THREAD_ACCENT_BIAS_FILTER/);
  });
});

// ─── Doctrine pin — `--accent-bias` is NOT a hue-rotate input ─────────────

/**
 * Direct consumption of `--accent-bias` would spin the thermal palette
 * by full wheel-anchor degrees (e.g. 280° for deep-diver) — past JND,
 * past every spec window. The applied lean MUST go through the
 * surface-keyed `--thread-bias` clamp.
 *
 * Routed through `runLinePatterns` so comment-stripping is shared with
 * the rest of the kernel (a comment containing the literal won't false-
 * positive) and the read cache is honored.
 */
const WHEEL_ANCHOR_FENCE: FenceDecl = {
  scanDirs: ['app', 'components', 'lib'],
  patterns: [{
    regex: /hue-rotate\s*\(\s*[^)]*var\s*\(\s*--accent-bias[^)]*\)/,
    allow: new Set<string>(),
    kind: 'wheel-anchor-as-rotate',
  }],
  exemptToken: 'accent-bias-fence:exempt',
};

describe('accent-bias — wheel anchor is not a hue-rotate input', () => {
  it('no source file consumes var(--accent-bias) inside hue-rotate(...)', () => {
    const offenders = runLinePatterns(WHEEL_ANCHOR_FENCE);
    expect(offenders.map((v) => v.file)).toEqual([]);
  });
});
