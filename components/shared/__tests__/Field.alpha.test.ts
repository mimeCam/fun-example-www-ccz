/**
 * Field.alpha — per-file SSR pin for the label rung graduation.
 *
 * Two guarantees, honest under `testEnvironment: 'node'`:
 *
 *   1. Label rung — the `<label>` inside `Field` speaks at
 *      `foreground/quiet` (= `text-foreground/70`), NOT `text-foreground/80`
 *      (the pre-graduation drift). Pinned via the literal wire-format string
 *      AND the `alphaClassOf()` helper, so a future swap of the rung
 *      vocabulary cannot silently drift the register without flipping this
 *      test (Tanya UX #76 §1; Mike napkin §6d).
 *
 *   2. Color family — `foreground` (NOT `mist`). The sibling whisper
 *      surfaces (WhisperFooter, CaptionMetric) deliberately use `mist` to
 *      dissolve into the page surface as thermal warming rises; the Field
 *      label must remain locatable inside the input chrome under the same
 *      warming. Same rung, different color family, different jobs (Tanya
 *      §5: "the design system working as intended").
 *
 * Mirrors `WhisperFooter.test.ts` and `SuspenseFade.test.ts` node-only SSR
 * pattern — no jsdom dependency, `React.createElement` so the existing
 * ts-jest preset (`jsx: preserve`) needs no per-test override. Per-file pin
 * only — does NOT cross-pin sibling surfaces (Mike §6b: tests pin the rule,
 * not the coincidence).
 *
 * Credits: Mike K. (architect napkin §6d — per-file SSR pin shape lifted
 * from WhisperFooter.test.ts), Tanya D. (UX spec #76 §1 / §5 — the rung +
 * color-family separation this test locks in), Krystle C. (drift-density
 * ranking that put Field.tsx next), Elon M. (rebuttal that the ledger axis
 * is role-based — this test pins the role, not the speaker).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { Field } from '../Field';
import { alphaClassOf } from '@/lib/design/alpha';

// ─── Tiny helpers — pure, ≤ 10 LOC each ──────────────────────────────────

/** Render a baseline Field to a static markup string. */
function renderField(): string {
  return renderToStaticMarkup(
    createElement(Field, { label: 'Your turn', name: 'reflection' }),
  );
}

/** Render a Field in error state — to confirm label rung is unchanged. */
function renderFieldWithError(): string {
  return renderToStaticMarkup(
    createElement(Field, {
      label: 'Your turn',
      name: 'reflection',
      error: 'A short held-beat error.',
    }),
  );
}

/** Render a multiline Field — to confirm label rung holds across variants. */
function renderMultilineField(): string {
  return renderToStaticMarkup(
    createElement(Field, {
      label: 'Your turn',
      name: 'reflection',
      variant: 'multiline',
    }),
  );
}

// ─── Label rung — quiet, not /80 ─────────────────────────────────────────

describe('Field — label speaks at the alpha-ledger `quiet` rung', () => {
  const html = renderField();

  it('contains the label text verbatim', () => {
    expect(html).toContain('Your turn');
  });

  it('label uses text-foreground/70 (the `quiet` rung wire format)', () => {
    expect(html).toContain('text-foreground/70');
  });

  it('label rung matches alphaClassOf(foreground, quiet, text)', () => {
    expect(html).toContain(alphaClassOf('foreground', 'quiet', 'text'));
  });

  it('label does NOT carry the pre-graduation `text-foreground/80` drift', () => {
    expect(html).not.toContain('text-foreground/80');
  });
});

// ─── Color-family discipline — foreground, not mist ──────────────────────

describe('Field — label color family is `foreground` (locatable under warming)', () => {
  const html = renderField();

  it('label does not silently harmonize to `text-mist/70`', () => {
    // The whisper-family siblings (WhisperFooter tagline, CaptionMetric)
    // use mist; the Field label deliberately tracks page foreground so it
    // stays readable as the room warms (Tanya §5 polish recommendation).
    expect(html).not.toContain('text-mist/70');
  });
});

// ─── Variant + state stability — rung holds across legs ──────────────────

describe('Field — quiet rung holds across variants and held-beat error', () => {
  it('multiline variant keeps the label at the quiet rung', () => {
    const html = renderMultilineField();
    expect(html).toContain(alphaClassOf('foreground', 'quiet', 'text'));
  });

  it('error state does NOT shift the label rung', () => {
    // The held-beat error swaps the helper row to text-rose; the label
    // must NOT change color, must NOT bold, must NOT shift (Tanya §3.3).
    const html = renderFieldWithError();
    expect(html).toContain(alphaClassOf('foreground', 'quiet', 'text'));
    expect(html).not.toContain('text-foreground/80');
  });

  it('error state lights the helper row at text-rose (unchanged behaviour)', () => {
    const html = renderFieldWithError();
    expect(html).toContain('text-rose');
    expect(html).toContain('A short held-beat error.');
  });
});
