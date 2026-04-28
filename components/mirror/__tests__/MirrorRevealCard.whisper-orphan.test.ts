/**
 * MirrorRevealCard whisper-orphan regression — the 320px receipt.
 *
 * This is the make-or-break receipt Paul named (#40 / Mike #122 §6 PoI #5):
 * at 320px the felt sentence must not orphan a final word onto its own
 * line. Browser physics: the paragraph's `text-wrap: balance` policy comes
 * from `wrapClassOf('heading')` on the rendered className. If any future
 * PR removes the wrap class from `WhisperQuote`, the orphan returns and
 * the felt-sentence promise (Tanya UIX #22 §1, #22 §8.1) breaks.
 *
 * Why a per-file SSR regression and not just the convergence fence:
 *   • The fence proves the FUNCTION is imported and called at the call
 *     site — a producer-side receipt.
 *   • This regression proves the RESOLVED CLASS is on the rendered
 *     paragraph — a consumer-side receipt. The two together close the
 *     loop. (Mike #122 §6 PoI #5: "Snapshot the class string; assert the
 *     wrap class is present.")
 *
 * Test runs under `testEnvironment: 'node'` via `react-dom/server` —
 * mirrors the `ViaWhisper.alpha.test.ts` and `MirrorLoadingSurface.test.ts`
 * idiom; no jsdom, no fake timers, no phase machine.
 *
 * Credits: Mike Koch (#122 §6 PoI #5 — the snapshot/className receipt;
 * §8 acceptance row 5 — "would fail if the wrap class disappears from
 * the rendered className"), Tanya Donska (UIX #22 §2 / §8 — the 320px
 * orphan archetype, the felt-sentence guarantee, the ragged-balanced
 * shape), Krystle Clear (the seed pick — Mirror Reveal Card whisper
 * routes through the typography ledger), Paul Kim (#40 §"non-negotiable"
 * — the orphan-free guarantee at every viewport, ratified), Sid (this
 * regression; ≤ 10 LoC per helper, source-truthfulness doctrine).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import type { ReaderMirror } from '@/types/mirror';
import MirrorRevealCard, { __testing__ } from '../MirrorRevealCard';
import { wrapClassOf } from '@/lib/design/typography';

const { WHISPER_WRAP } = __testing__;

// ─── Tiny helpers — pure, ≤ 10 LOC each ──────────────────────────────────

/** A canonical archetype mirror whose whisper is the orphan archetype. */
function fixtureMirror(): ReaderMirror {
  return {
    archetype: 'deep-diver',
    archetypeLabel: 'The Quiet Cartographer',
    // Tanya UIX #22 §2 — the orphan archetype string. At 320px without
    // `text-wrap: balance` the trailing "mood." would land alone.
    whisper: 'You linger where structure meets mood.',
    topicDNA: [], scores: { depth: 80, breadth: 60, consistency: 70 },
    resonanceThemes: [],
  };
}

/** Render the killer-feature carrier with the orphan-archetype whisper. */
function renderCard(): string {
  return renderToStaticMarkup(
    createElement(MirrorRevealCard, { mirror: fixtureMirror() }),
  );
}

/** Extract the whisper paragraph's className from the rendered markup.
 *  The whisper is the only `<p>` whose class carries `typo-caption`. */
function whisperClass(html: string): string | null {
  const rx = /<p[^>]*class="([^"]*typo-caption[^"]*)"/;
  const match = html.match(rx);
  return match ? match[1] : null;
}

// ─── §1 · The seam handle resolves to the canonical class ────────────────

describe('MirrorRevealCard.whisper-orphan · §1 the seam handle is canonical', () => {
  it('WHISPER_WRAP is wrapClassOf(\'heading\') (= typo-wrap-heading)', () => {
    expect(WHISPER_WRAP).toBe(wrapClassOf('heading'));
    expect(WHISPER_WRAP).toBe('typo-wrap-heading');
  });

  it('WHISPER_WRAP carries the heading family, not caption (the asymmetry)', () => {
    // Tanya UIX #22 §4.2 / Mike #122 §6 PoI #1: the whisper is small
    // italic caption text but its WRAP POLICY is heading-class. The
    // helper splits `wrapClassOf` away from `classesOf` for exactly
    // this — one property of one beat, not the whole beat.
    expect(WHISPER_WRAP).not.toBe(wrapClassOf('caption'));
    expect(WHISPER_WRAP).toBe(wrapClassOf('heading'));
  });
});

// ─── §2 · SSR paints the wrap class onto the whisper paragraph ───────────

describe('MirrorRevealCard.whisper-orphan · §2 SSR carries the wrap class', () => {
  it('the rendered whisper paragraph carries `typo-wrap-heading`', () => {
    const html = renderCard();
    const cls  = whisperClass(html);
    expect(cls).not.toBeNull();
    expect(cls).toContain('typo-wrap-heading');
  });

  it('the rendered whisper paragraph still carries `typo-caption` (rhythm)', () => {
    // The asymmetry receipt — leading + track stay caption (the rhythm
    // does not change); only wrap policy lifts to heading-balanced.
    const cls = whisperClass(renderCard());
    expect(cls).toContain('typo-caption');
  });

  it('the rendered whisper carries the orphan-archetype whisper text', () => {
    // Tanya UIX #22 §2 — the canonical orphan string. If future copy
    // edits drift the whisper, the regression still pins the WRAP
    // class; this assertion just keeps the fixture honest.
    expect(renderCard()).toContain('You linger where structure meets mood.');
  });
});

// ─── §3 · Drift fence — no inlined wrap literal, no missing wrap class ──

describe('MirrorRevealCard.whisper-orphan · §3 drift fence', () => {
  it('the whisper paragraph does NOT spell `text-wrap-*` locally', () => {
    // The pre-convergence drift shape. The wrap policy lives in CSS via
    // `typo-wrap-heading`; a Tailwind `text-wrap-balance` utility would
    // be a second source of truth. The fence catches it before it ships.
    const cls = whisperClass(renderCard()) ?? '';
    expect(cls).not.toMatch(/\btext-wrap-(auto|pretty|balance)\b/);
  });

  it('the whisper paragraph carries exactly one `typo-wrap-*` token', () => {
    // Belt-and-suspenders: if a future PR composes two wrap classes
    // (caption + heading) the cascade is undefined. The contract is
    // ONE wrap policy per element.
    const cls = whisperClass(renderCard()) ?? '';
    const matches = cls.match(/\btypo-wrap-[a-z]+\b/g) ?? [];
    expect(matches).toEqual(['typo-wrap-heading']);
  });
});
