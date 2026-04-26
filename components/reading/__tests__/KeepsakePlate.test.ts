/**
 * KeepsakePlate · SSR-shape gate + source-pin invariants.
 *
 * Pattern lifted from `ReadProgressCaption.test.ts` and `ReadersMark.test.ts`:
 * `.ts` (not `.tsx`) so the existing ts-jest preset doesn't need a per-test
 * override. Uses `React.createElement` + `renderToStaticMarkup`.
 *
 * What this suite locks down (one falsifiable claim per test):
 *
 *   1. SSR honesty — with no `<CeremonySequencer>` provider, the default
 *      ceremony phase is `idle`; the Plate must render NOTHING. The
 *      reader cannot see the keepsake before the press has finished.
 *      (Mike #41 §5.4 / Tanya UX §5.4 — "no simultaneous gold halos.")
 *   2. Pure helper `revealForPhase` — the four ceremony phases map to
 *      one of three reveal states, no surprises. Locks the cadence
 *      Tanya UX §2.3 wrote into the matrix.
 *   3. Source-pin invariants — the component MUST consume the SAME
 *      `buildThreadSVG` the modal + unfurl consume (preview === unfurl,
 *      Mike §6.2), MUST emit `CHECKPOINTS.KEEPSAKED` on click (the loop
 *      funnel stays wired, Mike §5 row 3), and MUST NOT introduce a
 *      bare `Nms` motion literal (the motion ledger is sealed).
 *   4. Posture-correct corners — the source carries `rounded-sys-wide`
 *      (ceremony) on the outer plate and `rounded-sys-medium` (held)
 *      on the inner thumbnail. Reviewer's one-word answer holds.
 *
 * Credits: Mike K. (#41 napkin §5.2/§6 — determinism contract, no-bare-ms
 * source-pin pattern lifted from ReadProgressCaption.test.ts), Tanya D.
 * (UX #74 §2.3 — three-act reveal cadence, the radius-posture pair as
 * acceptance criteria #3).
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { KeepsakePlate } from '../KeepsakePlate';
import { revealForPhase } from '@/lib/hooks/useKeepsakePreview';

// ─── 1 · SSR render shape — `idle` phase paints nothing ──────────────────

describe('KeepsakePlate · SSR render shape', () => {
  it('without a CeremonyProvider (default `idle`) → renders nothing', () => {
    // Default useCeremony() returns phase: 'idle'. The Plate is gated on
    // gifting/settled, so server-side it must not paint at all.
    const html = renderToStaticMarkup(
      createElement(KeepsakePlate, { articleId: 'x', title: 'A read' }),
    );
    expect(html).toBe('');
  });

  it('SSR output never carries the data-keepsake-plate hook in `idle`', () => {
    const html = renderToStaticMarkup(
      createElement(KeepsakePlate, { articleId: 'y', title: 'Another' }),
    );
    expect(html).not.toMatch(/data-keepsake-plate/);
  });
});

// ─── 2 · Pure helper · revealForPhase ────────────────────────────────────

describe('revealForPhase · ceremony → reveal-state map', () => {
  it('idle      → hidden', () => { expect(revealForPhase('idle')).toBe('hidden'); });
  it('breathing → hidden', () => { expect(revealForPhase('breathing')).toBe('hidden'); });
  it('warming   → hidden  (the shimmer owns this beat alone)',
    () => { expect(revealForPhase('warming')).toBe('hidden'); });
  it('gifting   → reveal  (entrance fade-up runs once)',
    () => { expect(revealForPhase('gifting')).toBe('reveal'); });
  it('settled   → settled (at-rest opacity, no transition)',
    () => { expect(revealForPhase('settled')).toBe('settled'); });
});

// ─── 3 · Source-pin invariants — the design rules in code ────────────────

describe('KeepsakePlate · source-pin invariants', () => {
  const SRC_PATH = join(__dirname, '..', 'KeepsakePlate.tsx');
  const SRC = readFileSync(SRC_PATH, 'utf8');

  it('imports `buildThreadSVG` — same renderer as modal + unfurl', () => {
    expect(SRC).toMatch(/buildThreadSVG/);
    expect(SRC).toMatch(/from\s+['"]@\/lib\/sharing\/thread-render['"]/);
  });

  it('imports `useKeepsakePreview` — the thin glue hook', () => {
    expect(SRC).toMatch(/useKeepsakePreview/);
    expect(SRC).toMatch(/from\s+['"]@\/lib\/hooks\/useKeepsakePreview['"]/);
  });

  it('imports `ThreadKeepsake` — click opens the existing modal as-is', () => {
    expect(SRC).toMatch(/ThreadKeepsake/);
  });

  it('emits `CHECKPOINTS.KEEPSAKED` on click (loop funnel stays wired)', () => {
    expect(SRC).toMatch(/CHECKPOINTS\.KEEPSAKED/);
    expect(SRC).toMatch(/emitCheckpoint/);
  });

  it('reads `MOTION.reveal` from the ledger (no bare ms literal)', () => {
    expect(SRC).toMatch(/MOTION\.reveal/);
  });

  it('does NOT define a new motion duration literal (no Nms strings)', () => {
    expect(SRC).not.toMatch(/['"`]\d+ms['"`]/);
  });

  it('does NOT import `framer-motion` (motion ledger is sealed)', () => {
    expect(SRC).not.toMatch(/from\s+['"]framer-motion['"]/);
  });

  it('outer plate corner answers ceremony — via thermalRadiusClassByPosture', () => {
    // Reviewer rule: posture word, not a literal corner. The helper resolves
    // to `thermal-radius-wide` at runtime; the source carries the helper call.
    expect(SRC).toMatch(/thermalRadiusClassByPosture\(\s*['"]ceremony['"]\s*\)/);
  });

  it('inner thumbnail carries `rounded-sys-medium` (posture: held)', () => {
    expect(SRC).toMatch(/rounded-sys-medium/);
  });

  it('routes touch through `<Pressable>` (no raw <button> in the source)', () => {
    // pressable-adoption guard fences raw <button> outside the primitive.
    // Lock the same invariant locally so a future refactor cannot drift
    // without flipping this test on the very first run.
    expect(SRC).toMatch(/<Pressable\b/);
    expect(SRC).not.toMatch(/<button\b/);
  });

  it('does NOT call `motionByPosture` or sibling cross-ledger accessors', () => {
    // AGENTS.md lines 24-26: posture suggests, posture does not dictate.
    expect(SRC).not.toMatch(/motionByPosture/);
  });
});
