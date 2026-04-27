/**
 * Motion Inline-Style Fence — `var(--sys-time-*)` / `var(--sys-ease-*)`
 * MUST NOT appear inside any JSX `style={…}` block in `app/**` or
 * `components/**`. Motion timing is owned by the Gesture Atlas
 * (`lib/design/gestures.ts`) which emits LITERAL Tailwind class
 * fragments Tailwind's JIT can see in source. Pasting the same tokens
 * via inline `style.transition` sidesteps every guard in the room —
 * `gestures-sync`, `gestures-call-site-rhythm`, the bare-class lint,
 * the `useReducedMotion` seam — and the only way to forbid it
 * structurally is to scan the source.
 *
 * The shape we close (Mike napkin #62 §2, Tanya UIX #23 §3): the
 * `GoldenThread.tsx:162` inline `transition: 'opacity
 * var(--sys-time-settle) var(--sys-ease-out), …'` declaration. Lifted
 * onto the verb `thread-settle`; the inline shape MUST NOT come back.
 * CSS keeps owning the tokens (`app/globals.css` is out-of-scan by
 * extension); TS does not paste them.
 *
 * The felt experience the fence guards (Tanya UIX #47 §2):
 *
 *   • GoldenThread tide-mark recede   (`thread-settle` / 1500ms / out)
 *   • Thermal crossing pulse          (`crossing` / 600ms)
 *   • Tide pulse @ 25/50/75/100%      (`MOTION.enter` / 300ms)
 *   • Killer-feature `reveal-keepsake`(`reveal` / 700ms / out)
 *
 * If a contributor inlines the tokens, the Thread starts breathing on
 * a different beat than the rest of the room — `useReducedMotion()` is
 * bypassed, and the next type-ramp tightening sprint has two places to
 * update (one of which gets missed). The fence stops the desync. The
 * desync is the bug. The reader feels it as *the page suddenly losing
 * its pulse*.
 *
 * Pure source-string lint. No DOM, no React render. One file, two
 * probes, the canonical kernel. Each function ≤ 10 LoC.
 *
 * Allow-list shape:
 *   • The kernel — `lib/design/**` and `lib/thermal/**` — is out-of-scan
 *     by directory (the Atlas itself emits the strings; the thermal
 *     ceremony layer authors them at the runtime token-paint seam).
 *   • The well-known JSDoc/comment shape `// `empty-stagger-headline`
 *     adds animation-delay: var(--sys-time-crossfade)` is fine — the
 *     kernel's three-pass strip blanks JS line + JS block + JSX
 *     comments before searching, so a doc reference does not trigger.
 *
 * formerly proposed as "inline-timing-fence"; same rule, different
 * filename (Mike #41 §8 risk-4).
 *
 * Credits: Mike K. (#41 napkin §4 — refactor onto the canonical
 * kernel `_fence.ts`; the four-axis fence shape lifted from
 * `motion-adoption.test.ts`; #62 §2 — fence shape, scan dirs, allow-
 * list doctrine), Tanya D. (UIX #47 §2 — the felt-experience appendix
 * above; UIX #23 §6 — receipt #5: "the fence catches future
 * regressions"), Sid (the ≤ 10 LoC per function rhythm; the kernel
 * lift that retired this file's bespoke walker).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  runJsxBlocks,
  stripComments,
  type JsxBlockDecl,
  type Violation,
} from './_fence';

const ROOT = join(__dirname, '..', '..', '..');

/** Directories whose `*.tsx` (and `*.ts`) speak Atlas verbs, not raw tokens. */
const SCAN_DIRS: readonly string[] = ['app', 'components'];

/**
 * Path-allow-list — kernel modules that legitimately author the tokens.
 * Empty by design (the kernel lives under `lib/`, which is out-of-scan).
 * The list shape is preserved so a future "carve-out" review surfaces a
 * named path instead of a quiet edit to a regex. Mirror of
 * `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`.
 */
const ALLOW: readonly string[] = [] as const;
const ALLOW_SET: ReadonlySet<string> = new Set<string>(ALLOW);

// ─── Probes — the two token families this fence forbids ───────────────────

const TIME_RX = /var\(--sys-time-/;
const EASE_RX = /var\(--sys-ease-/;

/** The fence declaration the kernel walks. JSX `style={…}` block, two probes. */
const FENCE: JsxBlockDecl = {
  scanDirs: SCAN_DIRS,
  anchor: /style\s*=\s*\{/g,
  open: '{',
  close: '}',
  probes: [
    { regex: TIME_RX, kind: 'time-token' },
    { regex: EASE_RX, kind: 'ease-token' },
  ],
  allow: ALLOW_SET,
};

// ─── Violation collector (kernel-driven; the prose stays per-fence) ───────

function findAllViolations(): Violation[] {
  return runJsxBlocks(FENCE);
}

// ─── Failure-message prose (Tanya UIX #47 §6 — verbatim) ──────────────────

function formatTimeViolation(v: Violation): string {
  return (
    `  ${v.file} — inline style={…} contains var(--sys-time-*)\n` +
    `    → lift onto a Gesture Atlas verb via gestureClassesForMotion()\n` +
    `      (lib/design/gestures.ts). The verb owns the timing.`
  );
}

function formatEaseViolation(v: Violation): string {
  return (
    `  ${v.file} — inline style={…} contains var(--sys-ease-*)\n` +
    `    → lift onto a Gesture Atlas verb via gestureClassesForMotion()\n` +
    `      (lib/design/gestures.ts). The verb owns the easing.`
  );
}

// ─── Tests — the whole point ───────────────────────────────────────────────

describe('motion inline-style fence — Atlas owns the timing tokens', () => {
  const violations = findAllViolations();

  it('no var(--sys-time-*) inside any JSX style={…} block', () => {
    const hits = violations.filter((v) => v.kind === 'time-token');
    expect(hits.map((v) => v.file)).toEqual([]);
    if (hits.length > 0) throw new Error('\n' + hits.map(formatTimeViolation).join('\n'));
  });

  it('no var(--sys-ease-*) inside any JSX style={…} block', () => {
    const hits = violations.filter((v) => v.kind === 'ease-token');
    expect(hits.map((v) => v.file)).toEqual([]);
    if (hits.length > 0) throw new Error('\n' + hits.map(formatEaseViolation).join('\n'));
  });
});

// ─── Self-tests for the kernel under known shapes ─────────────────────────

/** Tiny fence variant scoped to one synthetic source string for self-tests. */
function probeStyleBlocks(src: string): string[] {
  const stripped = stripComments(src);
  const blocks: string[] = [];
  const re = /style\s*=\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) blocks.push(extractBalancedTail(stripped, re.lastIndex));
  return blocks;
}

/** Exactly the depth-counter the bespoke walker used to use, for self-tests. */
function extractBalancedTail(src: string, start: number): string {
  let depth = 1;
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') { depth -= 1; if (depth === 0) return src.slice(start, i); }
  }
  return src.slice(start);
}

describe('motion inline-style fence — helpers behave under known shapes', () => {
  it('kernel stripComments removes line comments containing the forbidden tokens', () => {
    const src = '// note: var(--sys-time-settle) is fine in a comment\nconst x = 1;';
    expect(stripComments(src)).not.toMatch(TIME_RX);
  });

  it('kernel stripComments removes block comments containing the forbidden tokens', () => {
    const src = '/* refs var(--sys-ease-out) */ const y = 2;';
    expect(stripComments(src)).not.toMatch(EASE_RX);
  });

  it('kernel stripComments removes JSX comments containing the forbidden tokens', () => {
    const src = 'const node = <>{/* var(--sys-time-settle) */}</>;';
    expect(stripComments(src)).not.toMatch(TIME_RX);
  });

  it('probe captures the inner payload of a style={{…}} prop', () => {
    const src = '<div style={{ color: "red", transition: "opacity var(--sys-time-settle)" }} />';
    const blocks = probeStyleBlocks(src);
    expect(blocks.length).toBe(1);
    expect(blocks[0]).toContain('var(--sys-time-settle)');
  });

  it('probe captures multiple style props in one source', () => {
    const src = '<a style={{x:1}}/> <b style={{y:2}}/>';
    expect(probeStyleBlocks(src).length).toBe(2);
  });

  it('TIME_RX / EASE_RX detect either token family', () => {
    expect(TIME_RX.test('transition: var(--sys-time-settle)')).toBe(true);
    expect(EASE_RX.test('transition: var(--sys-ease-out)')).toBe(true);
    expect(TIME_RX.test('color: var(--token-accent)')).toBe(false);
    expect(EASE_RX.test('color: var(--token-accent)')).toBe(false);
  });

  it('the allow-list shape is preserved (empty by design, can be edited later)', () => {
    expect(ALLOW.length).toBe(0);
    expect(ALLOW_SET.size).toBe(0);
  });
});

// ─── Positive smoke — the fix this fence enforces is in place ──────────────

describe('motion inline-style fence — the surface the fence was born for', () => {
  it('GoldenThread.tsx has no inline var(--sys-time-*) / var(--sys-ease-*) substring', () => {
    const src = readFileSync(
      join(ROOT, 'components/reading/GoldenThread.tsx'),
      'utf8',
    );
    probeStyleBlocks(src).forEach((block) => {
      expect(block).not.toMatch(TIME_RX);
      expect(block).not.toMatch(EASE_RX);
    });
  });
});
