/**
 * Presence Pre-Lit — single-call-site allow-list fence.
 *
 * The architectural fence around the metaphor (Mike napkin #35 §4 row 6,
 * Elon §3.4): only `components/reading/GoldenThread.tsx` is allowed to
 * override the `gone`-rung opacity with an inline JSX `style={…}` block
 * that reads `--thread-alpha-pre`. Any other file doing the same thing
 * fails CI before review notices.
 *
 * Why a fence instead of a code-review checklist (Mike #35 §4):
 *   • Stops a "subtle pre-warm" from copy-paste-spreading to
 *     `AmbientNav` or `NextRead` and breaking the chrome-rhythm
 *     continuity contract.
 *   • Stops a "doorframe glow" PR from inlining `var(--thread-alpha-pre)`
 *     onto a sibling surface — the metaphor must earn a fresh review,
 *     not slip in via the same selector.
 *   • Forecloses the speculative-abstraction trap: no second consumer,
 *     no new presence rung (`pre-lit`, `latent`). Rule of zero —
 *     `lib/design/presence.ts` keeps three rungs.
 *
 * Pure source-string lint. Uses the canonical kernel (`runJsxBlocks`)
 * from `_fence.ts` — same shape `motion-inline-style-fence.test.ts`
 * walks. ≤ 10 LoC per helper by construction.
 *
 * Allow-list shape:
 *   • The kernel modules (`lib/design/**`, `lib/return/**`,
 *     `lib/thermal/**`) are out-of-scan by directory — the Recognition
 *     Beacon and the alpha ledger legitimately author the token.
 *   • Inside the scan footprint (`app/**`, `components/**`), exactly
 *     one path is allow-listed: the one wrapper that owns the wire-up.
 *
 * Credits: Mike K. (architect, napkin #35 §4 row 6 — fence shape, scan
 * dirs, allow-list doctrine; the rule-of-three / rule-of-zero discipline
 * the fence enforces); Tanya D. (UIX #86 §4 F1–F5 — the motion contract
 * the fence guards from copycat surfaces; UIX #44 §10 — the "no chrome
 * surface unmounts mid-glance" verdict, extended to "no chrome surface
 * pre-warms mid-glance"); Sid (the source-string fence pattern lifted
 * from `motion-inline-style-fence.test.ts`).
 */

import {
  runJsxBlocks,
  type JsxBlockDecl,
  type Violation,
} from './_fence';

// ─── Scan footprint ───────────────────────────────────────────────────────

/** Directories scanned for the inline `style={{ opacity: 'var(--thread-alpha-pre, 0)' }}` shape. */
const SCAN_DIRS: readonly string[] = ['app', 'components'];

/** The one allow-listed call site — the canonical wrapper. */
const ALLOWED_CALL_SITE = 'components/reading/GoldenThread.tsx';
const ALLOW_SET: ReadonlySet<string> = new Set<string>([ALLOWED_CALL_SITE]);

// ─── The probe — the carrier expression we are gating ─────────────────────

/**
 * `var(--thread-alpha-pre…` — captures the carrier expression in any
 * fallback shape (`,0`, `, 0`, `,var(--sys-alpha-muted)`, etc.) so a
 * future variant can't slip past with a different fallback.
 */
const PRE_LIT_RX = /var\(--thread-alpha-pre/;

const FENCE: JsxBlockDecl = {
  scanDirs: SCAN_DIRS,
  anchor: /style\s*=\s*\{/g,
  open: '{',
  close: '}',
  probes: [{ regex: PRE_LIT_RX, kind: 'pre-lit-copycat' }],
  allow: ALLOW_SET,
};

// ─── Violation collector ──────────────────────────────────────────────────

function findAllViolations(): Violation[] {
  return runJsxBlocks(FENCE);
}

// ─── Failure prose — failure-message-is-documentation (Mike #38 §4) ───────

function formatViolation(v: Violation): string {
  return (
    `  ${v.file} — inline style={…} reads --thread-alpha-pre\n` +
    `    → only ${ALLOWED_CALL_SITE} may override the gone-rung opacity\n` +
    `      with this carrier. The metaphor earns a fresh review on a new surface,\n` +
    `      not a copy-paste through this fence.`
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('presence pre-lit — single call-site allow-list', () => {
  const violations = findAllViolations();

  it('no inline style={…} reads --thread-alpha-pre outside GoldenThread.tsx', () => {
    const hits = violations.filter((v) => v.kind === 'pre-lit-copycat');
    // Failure prose names the file, the rule, and the fix in one block.
    if (hits.length > 0) throw new Error('\n' + hits.map(formatViolation).join('\n'));
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('the allow-list contains exactly one entry (the canonical surface)', () => {
    // Rule of zero: a second consumer earns a fresh review and a fresh
    // allow-list edit; the fence does not silently grow.
    expect([...ALLOW_SET]).toEqual([ALLOWED_CALL_SITE]);
  });

  it('the canonical surface still carries the wire-up (positive pin)', () => {
    // If the allow-listed file ever stops carrying the carrier, the
    // fence is guarding nothing — fail loudly so the allow-list shrinks.
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const { join } = require('node:path') as typeof import('node:path');
    const ROOT = join(__dirname, '..', '..', '..');
    const src = readFileSync(join(ROOT, ALLOWED_CALL_SITE), 'utf8');
    expect(src).toMatch(PRE_LIT_RX);
  });
});

// ─── Doctrine pin — `pre-lit` is NOT a presence rung ──────────────────────

describe('presence pre-lit — `pre-lit` is not a fourth presence rung', () => {
  it('no presence ledger member is named `pre-lit` / `latent` (rule of zero)', () => {
    // The pre-warm is a STYLE on the existing `gone` rung, not a new rung.
    // Adding `pre-lit` to PRESENCE_ORDER would force three callers to
    // grow a branch that has no business being a presence beat.
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const { join } = require('node:path') as typeof import('node:path');
    const ROOT = join(__dirname, '..', '..', '..');
    const src = readFileSync(join(ROOT, 'lib', 'design', 'presence.ts'), 'utf8');
    expect(src).not.toMatch(/['"]pre-lit['"]/);
    expect(src).not.toMatch(/['"]latent['"]/);
  });
});
