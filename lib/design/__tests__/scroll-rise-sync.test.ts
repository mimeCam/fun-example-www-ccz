/**
 * Scroll-Rise Sync Test — CSS ↔ TS drift guard.
 *
 * Reads `app/globals.css`, asserts the scroll-rise CSS contract is intact:
 *   - `@keyframes sysEnterRise` exists with the correct from/to stops
 *   - `[data-sys-rise="pre"]` hides the card (opacity:0 + translateY)
 *   - `[data-sys-enter="rise"]` references `--sys-time-enter` + `--sys-ease-out`
 *   - `animation-fill-mode: both` is present (SSR-safety guard)
 *   - The Y offset is 12px (matches Tanya's "3× hover-lift" rationale)
 *   - The reduced-motion block collapses all animations to 0.01ms
 *
 * Also pins the TS stagger constants against expected values so that a
 * change to either side fails the test rather than silently drifting.
 *
 * Strategy: plain regex reads from disk — no build step, no codegen. Same
 * pattern as `skeleton-sync.test.ts` and `motion-sync.test.ts`.
 *
 * Credits: Mike K. (napkin #7 — sync-test spec, CSS-canonical rule),
 * Tanya D. (UX #100 — keyframe contract, 12px rationale, fill-mode guard),
 * Elon M. (first-principles — the test must pin the byte, not the intent).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  SCROLL_RISE_STAGGER_STEP_MS,
  SCROLL_RISE_STAGGER_CAP_MS,
  riseDelay,
} from '../../hooks/useScrollRise';

const CSS = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf-8');

// ─── Parser helpers ───────────────────────────────────────────────────────────

function readKeyframesBody(name: string): string | undefined {
  const rx = new RegExp(`@keyframes\\s+${name}\\s*\\{([\\s\\S]*?)\\n\\}`);
  return CSS.match(rx)?.[1];
}

function readSelectorBody(selector: string): string | undefined {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`);
  return CSS.match(rx)?.[1];
}

// ─── @keyframes sysEnterRise ──────────────────────────────────────────────────

describe('@keyframes sysEnterRise in globals.css', () => {
  it('keyframe exists', () => {
    expect(readKeyframesBody('sysEnterRise')).toBeDefined();
  });

  it('from: opacity 0', () => {
    expect(readKeyframesBody('sysEnterRise')).toMatch(/from[\s\S]*?opacity:\s*0/);
  });

  it('from: translateY(12px) — 3× hover-lift, perceptible without drama', () => {
    expect(readKeyframesBody('sysEnterRise')).toMatch(/from[\s\S]*?translateY\(12px\)/);
  });

  it('to: opacity 1', () => {
    expect(readKeyframesBody('sysEnterRise')).toMatch(/to[\s\S]*?opacity:\s*1/);
  });

  it('to: translateY(0) — card settles at rest', () => {
    expect(readKeyframesBody('sysEnterRise')).toMatch(/to[\s\S]*?translateY\(0\)/);
  });
});

// ─── [data-sys-rise="pre"] ────────────────────────────────────────────────────

describe('[data-sys-rise="pre"] pre-enter state in globals.css', () => {
  it('rule exists', () => {
    expect(readSelectorBody('[data-sys-rise="pre"]')).toBeDefined();
  });

  it('sets opacity: 0 — card is invisible before observer fires', () => {
    expect(readSelectorBody('[data-sys-rise="pre"]')).toMatch(/opacity:\s*0/);
  });

  it('sets translateY(12px) — matches keyframe from-stop', () => {
    expect(readSelectorBody('[data-sys-rise="pre"]')).toMatch(/translateY\(12px\)/);
  });
});

// ─── [data-sys-enter="rise"] ─────────────────────────────────────────────────

describe('[data-sys-enter="rise"] animation rule in globals.css', () => {
  it('rule exists', () => {
    expect(CSS).toContain('[data-sys-enter="rise"]');
  });

  it('references --sys-time-enter (MOTION.enter = 300ms)', () => {
    expect(CSS).toMatch(/\[data-sys-enter="rise"\][\s\S]*?var\(--sys-time-enter\)/);
  });

  it('references --sys-ease-out (decelerate into rest — settling-in feel)', () => {
    expect(CSS).toMatch(/\[data-sys-enter="rise"\][\s\S]*?var\(--sys-ease-out\)/);
  });

  it('uses sysEnterRise keyframe', () => {
    expect(CSS).toMatch(/\[data-sys-enter="rise"\][\s\S]*?sysEnterRise/);
  });

  it('animation-fill-mode: both — SSR safety + stagger delay coverage', () => {
    expect(CSS).toMatch(/\[data-sys-enter="rise"\][\s\S]*?both/);
  });

  it('will-change: opacity, transform — GPU compositing hint', () => {
    expect(CSS).toMatch(/\[data-sys-enter="rise"\][\s\S]*?will-change/);
  });

  it('uses --rise-delay CSS var for per-card stagger', () => {
    expect(CSS).toMatch(/\[data-sys-enter="rise"\][\s\S]*?--rise-delay/);
  });
});

// ─── Reduced-motion coverage ──────────────────────────────────────────────────

describe('reduced-motion block covers sysEnterRise', () => {
  it('global reduced-motion block sets animation-duration: 0.01ms !important', () => {
    expect(CSS).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation-duration:\s*0\.01ms\s*!important/,
    );
  });
});

// ─── TS ↔ CSS stagger constants ───────────────────────────────────────────────

describe('TS stagger constants alignment', () => {
  it('SCROLL_RISE_STAGGER_STEP_MS is 50ms', () => {
    expect(SCROLL_RISE_STAGGER_STEP_MS).toBe(50);
  });

  it('SCROLL_RISE_STAGGER_CAP_MS is 300ms', () => {
    expect(SCROLL_RISE_STAGGER_CAP_MS).toBe(300);
  });

  it('riseDelay(0) is 0ms — first card has no delay', () => {
    expect(riseDelay(0)).toBe(0);
  });

  it('riseDelay(6) equals cap — stagger wave is bounded', () => {
    expect(riseDelay(6)).toBe(SCROLL_RISE_STAGGER_CAP_MS);
  });
});
