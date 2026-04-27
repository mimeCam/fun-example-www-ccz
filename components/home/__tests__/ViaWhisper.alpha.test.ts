/**
 * ViaWhisper.alpha — per-file SSR pin for the arrival whisper.
 *
 * Mirror of `EvolutionThread.alpha.test.ts` (Mike napkin #114 / Mike #113 §4
 * shape — SSR via `react-dom/server`, `React.createElement`,
 * `testEnvironment: 'node'`, no jsdom). The single drift site that lived
 * on the arrival whisper's italic gold span is now spoken in the role-based
 * 4-rung vocabulary owned by `lib/design/alpha.ts`. The arrival whisper now
 * paints at the SAME `quiet` rung as `EvolutionThread`'s italic gold copy —
 * one filament, one voice (Tanya UIX #94 §2).
 *
 * What this pin enforces (three sections, line-for-line peer of the
 * EvolutionThread / Mirror / ResonanceEntry siblings):
 *
 *   §1 · MODULE HANDLE POINTS AT THE CANONICAL RUNG — `WHISPER_TEXT`
 *        resolves to `alphaClassOf('gold','quiet','text')` AND to the
 *        wire string `'text-gold/70'`. A future swap of the rung cannot
 *        silently shift the register without flipping this test.
 *
 *   §2 · SSR PAINTS THE SNAPPED CARRIER VERBATIM — render `<ViaWhisper>`
 *        with a real archetype; assert the rendered markup carries
 *        `text-gold/70` + `italic` and does NOT carry the pre-snap
 *        `/80` drift literal.
 *
 *   §3 · SISTER-SURFACE INVARIANT — the arrival whisper paints at the
 *        SAME rung as `EvolutionThread.HAIRLINE_BORDER`'s gold-italic
 *        body copy (the resonance-page memory whisper). Same alpha,
 *        same property prefix; the four-site rhythm fence's body voice
 *        (arrival, memory, gem-luminous) shares one address.
 *
 * Per-file pin only — NO pair-invariant test asserting `ViaWhisper ≡
 * EvolutionThread ≡ RecognitionWhisper` chassis tokens (Mike #114 §PoI #4
 * / Elon §3 — the resolver IS the kernel; rule of three for kernel-lift,
 * the four-site rhythm carriers are not a kernel). Each file owns its
 * own per-file pin; the rhythm fence at `gestures-call-site-rhythm.test.ts`
 * is the project-level lock for the breath verb.
 *
 * Credits: Mike K. (architect napkin #114 — the snap, the four-site
 * rhythm, the rule-of-three discipline that keeps the resolver at module
 * scope, the "graduate ViaWhisper to /70 (gold-whisper voice, 5→4)"
 * framing), Tanya D. (UIX spec #94 — the felt-sentence litmus, "soft
 * gold, italic, almost off-page", the four-surface persona arc — arrival
 * → return → wayfinding → memory — that this file's whisper opens),
 * Paul K. (vocabulary success metric — voice coherence at four touch
 * points; this fence is the doctrine row), Sid (this lift; same shape
 * as the EvolutionThread sibling, no new primitive).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { alphaClassOf } from '@/lib/design/alpha';
import ViaWhisper, { __testing__ } from '../ViaWhisper';
import { __testing__ as EvolutionTesting } from '@/app/resonances/EvolutionThread';

const { WHISPER_TEXT } = __testing__;

// ─── Tiny helper — pure, ≤ 10 LOC ──────────────────────────────────────────

/** Render ViaWhisper to static markup with a fixture archetype. */
function renderWhisper(): string {
  return renderToStaticMarkup(
    createElement(ViaWhisper, { via: 'deep-diver' }),
  );
}

// ─── §1 · Module-level handle points at the canonical rung ────────────────

describe('ViaWhisper · §1 module handle points at the canonical rung', () => {
  it('WHISPER_TEXT is text-gold/70 (= `quiet` rung wire format)', () => {
    expect(WHISPER_TEXT).toBe(alphaClassOf('gold', 'quiet', 'text'));
    expect(WHISPER_TEXT).toBe('text-gold/70');
  });

  it('WHISPER_TEXT is NOT the pre-snap /80 drift literal', () => {
    expect(WHISPER_TEXT).not.toBe('text-gold/80');
    expect(WHISPER_TEXT).not.toMatch(/\/80$/);
  });

  it('WHISPER_TEXT snaps to the `quiet` rung (content, not THE content)', () => {
    // Tanya UIX #94 §2 verdict — `quiet`, not `recede`. The `quiet`
    // rung's felt sentence is "Content, but not THE content." If a
    // future PR steps it back to `/50` the test names the rung that
    // moved (and the arrival ceases to greet at the same volume as
    // its sibling whispers).
    expect(WHISPER_TEXT).toMatch(/\/70$/);
  });
});

// ─── §2 · SSR paints the snapped carrier verbatim ─────────────────────────

describe('ViaWhisper · §2 SSR paints the snapped carrier verbatim', () => {
  it('the rendered markup carries text-gold/70 (the quiet rung)', () => {
    expect(renderWhisper()).toContain(WHISPER_TEXT);
    expect(renderWhisper()).toContain('text-gold/70');
  });

  it('the rendered markup carries the italic register', () => {
    // Tanya UIX #94 §2 — italic is half the voice; "a breath, not a
    // statement." If a future "tighten the typography" PR drops the
    // italic from this span, the gold-whisper voice loses its other
    // half.
    expect(renderWhisper()).toContain('italic');
  });

  it('the rendered markup does NOT carry the pre-snap /80 drift literal', () => {
    expect(renderWhisper()).not.toContain('text-gold/80');
  });

  it('the rendered markup carries the whisper-linger breath verb', () => {
    // The four-site rhythm fence's positive-shape lock is the
    // `gestures-call-site-rhythm.test.ts` SITES array; this assertion
    // is the per-file echo so a future PR that yanks the verb out of
    // the className surfaces here too (felt sentence: "the room
    // exhales a thought it doesn't quite say").
    const html = renderWhisper();
    expect(html).toContain('duration-linger');
    expect(html).toContain('ease-out');
  });

  it('the rendered markup is the initial dimmed=false markup (opacity-100)', () => {
    // SSR fires no useEffect, so the markup pins the entry state. The
    // `opacity-100` carrier is the motion fade endpoint (alpha-ledger
    // exempt, owned by Motion). After T_LINGER the client swaps to
    // `opacity-muted` — that is the runtime concern, not the SSR pin.
    expect(renderWhisper()).toContain('opacity-100');
    expect(renderWhisper()).not.toContain('opacity-muted');
  });
});

// ─── §3 · Sister-surface invariant — same rung, two surfaces ───────────────

describe('ViaWhisper · §3 sister-surface invariant (one voice, two locations)', () => {
  it('EvolutionThread carrier is at the hairline rung (border-gold/10)', () => {
    // Anchor: the sister surface's chrome (the spine of the resonance
    // page) sits at `hairline`. Confirms our import seam and gives the
    // contrast a name — the whisper's WORDS sit at `quiet`, the
    // whisper's LINE sits at `hairline`. Two rungs, one register.
    expect(EvolutionTesting.HAIRLINE_BORDER).toBe('border-gold/10');
  });

  it('the arrival whisper paints its body at the same rung as EvolutionThread italic copy', () => {
    // Tanya UIX #94 §3 — both surfaces (`ViaWhisper` body, `EvolutionThread`
    // italic gold caption) speak at `text-gold/70`. Felt sentence: "the
    // greeting and the memory speak in the same voice." The §3 fence
    // pins that promise structurally so a future PR that drifts one but
    // not the other breaks here.
    const evolutionSrc = (() => {
      const fs = require('node:fs') as typeof import('node:fs');
      const path = require('node:path') as typeof import('node:path');
      return fs.readFileSync(
        path.join(__dirname, '..', '..', '..', 'app', 'resonances', 'EvolutionThread.tsx'),
        'utf8',
      );
    })();
    expect(evolutionSrc).toContain('text-gold/70');
    expect(WHISPER_TEXT).toBe('text-gold/70');
  });

  it('JSDoc and pixel agree (doctrine truth, Paul §7.2)', () => {
    // Paul Kim DoD row 2 — the source of `ViaWhisper.tsx` and the
    // rendered className speak the same rung. The doc says
    // `text-gold/70`; the pixel says `text-gold/70`; the pre-snap
    // `/80` is gone from both.
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'ViaWhisper.tsx'), 'utf8',
    );
    expect(src).toContain("alphaClassOf('gold', 'quiet', 'text')");
    expect(src).not.toContain('text-gold/80');
  });
});
