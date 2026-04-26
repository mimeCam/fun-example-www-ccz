/**
 * ActionPressable · the fingertip receipt fence (Mike #71 / Tanya #89).
 *
 * Pattern lifted from `SuspenseFade.test.ts` — `.ts` (no JSX), node test
 * environment, `renderToStaticMarkup` for shape, source-pin via
 * `readFileSync` for the structural invariants. One falsifiable claim
 * per test, so a future contributor cannot drift the contract without
 * a red box on the very first run.
 *
 * What this suite locks down:
 *
 *   1. Byte-identity — the SR-only `aria-live` span, when mounted, holds
 *      the exact same word the visible label paints. Both come from the
 *      same `resolvePhaseLabel(phase, idle, settled)` call, so this is a
 *      tautology test that *locks* the tautology — any future contributor
 *      who wraps one but not the other fails CI (Mike §6.1 — same-source
 *      rule is load-bearing).
 *
 *   2. Once-per-settle — the live region is mounted exactly during
 *      `settled` and unmounted in `idle` / `busy`. Mount/unmount is what
 *      gives us the firing edge (Tanya §5.1 — exactly once on
 *      idle → settled).
 *
 *   3. Reduced-motion still announces — the witness lands; only easing
 *      falls away. Live region still mounts when `reduced=true`
 *      (Tanya §6.2 — paints zero pixels, no fade to collapse).
 *
 *   4. No double-announcement — `aria-label={hint}` is invariant across
 *      the phase matrix, so the SR is not also re-announcing the button
 *      name on top of the live region's word (Mike §6.4, Tanya §7).
 *
 * Plus source-pin invariants — the imports, the ARIA triple, the
 * `sr-only` Tailwind utility, and the privacy of the inner peer.
 *
 * Credits: Mike K. (#71 §4.3 — four-contract test plan, byte-identity
 * tautology, source-pin pattern), Tanya D. (#89 §4-§6 — fingertip
 * receipt covenant, once-per-settle, reduced-motion-immune,
 * no-double-announcement), Krystle C. (original byte-identity unit-test
 * discipline), `SuspenseFade.test.ts` (the .ts/createElement idiom this
 * file mirrors).
 */

import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ActionPressable } from '../ActionPressable';
import { CopyIcon } from '../Icons';
import type { ActionPhase } from '@/lib/utils/action-phase';

// ─── Tiny helpers — pure, ≤ 10 LOC each ──────────────────────────────────

interface RenderInputs {
  phase: ActionPhase;
  reduced?: boolean;
  idleLabel?: string;
  settledLabel?: string;
  hint?: string;
}

/** Idle glyph stand-in — typed via the shared icon set. Size is irrelevant
 *  to shape assertions, so we accept the default (18). */
function buildIcon(): ReactElement {
  return createElement(CopyIcon);
}

/** Build an `<ActionPressable>` element with sensible defaults. */
function build(inputs: RenderInputs): ReactElement {
  return createElement(ActionPressable, {
    onClick: () => undefined,
    phase: inputs.phase,
    reduced: inputs.reduced ?? false,
    icon: buildIcon(),
    idleLabel: inputs.idleLabel ?? 'Copy',
    settledLabel: inputs.settledLabel ?? 'Copied',
    hint: inputs.hint ?? 'Copy image',
  });
}

/** Render `<ActionPressable>` to static HTML for shape assertions. */
function render(inputs: RenderInputs): string {
  return renderToStaticMarkup(build(inputs));
}

/** Extract the SR-only live region's text content (or null if unmounted). */
function liveText(html: string): string | null {
  const m = html.match(
    /<span class="sr-only"[^>]*aria-live="polite"[^>]*>([^<]*)<\/span>/,
  );
  return m ? m[1] : null;
}

/** Extract the visible label's text — the span with the fade-in class. */
function labelText(html: string): string | null {
  // PhaseLabel renders `<span class="motion-safe:animate-fade-in" ...>`;
  // PhaseGlyph renders `<span class="inline-flex motion-safe:animate-fade-in" ...>`.
  // The leading-space prefix anchors to the label class, not the glyph one.
  const m = html.match(
    /<span class="motion-safe:animate-fade-in"[^>]*>([^<]*)<\/span>/,
  );
  return m ? m[1] : null;
}

/** Pull the value of an attribute off the rendered `<button …>` tag. */
function buttonAttr(html: string, attr: string): string | null {
  const re = new RegExp(`<button[^>]*\\s${attr}="([^"]*)"`);
  const m = html.match(re);
  return m ? m[1] : null;
}

// ─── 1 · Byte-identity — paint and voice share one source ────────────────

describe('ActionPressable — byte-identity (Mike §6.1, same-source rule)', () => {
  const phases: ReadonlyArray<ActionPhase> = ['idle', 'busy', 'settled'];

  it('the visible label and the live region carry the SAME string when both mount', () => {
    // Only `settled` has both spans present. The byte-identity covenant
    // is the equality of the two strings at that moment.
    const html = render({ phase: 'settled' });
    expect(labelText(html)).toBe('Copied');
    expect(liveText(html)).toBe('Copied');
    expect(labelText(html)).toBe(liveText(html));
  });

  it('the rule survives every verb table the SecondaryRow speaks', () => {
    // Tanya §5.2 — Copy/Save/Link verb table. If the resolver ever drifts,
    // this loop catches the row that broke first.
    const verbs: ReadonlyArray<readonly [string, string]> = [
      ['Copy', 'Copied'], ['Save', 'Saved'], ['Link', 'Copied'],
    ];
    for (const [idle, settled] of verbs) {
      const html = render({ phase: 'settled', idleLabel: idle, settledLabel: settled });
      expect(liveText(html)).toBe(settled);
      expect(labelText(html)).toBe(settled);
    }
  });

  it('idle and busy paint a label but leave the live region unmounted', () => {
    for (const phase of phases.filter((p) => p !== 'settled')) {
      const html = render({ phase });
      expect(liveText(html)).toBeNull();
      // Visible label is still painted — the eye reads the resting verb.
      expect(labelText(html)).not.toBeNull();
    }
  });
});

// ─── 2 · Once-per-settle — mount/unmount is the firing edge ──────────────

describe('ActionPressable — once-per-settle (Tanya §5.1)', () => {
  it('zero `aria-live` nodes in idle (live region unmounted at rest)', () => {
    const html = render({ phase: 'idle' });
    const matches = html.match(/aria-live="polite"/g) ?? [];
    expect(matches).toHaveLength(0);
  });

  it('zero `aria-live` nodes in busy (no announcement during work)', () => {
    const html = render({ phase: 'busy' });
    const matches = html.match(/aria-live="polite"/g) ?? [];
    expect(matches).toHaveLength(0);
  });

  it('exactly one `aria-live` node in settled (the once-per-settle edge)', () => {
    const html = render({ phase: 'settled' });
    const matches = html.match(/aria-live="polite"/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('the live region carries the canonical ARIA triple when it mounts', () => {
    const html = render({ phase: 'settled' });
    expect(html).toMatch(/class="sr-only"/);
    expect(html).toMatch(/aria-live="polite"/);
    expect(html).toMatch(/aria-atomic="true"/);
  });
});

// ─── 3 · Reduced-motion still announces — witness lands (Tanya §6.2) ─────

describe('ActionPressable — reduced motion does NOT suppress the receipt', () => {
  it('the live region mounts even when reduced=true (no fade to collapse)', () => {
    const html = render({ phase: 'settled', reduced: true });
    expect(liveText(html)).toBe('Copied');
  });

  it('reduced-motion paint and voice agree byte-for-byte', () => {
    const html = render({ phase: 'settled', reduced: true });
    expect(labelText(html)).toBe(liveText(html));
  });
});

// ─── 4 · No double-announcement — aria-label is phase-invariant ──────────

describe('ActionPressable — `aria-label` is the static name, not the witness', () => {
  it('aria-label resolves to `hint` and stays put across the phase matrix', () => {
    const phases: ReadonlyArray<ActionPhase> = ['idle', 'busy', 'settled'];
    const labels = phases.map((p) =>
      buttonAttr(render({ phase: p, hint: 'Copy image' }), 'aria-label'),
    );
    // All three renders must surface the *same* aria-label — otherwise SR
    // re-announces the button name on every transition (Mike §6.4 / Tanya §7).
    expect(new Set(labels).size).toBe(1);
    expect(labels[0]).toBe('Copy image');
  });

  it('the long-form hint is NEVER the announced word (kept off the live span)', () => {
    const html = render({
      phase: 'settled', idleLabel: 'Copy', settledLabel: 'Copied', hint: 'Copy image',
    });
    // The live region must hold the witness verb, not the long-form name.
    expect(liveText(html)).toBe('Copied');
    expect(liveText(html)).not.toBe('Copy image');
  });
});

// ─── 5 · Source-pin — adoption fences mirrored locally ───────────────────

const SRC_PATH = join(__dirname, '..', 'ActionPressable.tsx');
const SRC = readFileSync(SRC_PATH, 'utf8');

describe('ActionPressable · source-pin invariants', () => {
  it('imports announceOnSettle from the canonical helper module', () => {
    expect(SRC).toMatch(/announceOnSettle/);
    expect(SRC).toMatch(/from\s+['"]@\/lib\/utils\/action-phase['"]/);
  });

  it('the live region uses the Tailwind `sr-only` utility (zero pixels)', () => {
    expect(SRC).toMatch(/className="sr-only"/);
  });

  it('the live region carries the canonical ARIA triple', () => {
    expect(SRC).toMatch(/aria-live="polite"/);
    expect(SRC).toMatch(/aria-atomic="true"/);
  });

  it('the live region renders BOTH `resolvePhaseLabel` calls — same source', () => {
    // Two call sites with identical arguments by structure: PhaseLabel and
    // PhaseAnnouncement both resolve label text from the same triple.
    const calls = SRC.match(/resolvePhaseLabel\s*\(/g) ?? [];
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  it('PhaseAnnouncement is private to the module (not exported)', () => {
    // Mike §6.5 — keep the inner peer compose-only, like PhaseGlyph/PhaseLabel.
    expect(SRC).not.toMatch(/export\s+(?:default\s+)?function\s+PhaseAnnouncement/);
    expect(SRC).not.toMatch(/export\s*{\s*[^}]*\bPhaseAnnouncement\b[^}]*}/);
  });

  it('no new motion duration literal sneaks in via this peer', () => {
    expect(SRC).not.toMatch(/['"`]\d+ms['"`]/);
  });

  it('no new dependency import (a11y stays in-house — Mike §0)', () => {
    // The fence: only `@/components` and `@/lib` paths are allowed for now.
    const externalImports = SRC.match(/from\s+['"]([^@.][^'"]*)['"]/g) ?? [];
    const allowedExternals = externalImports.filter((line) =>
      // React itself is fine; everything else should ride on the alias.
      /from\s+['"]react(?:\/[a-z-]+)?['"]/.test(line),
    );
    expect(externalImports.length).toBe(allowedExternals.length);
  });
});

// ─── 6 · Module surface — stays sealed at compose-only props ─────────────

describe('ActionPressable — module surface', () => {
  it('exports the component (function)', () => {
    expect(typeof ActionPressable).toBe('function');
  });

  it('renders a native <button> via the shared Pressable primitive', () => {
    const html = render({ phase: 'idle' });
    expect(html).toMatch(/^<button\b/);
    expect(html).toMatch(/aria-label="Copy image"/);
    expect(html).toMatch(/title="Copy image"/);
  });
});

// ─── 7 · Variant pass-through — primary CTAs opt in (Mike #26 / Tanya #81) ─

/** Build with explicit variant/size — for primary-CTA tests. */
function buildWithVariant(
  variant: 'ghost' | 'solid',
  phase: ActionPhase,
  size: 'sm' | 'md' = 'sm',
): ReactElement {
  return createElement(ActionPressable, {
    onClick: () => undefined,
    phase,
    reduced: false,
    icon: buildIcon(),
    idleLabel: 'Share this thread',
    settledLabel: 'Shared',
    hint: 'Share this thread',
    variant,
    size,
    className: 'min-w-[14rem]',
  });
}

describe('ActionPressable — variant pass-through (Mike #26 §3 / Tanya #81 §5)', () => {
  it('default variant ("ghost") preserves the secondary-row chrome (no solid bg)', () => {
    const html = render({ phase: 'idle' });
    // Ghost is bg-transparent — solid's color-mix surface fragment must NOT
    // appear when the caller leaves variant unset. Drift would mean the
    // secondary row inherited a primary-CTA skin overnight.
    expect(html).not.toMatch(/var\(--token-accent\)_14%/);
  });

  it('variant="solid" routes the gold-mix surface fragment onto the rendered button', () => {
    const html = renderToStaticMarkup(buildWithVariant('solid', 'idle', 'md'));
    // The VARIANT_SOLID recipe in press-phase.ts mixes 14% accent into
    // surface for rest. If pass-through ever drops, this fragment is gone.
    expect(html).toMatch(/var\(--token-accent\)_14%/);
    // Solid uses the larger min-height (44px) at size="md" — width
    // discipline rides the same recipe (logic principle #4 — 48pt target).
    expect(html).toMatch(/min-h-\[44px\]/);
  });

  it('variant="solid" forwards the caller className (min-w-[14rem] survives)', () => {
    const html = renderToStaticMarkup(buildWithVariant('solid', 'idle', 'md'));
    expect(html).toMatch(/min-w-\[14rem\]/);
  });

  it('variant="solid" still mounts the SR-only PhaseAnnouncement on settled', () => {
    // The witness covenant is variant-agnostic — primary CTAs get the same
    // sr-only live region as the secondary row. (Tanya #81 §11 — the only
    // regression test that matters.)
    const html = renderToStaticMarkup(buildWithVariant('solid', 'settled', 'md'));
    expect(liveText(html)).toBe('Shared');
    expect(labelText(html)).toBe('Shared');
  });

  it('variant="solid" still hides the live region in idle and busy', () => {
    expect(liveText(renderToStaticMarkup(buildWithVariant('solid', 'idle', 'md')))).toBeNull();
    expect(liveText(renderToStaticMarkup(buildWithVariant('solid', 'busy', 'md')))).toBeNull();
  });

  it('variant="solid" + phase="settled" still surfaces the static aria-label hint', () => {
    const html = renderToStaticMarkup(buildWithVariant('solid', 'settled', 'md'));
    // aria-label is the gesture name (the hint), NOT the witness verb —
    // mirrors the secondary-row contract under the new variant axis.
    expect(html).toMatch(/aria-label="Share this thread"/);
  });
});
