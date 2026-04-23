/**
 * Skeleton Sync Test — CSS ↔ TS drift guard.
 *
 * Reads `app/globals.css`, parses the `--sys-skeleton-beat` token and the
 * `@keyframes sysSkeletonBreath` block, asserts they agree with the
 * TS mirror in `lib/design/skeleton.ts`. Identical strategy to
 * `alpha-sync.test.ts` and `motion-sync.test.ts` — no build step, no
 * codegen — a plain regex read from disk at test time.
 *
 * What's pinned:
 *   - `--sys-skeleton-beat` in CSS === MOTION.linger in TS
 *   - breath valley/peak reference `--sys-alpha-hairline` / `--sys-alpha-muted`
 *   - TS SKELETON composition reads from ALPHA + MOTION (not independent values)
 *   - three sealed variants, named in the exact order the napkin specifies
 *
 * Credits: Mike K. (sync-test pattern from alpha/motion, the "CSS is
 * canonical" rule), Tanya D. (the invariant that nested skeletons don't
 * polyrhythm). Existing sync tests — load-bearing prior art.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  SKELETON,
  SKELETON_LOW_RUNG,
  SKELETON_HIGH_RUNG,
  SKELETON_BEAT,
  SKELETON_SHAPES,
  SKELETON_ORDER,
  SKELETON_CSS_CLASS,
  shapeClassOf,
  composeSkeletonClass,
  cssBeatVar,
  skeletonInvariantHolds,
  skeletonShapesInvariantHolds,
} from '../skeleton';
import { ALPHA } from '../alpha';
import { MOTION } from '../motion';

const CSS = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf-8');

// ─── Parser helpers — pure, each ≤ 10 LOC ────────────────────────────────

/** Extract the numeric ms of `--sys-skeleton-beat: Nms;`. */
function readBeatMs(): number | undefined {
  const m = CSS.match(/--sys-skeleton-beat:\s*(\d+)ms/);
  return m ? Number(m[1]) : undefined;
}

/** Return the body of the `@keyframes sysSkeletonBreath { … }` rule. */
function readBreathKeyframes(): string | undefined {
  const m = CSS.match(/@keyframes\s+sysSkeletonBreath\s*\{([\s\S]*?)\n\}/);
  return m ? m[1] : undefined;
}

/** Return the body of the `.sys-skeleton { … }` rule (top-level only). */
function readSkeletonRule(): string | undefined {
  const m = CSS.match(/\n\.sys-skeleton\s*\{([\s\S]*?)\n\}/);
  return m ? m[1] : undefined;
}

// ─── Tests — CSS ↔ TS sync ───────────────────────────────────────────────

describe('SKELETON ↔ globals.css sync', () => {
  it('--sys-skeleton-beat in CSS matches MOTION.linger', () => {
    expect(readBeatMs()).toBe(MOTION.linger);
  });

  it('TS SKELETON.beat mirrors MOTION.linger', () => {
    expect(SKELETON.beat).toBe(MOTION[SKELETON_BEAT]);
    expect(SKELETON_BEAT).toBe('linger');
  });

  it('keyframes oscillate between the alpha ledger rungs (not raw numbers)', () => {
    const body = readBreathKeyframes();
    expect(body).toBeDefined();
    expect(body!).toContain('var(--sys-alpha-hairline)');
    expect(body!).toContain('var(--sys-alpha-muted)');
  });

  it('valley is hairline (0.10), peak is muted (0.30) — per Alpha ledger', () => {
    expect(SKELETON_LOW_RUNG).toBe('hairline');
    expect(SKELETON_HIGH_RUNG).toBe('muted');
    expect(SKELETON.low).toBe(ALPHA.hairline);
    expect(SKELETON.high).toBe(ALPHA.muted);
  });

  it('`.sys-skeleton` rule uses the `--sys-skeleton-beat` var', () => {
    const rule = readSkeletonRule();
    expect(rule).toBeDefined();
    expect(rule!).toContain('var(--sys-skeleton-beat');
  });
});

// ─── Tests — structural invariants ───────────────────────────────────────

describe('SKELETON structural invariants', () => {
  it('skeletonInvariantHolds() is true', () => {
    expect(skeletonInvariantHolds()).toBe(true);
  });

  it('skeletonShapesInvariantHolds() is true', () => {
    expect(skeletonShapesInvariantHolds()).toBe(true);
  });

  it('exactly three sealed variants — a fourth is the first crack', () => {
    expect(SKELETON_ORDER.length).toBe(3);
    expect(Object.keys(SKELETON_SHAPES).length).toBe(3);
  });

  it('variants are ordered line → block → card (posture-weight ascending)', () => {
    expect(SKELETON_ORDER).toEqual(['line', 'block', 'card']);
  });

  it('valley strictly below peak — the breath never inverts', () => {
    expect(SKELETON.low).toBeLessThan(SKELETON.high);
  });
});

// ─── Tests — helpers ─────────────────────────────────────────────────────

describe('skeleton helpers', () => {
  it('shapeClassOf returns the sealed tailwind fragment', () => {
    expect(shapeClassOf('line')).toContain('bg-surface');
    expect(shapeClassOf('block')).toContain('rounded-sys-medium');
    expect(shapeClassOf('card')).toContain('thermal-radius');
  });

  it('cssBeatVar returns the CSS custom-property reference', () => {
    expect(cssBeatVar()).toBe('var(--sys-skeleton-beat)');
  });

  it('composeSkeletonClass composes carrier + shape + caller className', () => {
    const cls = composeSkeletonClass('line', 'h-3 w-32');
    expect(cls.split(' ')).toContain(SKELETON_CSS_CLASS);
    expect(cls).toContain('bg-surface');
    expect(cls).toContain('h-3 w-32');
  });

  it('composeSkeletonClass works without a caller className', () => {
    const cls = composeSkeletonClass('card');
    expect(cls.split(' ')).toContain(SKELETON_CSS_CLASS);
    expect(cls).toContain('thermal-radius');
    expect(cls).not.toContain('undefined');
  });
});

// ─── Tests — CSS has the carrier class and reduced-motion floor ──────────

describe('CSS carrier + reduced-motion floor', () => {
  it('`.sys-skeleton` rule exists at top level', () => {
    expect(readSkeletonRule()).toBeDefined();
  });

  it('reduced-motion block pins skeleton at α muted (not hairline, not 0)', () => {
    const reduced = CSS.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/,
    );
    expect(reduced).not.toBeNull();
    expect(reduced![1]).toMatch(/\.sys-skeleton[\s\S]*var\(--sys-alpha-muted\)/);
  });

  it('nested `.sys-skeleton .sys-skeleton` is de-animated (no polyrhythm)', () => {
    expect(CSS).toMatch(
      /\.sys-skeleton\s+\.sys-skeleton\s*\{[\s\S]*?animation:\s*none/,
    );
  });
});
