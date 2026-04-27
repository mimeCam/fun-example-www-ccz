/**
 * Toast.alpha — per-file SSR pin for the chrome-muted register graduation.
 *
 * Mirror of `components/articles/__tests__/QuoteKeepsake.alpha.test.ts` and
 * `components/reading/__tests__/ThreadKeepsake.alpha.test.ts` (Mike napkin
 * #112 shape; Tanya UIX #87 §2). The single drift site in
 * `components/shared/Toast.tsx` (`border border-fog/15`) is now spoken in
 * the role-based 4-rung vocabulary owned by `lib/design/alpha.ts`. The
 * surface routes through `alphaClassOf('fog','muted','border')` — the
 * JIT-safe literal-table factory — instead of the hand-typed `/15` it
 * shipped at.
 *
 * Toast joins `AmbientNav`, `ThreadKeepsake`, and `QuoteKeepsake` at the
 * `muted` rung — the four-surface chrome register now shares one resolver
 * call as its name. The viewport's top-edge AmbientNav hairline and the
 * bottom-edge Toast pill hairline now speak the same dialect (Tanya §6).
 *
 * What this pin enforces (line-for-line peer of the keepsake siblings):
 *
 *   1. The `__testing__.SURFACE_BORDER` handle resolves to the canonical
 *      literal AND matches `alphaClassOf('fog','muted','border')`. A
 *      future swap of the rung vocabulary cannot silently shift the
 *      register without flipping this test (Mike §6d, Tanya UIX §3).
 *
 *   2. The Toast SSR markup carries the snapped class verbatim and **does
 *      not** carry the pre-snap drift value (`/15`). Drift absence is
 *      positive evidence that the file no longer needs a grandfather
 *      entry on `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`.
 *
 *   3. Drift sweep — no off-ledger `(bg|text|border|shadow)-<color>/N`
 *      shorthand anywhere in the rendered Toast (10/30/50/70/100 only).
 *
 *   4. Posture lock holds. Anchor (`fixed`, `bottom-sys-5`/`sm:bottom-sys-7`),
 *      surface (`bg-foreground` + `text-background`), shadow
 *      (`shadow-sys-float`), radius (`rounded-sys-medium`), padding
 *      (`px-sys-4`/`py-sys-3`), and the forced-colors carve-out
 *      (`forced-colors:border-[CanvasText]`) all survive the alpha bump
 *      unchanged. This pin is one literal swap, nothing else.
 *
 * Per-file pin only — NO sister coupling that asserts
 * `Toast.SURFACE_BORDER ≡ Quote.PREVIEW_FRAME ≡ Thread.PREVIEW_FRAME`. The
 * grandfather-list shrink is the project-level receipt that the four sister
 * surfaces now speak the same rung; each file owns its own per-file SSR
 * pin (Mike §PoI 5, rule of three+1: four callers is not a kernel — we
 * lift when a fifth surface arrives).
 *
 * Mirrors the keepsake-pin shape: `testEnvironment: 'node'`,
 * `react-dom/server` `renderToStaticMarkup`, `React.createElement`. No
 * jsdom dependency added; `useReducedMotionFlag` is SSR-safe (returns
 * `false` on the server) so the Toast renders cleanly without `window`.
 *
 * Credits: Mike K. (architect napkin #112 — per-file SSR pin shape, the
 * pair-snap heuristic continued to its fourth caller, the JIT-safe-
 * literal-table pattern; explicit refusal of `chromeBorder()` kernel-lift
 * at N=4), Tanya D. (UIX spec #87 §2 — felt-sentence calibration that
 * picked `muted`; §6 — top↔bottom chrome symmetry; §5 — kill the
 * docstring layer, the function call IS the name), Krystle C. (drift-
 * density ranking that picked Toast as the fourth snap), Elon M. (first-
 * principles teardown that pinned the right scope: one literal, routed
 * through the resolver, no docstring layer), Paul K. (the "next
 * contributor finds the register" outcome discipline that survives the
 * cut), Sid (this lift; no new primitives, the diff is a literal swap +
 * a per-file pin + one grandfather-list deletion).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { alphaClassOf } from '@/lib/design/alpha';
import { Toast, __testing__ } from '../Toast';
import type { ToastMsg } from '@/lib/sharing/toast-store';

const { SURFACE_BORDER, SURFACE_BASE } = __testing__;

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** Build a confirm-intent slot for SSR. Pure shape; no store interaction. */
function confirmMsg(): ToastMsg {
  return { id: 1, message: 'A line worth keeping.', intent: 'confirm', durationMs: 2000 };
}

/** Build a warn-intent slot for SSR. Same surface, different intent hint. */
function warnMsg(): ToastMsg {
  return { id: 2, message: 'Held for a beat.', intent: 'warn', durationMs: 3000 };
}

/** Render a Toast slot to a static markup string. SSR-safe (no jsdom). */
function renderToast(msg: ToastMsg): string {
  return renderToStaticMarkup(
    createElement(Toast, { msg, onDismissed: () => undefined }),
  );
}

// ─── 1 · Module-level rung handle points at the canonical rung ─────────────

describe('Toast — alpha-ledger handle points at the canonical rung', () => {
  it('SURFACE_BORDER resolves the muted-rung literal verbatim', () => {
    expect(SURFACE_BORDER).toBe(`border ${alphaClassOf('fog', 'muted', 'border')}`);
    expect(SURFACE_BORDER).toContain('border-fog/30');
  });

  it('SURFACE_BORDER is NOT the pre-snap drift value (border-fog/15)', () => {
    expect(SURFACE_BORDER).not.toContain('border-fog/15');
    expect(SURFACE_BORDER).not.toContain(alphaClassOf('fog', 'hairline', 'border'));
  });

  it('SURFACE_BASE composes the resolver call, not a hand-typed literal', () => {
    expect(SURFACE_BASE).toContain(alphaClassOf('fog', 'muted', 'border'));
    expect(SURFACE_BASE).not.toContain('border-fog/15');
  });
});

// ─── 2 · Toast SSR — the snapped surface paints the right rung ────────────

describe('Toast — pill paints the `muted` rung verbatim', () => {
  const html = renderToast(confirmMsg());

  it('pill uses border-fog/30 (= `muted`, not /15 drift)', () => {
    expect(html).toContain('border-fog/30');
    expect(html).toContain(alphaClassOf('fog', 'muted', 'border'));
  });

  it('pill does NOT carry the pre-snap /15 drift literal', () => {
    expect(html).not.toContain('border-fog/15');
  });

  it('warn-intent slot paints the same hairline (one register, no green/red split)', () => {
    const warn = renderToast(warnMsg());
    expect(warn).toContain('border-fog/30');
    expect(warn).not.toContain('border-fog/15');
  });
});

// ─── 3 · Posture lock — the literal swap touches one thing only ───────────

describe('Toast — posture lock holds across the alpha bump', () => {
  const html = renderToast(confirmMsg());

  it('surface inversion + shadow + radius + padding survive unchanged', () => {
    expect(html).toContain('bg-foreground');
    expect(html).toContain('text-background');
    expect(html).toContain('shadow-sys-float');
    expect(html).toContain('rounded-sys-medium');
    expect(html).toContain('px-sys-4');
    expect(html).toContain('py-sys-3');
  });

  it('anchor + golden-thread exclusion + z-rung survive unchanged', () => {
    expect(html).toContain('fixed');
    expect(html).toContain('z-sys-toast');
    expect(html).toContain('bottom-sys-5');
    expect(html).toContain('sm:bottom-sys-7');
    expect(html).toContain('pl-sys-5');
  });

  it('forced-colors carve-out remains pinned (Tanya UX #53 §3.6)', () => {
    expect(html).toContain('forced-colors:border-[CanvasText]');
    expect(html).toContain('forced-colors:bg-[Canvas]');
    expect(html).toContain('forced-colors:text-[CanvasText]');
    expect(html).toContain('forced-colors:shadow-none');
  });

  it('message text renders verbatim into the pill body', () => {
    expect(html).toContain('A line worth keeping.');
  });
});

// ─── 4 · Drift sweep — full SSR carries zero off-ledger color-alpha ───────

describe('Toast — full SSR shows zero off-ledger color-alpha drift', () => {
  it('no /N outside {10,30,50,70,100} in any (bg|text|border|shadow) shorthand', () => {
    const html = renderToast(confirmMsg()) + renderToast(warnMsg());
    const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
    const offLedger: string[] = [];
    for (const m of html.matchAll(RX)) {
      // Legal rungs: 10/30/50/70 (+ /100 motion endpoint).
      if (![10, 30, 50, 70, 100].includes(Number(m[1]))) offLedger.push(m[0]);
    }
    expect(offLedger).toEqual([]);
  });
});
