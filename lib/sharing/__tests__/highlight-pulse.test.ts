/**
 * highlight-pulse — unit pin for the gold-pulse primitive.
 *
 * Pinned claims (one falsifiable assertion per `it`):
 *
 *   1. The single source of gold sits in `HIGHLIGHT_TINT` and routes
 *      through `var(--gold)` via the design-system mixer (no raw rgba).
 *   2. `PULSE_DWELL_MS` is the canonical 3 s hold — both callers use it.
 *   3. `ensurePulseKeyframes` is idempotent: a second call does not
 *      append a second `<style>` element, even after manual injection.
 *   4. `paintPulse` writes the tint AND (when motion-allowed) the
 *      `pulse-highlight 1s ease-in-out 2` animation; reduced-motion
 *      skips the animation but keeps the tint.
 *   5. `pulseElementGold` returns a cleanup that round-trips the
 *      element's pre-pulse inline-style values byte-identical.
 *   6. `pulseElementGold` is SSR-safe — calling without `document`
 *      does not throw the keyframe installer.
 *
 * jsdom is not configured; we mount a minimal `document` shim via the
 * `globalThis` seam used by the kernel and exercise the pure helpers
 * directly. Mounting a real DOM is QA's job.
 *
 * Credits: Mike K. (#92 — the unit-pin shape: idle / reduced / cleanup,
 * one assertion per claim, no scene mounting), Tanya D. (#68 — the
 * "one source" axis assertion), Sid (this lift; pattern from
 * `useReducedMotion.test.ts` + `clipboard-utils.test.ts`).
 */

import {
  HIGHLIGHT_TINT,
  HIGHLIGHT_TRANSITION,
  PULSE_DWELL_MS,
  pulseElementGold,
  __testing__,
} from '../highlight-pulse';

const {
  HIGHLIGHT_KEYFRAMES_ID,
  KEYFRAMES_CSS,
  ensurePulseKeyframes,
  snapshotStyle,
  paintPulse,
  restoreStyle,
} = __testing__;

// ─── Minimal DOM shim — keyframe installer + element mocks ────────────────
//
// Each test that needs `document` builds a fresh shim; we never share state
// across `it` blocks. The shim is intentionally tiny: just enough to prove
// idempotency and the snapshot/restore round-trip without pulling in jsdom.

interface FakeStyle {
  transition: string;
  backgroundColor: string;
  animation: string;
}
interface FakeElement {
  style: FakeStyle;
  id?: string;
  textContent?: string;
}

function makeStyleElement(): FakeElement {
  return { style: { transition: '', backgroundColor: '', animation: '' } };
}

function installFakeDocument(): { head: FakeElement[]; nodes: Map<string, FakeElement> } {
  const nodes = new Map<string, FakeElement>();
  const head: FakeElement[] = [];
  const fakeDoc = {
    getElementById: (id: string): FakeElement | null => nodes.get(id) ?? null,
    createElement: (_tag: string): FakeElement => makeStyleElement(),
    head: { appendChild: (n: FakeElement): void => { head.push(n); if (n.id) nodes.set(n.id, n); } },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).document = fakeDoc;
  return { head, nodes };
}

function uninstallFakeDocument(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).document;
}

// ─── 1 · One source of gold ──────────────────────────────────────────────

describe('highlight-pulse · one source of gold', () => {
  it('HIGHLIGHT_TINT routes through var(--gold) via the mixer', () => {
    expect(HIGHLIGHT_TINT).toBe(
      'color-mix(in srgb, var(--gold) 10%, transparent)',
    );
  });

  it('HIGHLIGHT_TRANSITION pins the 0.3 s dual-property tail', () => {
    expect(HIGHLIGHT_TRANSITION).toBe(
      'background-color 0.3s ease, transform 0.3s ease',
    );
  });

  it('PULSE_DWELL_MS is the canonical 3 s hold', () => {
    expect(PULSE_DWELL_MS).toBe(3000);
  });

  it('keyframes CSS pins the sub-pixel scale (1.005 not 1.01)', () => {
    expect(KEYFRAMES_CSS).toMatch(/scale\(1\.005\)/);
    expect(KEYFRAMES_CSS).not.toMatch(/scale\(1\.01\)/);
  });
});

// ─── 2 · Keyframe installer is idempotent ────────────────────────────────

describe('highlight-pulse · ensurePulseKeyframes', () => {
  it('appends exactly one <style> the first call', () => {
    const { head } = installFakeDocument();
    try {
      ensurePulseKeyframes();
      expect(head.length).toBe(1);
      expect(head[0].id).toBe(HIGHLIGHT_KEYFRAMES_ID);
      expect(head[0].textContent).toBe(KEYFRAMES_CSS);
    } finally {
      uninstallFakeDocument();
    }
  });

  it('does not append a second <style> on re-entry', () => {
    const { head } = installFakeDocument();
    try {
      ensurePulseKeyframes();
      ensurePulseKeyframes();
      ensurePulseKeyframes();
      expect(head.length).toBe(1);
    } finally {
      uninstallFakeDocument();
    }
  });

  it('is SSR-safe — no throw when document is absent', () => {
    uninstallFakeDocument();
    expect(() => ensurePulseKeyframes()).not.toThrow();
  });
});

// ─── 3 · Paint + snapshot + restore round-trip ───────────────────────────

describe('highlight-pulse · paintPulse / restoreStyle', () => {
  function makeEl(initial?: Partial<FakeStyle>): FakeElement {
    return {
      style: { transition: '', backgroundColor: '', animation: '', ...initial },
    };
  }

  it('paintPulse writes the gold tint to backgroundColor', () => {
    const el = makeEl();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paintPulse(el as any, false);
    expect(el.style.backgroundColor).toBe(HIGHLIGHT_TINT);
    expect(el.style.transition).toBe(HIGHLIGHT_TRANSITION);
  });

  it('paintPulse runs pulse-highlight 1s × 2 when motion is permitted', () => {
    const el = makeEl();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paintPulse(el as any, false);
    expect(el.style.animation).toBe('pulse-highlight 1s ease-in-out 2');
  });

  it('paintPulse skips the animation under reduced-motion', () => {
    const el = makeEl();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paintPulse(el as any, true);
    expect(el.style.animation).toBe(''); // tint lands; motion stays home
    expect(el.style.backgroundColor).toBe(HIGHLIGHT_TINT);
  });

  it('snapshotStyle + restoreStyle round-trip is byte-identical', () => {
    const before: FakeStyle = {
      transition: 'opacity 1s linear',
      backgroundColor: 'rgb(10, 20, 30)',
      animation: 'fade 2s',
    };
    const el = makeEl(before);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snap = snapshotStyle(el as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paintPulse(el as any, false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    restoreStyle(el as any, snap);
    expect(el.style).toEqual(before);
  });
});

// ─── 4 · Public API: pulseElementGold ────────────────────────────────────

describe('highlight-pulse · pulseElementGold', () => {
  it('returns a cleanup function (caller owns the timer)', () => {
    installFakeDocument();
    try {
      const el: FakeElement = {
        style: { transition: '', backgroundColor: '', animation: '' },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cleanup = pulseElementGold(el as any, false);
      expect(typeof cleanup).toBe('function');
      expect(el.style.backgroundColor).toBe(HIGHLIGHT_TINT);
      cleanup();
      expect(el.style.backgroundColor).toBe('');
      expect(el.style.animation).toBe('');
    } finally {
      uninstallFakeDocument();
    }
  });

  it('passes reduced-motion through (tint lands, scale skipped)', () => {
    installFakeDocument();
    try {
      const el: FakeElement = {
        style: { transition: '', backgroundColor: '', animation: '' },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cleanup = pulseElementGold(el as any, true);
      expect(el.style.backgroundColor).toBe(HIGHLIGHT_TINT);
      expect(el.style.animation).toBe('');
      cleanup();
    } finally {
      uninstallFakeDocument();
    }
  });
});
