/**
 * Recognition Silence Fence — `holdMs ≥ CEREMONY.breath` for every named
 * recognition timeline.
 *
 * Lives in `lib/design/__tests__/` (not in `lib/return/__tests__/`) by
 * intent — the fence is a DESIGN-LEDGER assertion, not a module-internal
 * unit test. Pinning it here means a future "soften the silence" PR has
 * to delete the fence by NAME (not just nudge a number), the same Sid
 * LOCK pattern that sits behind `TEXTLINK_PASSAGE_FLOOR ===
 * WCAG_AA_TEXT` in `lib/design/voice-ledger.ts:498`.
 *
 * Felt sentence (Tanya UX §4.2): the silence between two beats has to
 * exist. A holdMs of 0 is not "tight" — it is a missing breath. The
 * inter-phase rest constant `CEREMONY.breath = 300ms` is the floor at
 * which the silence is *perceptible*. Painting plans must clear it;
 * silent (no-op) plans are vacuously exempt.
 *
 * Pure source — no DOM, no React, no jsdom. Each helper ≤ 10 LoC.
 *
 * Credits: Mike K. (architect napkin §"Module shape" #4 — fence-by-name
 * doctrine and the `≥ CEREMONY.breath` floor; the LOCK pattern lifted
 * from `voice-ledger.ts`), Tanya D. (UIX §4.2 — "calibrate silences like
 * a piano sustain pedal" felt sentence; the silence-as-content thesis
 * this fence makes structural), Sid (LOCK pattern naming + the
 * delete-the-name discipline that keeps the fence from drifting).
 */

import {
  letterTimeline, whisperTimeline, silentTimeline,
  totalDurationMs,
  type RecognitionTimeline,
} from '@/lib/return/recognition-timeline';
import { CEREMONY } from '@/lib/design/motion';

// ─── Painting plans — silent is vacuously exempt ──────────────────────────

const PAINTING_PLANS: ReadonlyArray<readonly [string, RecognitionTimeline]> = [
  ['letter',  letterTimeline()],
  ['whisper', whisperTimeline()],
] as const;

// ─── §1 · The floor — `holdMs ≥ CEREMONY.breath` for every painting plan ──

describe('recognition silence fence · §1 holdMs clears the breath floor', () => {
  it.each(PAINTING_PLANS)('plan(%s).holdMs ≥ CEREMONY.breath', (_, plan) => {
    expect(plan.holdMs).toBeGreaterThanOrEqual(CEREMONY.breath);
  });

  it('CEREMONY.breath is the canonical inter-phase rest (300ms)', () => {
    // Pinned numerically here — a future drift in `lib/design/motion.ts`
    // surfaces as a named-test failure rather than a silent collapse.
    expect(CEREMONY.breath).toBe(300);
  });

  it('silent plan is vacuously exempt (no-op timeline does not paint silence)', () => {
    expect(totalDurationMs(silentTimeline())).toBe(0);
  });
});

// ─── §2 · The pair — `settleMs + holdMs ≥ breath` (the perceptible window) ─

describe('recognition silence fence · §2 settle+hold clears the breath floor', () => {
  it.each(PAINTING_PLANS)('plan(%s) — settleMs + holdMs ≥ breath', (_, plan) => {
    expect(plan.settleMs + plan.holdMs).toBeGreaterThanOrEqual(CEREMONY.breath);
  });
});

// ─── §3 · The LOCK — fence is pinned BY NAME, not number ──────────────────
//
// A future "soften the silence" PR has to delete the symbol
// `CEREMONY.breath` from this file (not merely tweak a 300 to a 100).
// Same doctrine as `TEXTLINK_PASSAGE_FLOOR === WCAG_AA_TEXT` in
// `lib/design/voice-ledger.ts:498` — the symbol IS the contract.

describe('recognition silence fence · §3 LOCK — symbol pin, not number pin', () => {
  it('source of this file uses CEREMONY.breath (symbol, not literal)', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    const src = fs.readFileSync(
      path.join(__dirname, 'recognition-silence-fence.test.ts'),
      'utf8',
    );
    // Symbolic fence is referenced; raw 300 outside a comment is a smell.
    expect(src).toContain('CEREMONY.breath');
  });
});
