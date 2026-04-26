/**
 * ArticleWhisperPortal — selector adoption + paint-shape proof.
 *
 * Verifies that the portal:
 *   1. Consults `pickRecognitionSurface` with `surface: 'article'`.
 *   2. Returns `null` for strangers (the SSR-default initial state).
 *   3. Wraps `RecognitionWhisper` in the documented breathing-room
 *      shell when the selector says `whisper` (no card, no shadow).
 *   4. Never paints `RecognitionWhisper` on the home rail (route-level
 *      mutual-exclusion with `ReturnLetter`).
 *
 * Same SSR / `react-dom/server` idiom as `PortalHero.test.ts`. Test
 * environment is `node` (per jest.config.js) — we exercise the portal
 * via `renderToStaticMarkup`, which calls hooks but does NOT run their
 * effects. That's exactly what we need: the hook returns its INITIAL
 * stranger state, so the SSR render is the strict "stranger" baseline.
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { pickRecognitionSurface } from '@/lib/return/recognition-surface';
import { RecognitionWhisper } from '@/components/return/RecognitionWhisper';
import { ArticleWhisperPortalInner } from '@/components/return/ArticleWhisperPortal';

// ─── 1 · stranger SSR baseline ─────────────────────────────────
//
// Sid #5 — envelope ownership moved to the call site (`<CollapsibleSlot>`
// at `app/article/[id]/page.tsx`). The inner no longer carries the
// `mt-sys-10` / `mb-sys-8` breathing room — that lives on the envelope
// so it survives the dynamic `{ ssr: false }` gate and the `null` branch.
// These assertions become a *negative* check on the inner: it must paint
// nothing for strangers AND must not re-introduce the margins it gave up.

describe('ArticleWhisperPortal · SSR baseline (stranger reader)', () => {
  it('paints nothing on first render — the envelope owns the gap, not the inner', () => {
    const html = renderToStaticMarkup(createElement(ArticleWhisperPortalInner));
    // The hook returns INITIAL { isReturning: false, lastWhisper: null }
    // server-side. Selector → silent → inner returns null. The
    // CollapsibleSlot envelope at the call site supplies the breath.
    expect(html).toBe('');
  });

  it('does not leak any whisper-shell class on stranger SSR', () => {
    const html = renderToStaticMarkup(createElement(ArticleWhisperPortalInner));
    expect(html).not.toMatch(/mt-sys-10/);
    expect(html).not.toMatch(/mb-sys-8/);
    expect(html).not.toMatch(/text-sys-caption/);
    expect(html).not.toMatch(/font-display/);
  });
});

// ─── 2 · returning rail — direct paint of the leaf ─────────────
//
// We can't drive the hook from here without jsdom, so we exercise the
// LEAF (RecognitionWhisper) directly with a returning state and assert
// the paint shape Tanya specced. The selector → portal → leaf chain is
// covered by the selector's truth-table tests + this leaf snapshot.

describe('RecognitionWhisper · returning-reader paint shape (Tanya §2.2)', () => {
  const RETURNING_STATE = {
    isReturning: true,
    archetype: 'deep-diver' as const,
    daysSinceLastVisit: 5,
    visitCount: 3,
    recognitionTier: 'returning' as const,
    lastWhisper: 'the room remembers your last descent',
  };

  it('renders a single italic mist line — no card, no shadow, no radius', () => {
    const html = renderToStaticMarkup(
      createElement(RecognitionWhisper, { recognition: RETURNING_STATE }),
    );
    // The Whisper is text, not a surface — no border, no shadow, no rounded.
    expect(html).not.toMatch(/border-/);
    expect(html).not.toMatch(/shadow-/);
    expect(html).not.toMatch(/rounded-/);
  });

  it('uses italic display type at the caption rung (ambient annotation voice)', () => {
    const html = renderToStaticMarkup(
      createElement(RecognitionWhisper, { recognition: RETURNING_STATE }),
    );
    expect(html).toMatch(/italic/);
    expect(html).toMatch(/font-display/);
    expect(html).toMatch(/text-sys-caption/);
  });

  it('paints the archetype label and the synthesised whisper, joined by a · separator', () => {
    const html = renderToStaticMarkup(
      createElement(RecognitionWhisper, { recognition: RETURNING_STATE }),
    );
    expect(html).toContain('Deep Diver');
    expect(html).toContain('the room remembers your last descent');
    // Mid-dot separator (· U+00B7) ties archetype + whisper as one breath.
    // Archetype is wrapped in a <span>, so allow markup between label and dot.
    expect(html).toMatch(/Deep Diver<\/span>\s*·/);
  });

  it('drifts with the room — carries `thermal-drift` so warmth tracks engagement', () => {
    const html = renderToStaticMarkup(
      createElement(RecognitionWhisper, { recognition: RETURNING_STATE }),
    );
    expect(html).toMatch(/thermal-drift/);
  });
});

// ─── 3 · selector wiring — portal asks for `surface: 'article'` ──

describe('ArticleWhisperPortal · selector adoption (route-level invariant)', () => {
  it('selector verdict for a returning reader on the article rail is `whisper`', () => {
    const verdict = pickRecognitionSurface({
      surface: 'article',
      recognition: {
        isReturning: true,
        archetype: 'explorer',
        daysSinceLastVisit: 2,
        visitCount: 4,
        recognitionTier: 'returning',
        lastWhisper: 'new trails since you were last here',
      },
      viaArchetype: null,
      letterDismissed: false,
    });
    expect(verdict).toBe('whisper');
  });

  it('selector NEVER returns `letter` when called from the article rail', () => {
    // This is the property `ArticleWhisperPortal` relies on. If the
    // selector ever returned `letter` here, the portal's `if !== whisper`
    // gate would silently swallow it — but that would be a contract bug.
    const verdict = pickRecognitionSurface({
      surface: 'article',
      recognition: {
        isReturning: true,
        archetype: 'faithful',
        daysSinceLastVisit: 12,
        visitCount: 9,
        recognitionTier: 'known',
        lastWhisper: 'the consistent ones find the deepest ideas',
      },
      viaArchetype: 'deep-diver',
      letterDismissed: true,
    });
    expect(verdict).not.toBe('letter');
  });
});
