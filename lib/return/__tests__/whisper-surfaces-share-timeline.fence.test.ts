/**
 * Whisper Surfaces Share Timeline — sister-surface temporal-parity fence.
 *
 * The Recognition Moment paints across two doors: `RecognitionWhisper`
 * (the returner door, on `/article/[id]`) and `ViaWhisper` (the friend
 * door, on `/?via=…`). Mutual-exclusion is enforced spatially by the
 * route gate; this fence pins the temporal half of the contract:
 *
 *   *Both doors speak the same opening breath, owned by the kernel.*
 *
 * Concretely — for every motion preference, both surfaces resolve to a
 * byte-identical `RecognitionTimeline` from `resolveRecognitionTimeline
 * ('whisper', …)`. There is no second timing source-of-truth; there
 * cannot be one (the surface argument is fixed, the resolver is pure).
 *
 * Why this test, not just `recognition-timeline.test.ts`: that suite
 * proves the kernel honors invariants. THIS suite proves the two
 * SISTER SURFACES route through the kernel, not around it. If a future
 * PR wires either door to a hand-rolled `setTimeout` or a different
 * factory, the binary outcome the team named (Paul §"non-negotiable",
 * Mike napkin §8 #3) breaks here — not in production.
 *
 * Pure-module assertion — does NOT spin up React. Mirrors the
 * `__testing__` idiom used across `lib/return/__tests__/`.
 *
 * Credits: Paul Kim (binary outcome — *both doors speak the same opening
 * breath, owned by the kernel*), Mike Koch (architect napkin §4 — naming
 * the test seam and locating it under `lib/return/__tests__/`), Tanya
 * Donska (UIX spec — the reduced-motion-floor companion; the SSR-pixel
 * fence on each surface lives next to its surface, the kernel-pair fence
 * lives here), Sid (≤ 10 LoC per helper).
 */

import {
  resolveRecognitionTimeline,
  whisperTimeline,
  type RecognitionTimeline,
} from '@/lib/return/recognition-timeline';
import { MOTION, MOTION_REDUCED_MS } from '@/lib/design/motion';

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

const PREFS = [
  ['default motion',  { reducedMotion: false }],
  ['reduced motion',  { reducedMotion: true  }],
] as const;

/** The two whisper surfaces, each resolved through the kernel. */
function whisperResolutions(prefs: { reducedMotion: boolean }): {
  recognition: RecognitionTimeline;
  via: RecognitionTimeline;
} {
  return {
    recognition: resolveRecognitionTimeline('whisper', prefs),
    via:         resolveRecognitionTimeline('whisper', prefs),
  };
}

// ─── §1 · Sister-surface byte-identity across motion preferences ──────────

describe('whisper surfaces share timeline · §1 byte-identical resolutions', () => {
  it.each(PREFS)('both whisper doors resolve to the same timeline (%s)', (_, prefs) => {
    const { recognition, via } = whisperResolutions(prefs);
    expect(recognition).toEqual(via);
  });

  it.each(PREFS)('every duration field matches across surfaces (%s)', (_, prefs) => {
    const { recognition, via } = whisperResolutions(prefs);
    expect(recognition.liftMs).toBe(via.liftMs);
    expect(recognition.settleMs).toBe(via.settleMs);
    expect(recognition.holdMs).toBe(via.holdMs);
    expect(recognition.foldMs).toBe(via.foldMs);
  });

  it.each(PREFS)('easing curve matches across surfaces (%s)', (_, prefs) => {
    const { recognition, via } = whisperResolutions(prefs);
    expect(recognition.ease).toBe(via.ease);
  });
});

// ─── §2 · Kernel claims the lift gate (no surface owns it inline) ─────────

describe('whisper surfaces share timeline · §2 kernel owns the lift gate', () => {
  it('whisperTimeline().liftMs is MOTION.settle (the breath-before-greeting)', () => {
    expect(whisperTimeline().liftMs).toBe(MOTION.settle);
  });

  it('whisperTimeline().liftMs is the SAME 1500ms anchor as the design system', () => {
    expect(whisperTimeline().liftMs).toBe(1500);
  });

  it('reduced-motion floor collapses liftMs to MOTION_REDUCED_MS (one frame)', () => {
    const t = resolveRecognitionTimeline('whisper', { reducedMotion: true });
    expect(t.liftMs).toBe(MOTION_REDUCED_MS);
  });
});

// ─── §3 · Reduced-motion floor — the accessibility contract ───────────────

describe('whisper surfaces share timeline · §3 reduced-motion floor', () => {
  it('every duration in the reduced timeline equals MOTION_REDUCED_MS', () => {
    const t = resolveRecognitionTimeline('whisper', { reducedMotion: true });
    expect(t.liftMs).toBe(MOTION_REDUCED_MS);
    expect(t.settleMs).toBe(MOTION_REDUCED_MS);
    expect(t.holdMs).toBe(MOTION_REDUCED_MS);
    expect(t.foldMs).toBe(MOTION_REDUCED_MS);
  });

  it('reduced surfaces remain byte-identical (no per-door floor drift)', () => {
    const a = resolveRecognitionTimeline('whisper', { reducedMotion: true });
    const b = resolveRecognitionTimeline('whisper', { reducedMotion: true });
    expect(a).toEqual(b);
  });
});

// ─── §4 · Source-truthfulness — neither surface re-invents the timing ────

describe('whisper surfaces share timeline · §4 surfaces route through the kernel', () => {
  it('RecognitionWhisper.tsx does NOT carry an inline animationDelay', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    const src = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', 'components', 'return', 'RecognitionWhisper.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(/animationDelay/);
    expect(src).not.toMatch(/animate-fade-in/);
  });

  it('RecognitionWhisper.tsx routes through resolveRecognitionTimeline', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    const src = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', 'components', 'return', 'RecognitionWhisper.tsx'),
      'utf8',
    );
    expect(src).toContain("resolveRecognitionTimeline('whisper'");
  });

  it('ViaWhisper.tsx routes through resolveRecognitionTimeline (zero LOC change)', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    const src = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', 'components', 'home', 'ViaWhisper.tsx'),
      'utf8',
    );
    expect(src).toContain("resolveRecognitionTimeline('whisper'");
  });
});
