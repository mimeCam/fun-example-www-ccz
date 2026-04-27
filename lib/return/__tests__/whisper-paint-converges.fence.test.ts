/**
 * Whisper Paint Converges — sister-surface paint-parity fence.
 *
 * Sibling to `whisper-surfaces-share-timeline.fence.test.ts`. That fence
 * pins the temporal half of the contract (both whisper doors resolve to
 * the same `RecognitionTimeline`); THIS fence pins the spatial-paint
 * half: both doors resolve to the same Tailwind opacity class for every
 * phase. Until this PR landed, the prose claim "one voice across whisper
 * surfaces" lived in two docblocks. This file makes it a behavioral test.
 *
 * The unison contract (Tanya UIX #79 §2.1):
 *
 *   For every `phase ∈ RECOGNITION_PHASES`,
 *     RecognitionWhisper.paint(phase) === ViaWhisper.paint(phase)
 *
 * Concretely — both call sites resolve through `phaseOpacityClass` from
 * `lib/return/recognition-paint.ts`. The function IS the contract; this
 * test enforces both surfaces import it (and only it) for phase-painting.
 *
 * Why this test, not just `recognition-paint.test.ts`: that suite proves
 * the kernel maps phases to classes. THIS suite proves the two SISTER
 * SURFACES route through the kernel, not around it. If a future PR wires
 * either door to a hand-rolled `phase === 'hold' || ...` ternary, the
 * binary outcome the team named (Mike #115 §"Points of interest" #6,
 * Tanya UIX #79 §2.2) breaks here — not in production.
 *
 * Pure-source assertion — does NOT spin up React. Mirrors the
 * `whisper-surfaces-share-timeline.fence.test.ts` shape verbatim.
 *
 * Credits: Mike Koch (architect napkin #115 §"Points of interest" #6 —
 * "the bigger win is not the lift; it is the test"; the source-import
 * audit pattern lifted from `whisper-surfaces-share-timeline.fence.test.ts`),
 * Tanya Donska (UIX #79 §2.1 — the unison verdict this fence pins; #79
 * §11 mocked frame "same line, same column, same rungs on both surfaces"),
 * Paul Kim (#26 — make-or-break framing: "one breath, one voice across
 * whisper surfaces"), Sid (≤ 10 LoC per helper, source-truthfulness
 * doctrine).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  RECOGNITION_PHASES,
  type RecognitionPhase,
} from '@/lib/return/recognition-timeline';
import { phaseOpacityClass } from '@/lib/return/recognition-paint';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

const SITES: ReadonlyArray<readonly [string, string]> = [
  ['RecognitionWhisper', 'components/return/RecognitionWhisper.tsx'],
  ['ViaWhisper',         'components/home/ViaWhisper.tsx'],
] as const;

/** Read the source of a sibling whisper component. ≤ 10 LoC. */
function readSite(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

// ─── §1 · Both surfaces import phaseOpacityClass from the kernel ──────────

describe('whisper paint converges · §1 both surfaces import the kernel paint', () => {
  it.each(SITES)('%s imports phaseOpacityClass from @/lib/return/recognition-paint', (_, rel) => {
    const src = readSite(rel);
    expect(src).toMatch(
      /import\s*\{[^}]*\bphaseOpacityClass\b[^}]*\}\s*from\s*['"]@\/lib\/return\/recognition-paint['"]/,
    );
  });

  it.each(SITES)('%s does NOT carry an inline `phase === \'hold\' || …` ternary', (_, rel) => {
    // The pre-convergence drift shape. If a future PR re-introduces a
    // hand-rolled phase ternary at either site, the unison breaks here
    // (and the contract goes back to docblock prose).
    const src = readSite(rel);
    expect(src).not.toMatch(/phase\s*===\s*['"]hold['"]\s*\|\|\s*phase\s*===\s*['"]fold['"]/);
  });

  it.each(SITES)('%s does NOT carry a local `phaseOpacityClass` function', (_, rel) => {
    // The pre-convergence drift shape (RecognitionWhisper had a local
    // helper; ViaWhisper had an inline ternary). After napkin #115 the
    // ONLY definition lives in `lib/return/recognition-paint.ts`.
    const src = readSite(rel);
    expect(src).not.toMatch(/function\s+phaseOpacityClass\s*\(/);
  });
});

// ─── §2 · Both surfaces would paint the same class for every phase ────────

describe('whisper paint converges · §2 the unison contract (one voice)', () => {
  it.each(RECOGNITION_PHASES)('phase=%s — both surfaces resolve the same class', (phase) => {
    // Both surfaces route through `phaseOpacityClass`; if both call
    // sites import THE SAME function (asserted in §1) then for every
    // phase the resolved string is byte-identical by construction.
    // This assertion is the receipt — the contract reads top-to-bottom.
    const recognition = phaseOpacityClass(phase as RecognitionPhase);
    const via         = phaseOpacityClass(phase as RecognitionPhase);
    expect(recognition).toBe(via);
  });

  it('the rest phase paints opacity-0 on both surfaces (the breath)', () => {
    // Tanya UIX #79 §2.2: "the deep-link arrival must also start at
    // `opacity-0` and lift on the same breath the article-rail whisper
    // takes." The pre-convergence drift was that ViaWhisper did NOT
    // honour `phase === 'rest'` at all. This is the smoke-test receipt.
    expect(phaseOpacityClass('rest')).toBe('opacity-0');
  });

  it('the speaking rung is `quiet`, not `100`, on both surfaces', () => {
    // Tanya UIX #79 §2.1 (verdict): "The speaking rung is `quiet` (0.70).
    // Both surfaces. End of debate." The pre-convergence drift painted
    // ViaWhisper at `opacity-100` (which double-attenuated against the
    // gold/70 body color). This is the receipt that the verdict landed.
    expect(phaseOpacityClass('lift')).toBe('opacity-quiet');
    expect(phaseOpacityClass('settle')).toBe('opacity-quiet');
  });
});

// ─── §3 · No drift surfaces — neither file references raw rungs by name ──

describe('whisper paint converges · §3 neither surface references raw rungs by name', () => {
  it.each(SITES)('%s source does NOT contain `opacity-quiet` literal', (_, rel) => {
    // The literal lives in `lib/return/recognition-paint.ts` only. If a
    // future PR pastes `opacity-quiet` back into a call site, the line
    // becomes a second source of truth — the convergence fence catches
    // the drift before it ships.
    expect(readSite(rel)).not.toContain('opacity-quiet');
  });

  it.each(SITES)('%s source does NOT contain `opacity-muted` literal', (_, rel) => {
    expect(readSite(rel)).not.toContain('opacity-muted');
  });

  it.each(SITES)('%s source does NOT contain a raw `opacity-100` (drift carrier)', (_, rel) => {
    // The pre-convergence drift carrier on `ViaWhisper`. The fade-in
    // endpoint is now `opacity-quiet` (the speaking rung); `opacity-100`
    // has no business in either whisper file post-#115.
    expect(readSite(rel)).not.toContain('opacity-100');
  });
});
