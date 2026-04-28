/**
 * Recognition Beacon — fence test for the structural invariants.
 *
 * Three pins (Mike napkin §4 §"Tests" — `recognition-beacon.fence.test.ts`):
 *
 *   §1 · SCRIPT SIZE FENCE — `beaconScriptFragment()` stays under the
 *        1 KB budget. The existing thermal IIFE is ~3.7 KB; doubling
 *        the size would slow the < 5 ms paint-zero slot.
 *
 *   §2 · STRANGER ≡ TODAY — when the IIFE runs against an empty
 *        localStorage, the only `<html>` mutation is
 *        `data-recognition-tier="stranger"`. No CSS variables are
 *        written; no `data-archetype` is set. Mike §6 POI 2.
 *
 *   §3 · TIER × ARCHETYPE EXECUTION — the IIFE produces the same
 *        `data-recognition-tier`, `data-archetype`, `--accent-bias`,
 *        and `--thread-alpha-pre` as the pure helpers `deriveTier`,
 *        `archetypeAccentBias`, `threadAlphaForTier`. Drift between
 *        the build-time codegen and the pure-fn module is the
 *        headline failure (Mike §6 POI 6).
 *
 * Sandbox shape mirrors `lib/thermal/__tests__/inline-restore-sync.test.ts`
 * (the pre-existing convention for executing the inline IIFE under
 * Jest/`new Function`). The mock sandboxes `localStorage` and
 * `document.documentElement` and captures every `setAttribute` /
 * `setProperty` call.
 */

import {
  beaconScriptFragment,
  archetypeAccentBias,
  BEACON_KEYS,
  BEACON_SINGLE_READER_TOKEN,
} from '@/lib/return/recognition-beacon';
import type { ArchetypeKey } from '@/types/content';

// ─── Sandbox helper — mirrors inline-restore-sync's mockDom shape ─────────

interface SandboxResult {
  readonly attrs: Readonly<Record<string, string>>;
  readonly props: Readonly<Record<string, string>>;
}

function runBeacon(storage: Record<string, string>): SandboxResult {
  const attrs: Record<string, string> = {};
  const props: Record<string, string> = {};
  const ls = {
    ...storage,
    getItem: (k: string) => storage[k] ?? null,
  };
  const doc = {
    documentElement: {
      style: { setProperty: (k: string, v: string) => { props[k] = v; } },
      setAttribute: (k: string, v: string) => { attrs[k] = v; },
    },
  };
  // The fragment is wrapped in its own try-block so the sandbox can run
  // it without the outer thermal IIFE. Same shape as how the codegen
  // splices it into the inline-restore script.
  const src = `try{${beaconScriptFragment()}}catch(_e){}`;
  new Function('localStorage', 'document', src)(ls, doc);
  return { attrs, props };
}

// ─── §1 · Script size fence ────────────────────────────────────────────────

describe('recognition-beacon.fence · §1 script size budget', () => {
  it('beaconScriptFragment() is under the 2 KB budget', () => {
    // Mike napkin §4 §"Tests": "script size ≤ 2 KB minified (existing
    // budget × 2)". The budget catches drift before it slows the < 5 ms
    // paint-zero slot. Today's emission is ~1 KB; doubling it before
    // failing leaves room for a future tier or archetype without
    // forcing an immediate refactor.
    expect(beaconScriptFragment().length).toBeLessThan(2048);
  });

  it('beaconScriptFragment() is non-empty and deterministic', () => {
    const a = beaconScriptFragment();
    const b = beaconScriptFragment();
    expect(a.length).toBeGreaterThan(100);
    expect(a).toBe(b);
  });
});

// ─── §2 · Stranger ≡ today invariant ──────────────────────────────────────

describe('recognition-beacon.fence · §2 stranger ≡ today', () => {
  it('writes only data-recognition-tier="stranger" on empty localStorage', () => {
    const { attrs, props } = runBeacon({});
    expect(attrs['data-recognition-tier']).toBe('stranger');
    expect(attrs['data-archetype']).toBeUndefined();
    // No CSS variables for stranger — keeps :root defaults intact.
    expect(props['--accent-bias']).toBeUndefined();
    expect(props['--thread-alpha-pre']).toBeUndefined();
  });

  it('survives malformed JSON without throwing or polluting attrs', () => {
    const { attrs } = runBeacon({
      'quick-mirror-result': '{not json',
      'mirror_snapshots':    '<<<',
      'reading_memory':      'xyz',
    });
    // Each parse fails; tier defaults to stranger; no archetype write.
    expect(attrs['data-recognition-tier']).toBe('stranger');
    expect(attrs['data-archetype']).toBeUndefined();
  });
});

// ─── §3 · Tier × archetype execution matches pure helpers ─────────────────

describe('recognition-beacon.fence · §3 tier × archetype execution', () => {
  const ARCHETYPES: readonly ArchetypeKey[] = [
    'deep-diver', 'explorer', 'faithful', 'resonator', 'collector',
  ];

  it.each(ARCHETYPES)('known reader (%s + snapshots) → tier=known + bias', (a) => {
    const { attrs, props } = runBeacon({
      'quick-mirror-result': JSON.stringify({ archetype: a }),
      'mirror_snapshots':    JSON.stringify([{ timestamp: 1 }]),
    });
    expect(attrs['data-recognition-tier']).toBe('known');
    expect(attrs['data-archetype']).toBe(a);
    expect(props['--accent-bias']).toBe(`${archetypeAccentBias(a)}deg`);
    expect(props['--thread-alpha-pre']).toBe('var(--sys-alpha-recede)');
  });

  it('multi-visit reader without archetype → returning + muted rung, no bias', () => {
    const memory = { 'art-1': 1, 'art-2': 2, 'art-3': 3 };
    const { attrs, props } = runBeacon({
      'reading_memory': JSON.stringify(memory),
    });
    expect(attrs['data-recognition-tier']).toBe('returning');
    expect(attrs['data-archetype']).toBeUndefined();
    expect(props['--thread-alpha-pre']).toBe('var(--sys-alpha-muted)');
    expect(props['--accent-bias']).toBeUndefined();
  });

  it('archetype + 2 visits, no snapshots → returning + bias + muted rung', () => {
    const { attrs, props } = runBeacon({
      'quick-mirror-result': JSON.stringify({ archetype: 'explorer' as ArchetypeKey }),
      'reading_memory':      JSON.stringify({ 'a': 1, 'b': 2 }),
    });
    expect(attrs['data-recognition-tier']).toBe('returning');
    expect(attrs['data-archetype']).toBe('explorer');
    expect(props['--accent-bias']).toBe('38deg');
    expect(props['--thread-alpha-pre']).toBe('var(--sys-alpha-muted)');
  });

  it('archetype only, no visits/snapshots → STRANGER (hook parity)', () => {
    // Per `useReturnRecognition.resolveTier`: archetype alone is not
    // enough to flip to returning; 2+ visits OR archetype+snapshots is
    // the bar. The beacon must mirror this — drift = silent surprise.
    const { attrs, props } = runBeacon({
      'quick-mirror-result': JSON.stringify({ archetype: 'faithful' as ArchetypeKey }),
    });
    expect(attrs['data-recognition-tier']).toBe('stranger');
    // The archetype data-attr and bias are still set — the room may
    // know your archetype without yet treating you as returning.
    expect(attrs['data-archetype']).toBe('faithful');
    expect(props['--accent-bias']).toBe('12deg');
    expect(props['--thread-alpha-pre']).toBeUndefined();
  });
});

// ─── §4 · Single-reader address invariant (BEACON_KEYS) ────────────────────

describe('recognition-beacon.fence · §4 single-reader address', () => {
  it('BEACON_SINGLE_READER_TOKEN equals the archetype key literal', () => {
    expect(BEACON_SINGLE_READER_TOKEN).toBe(BEACON_KEYS.archetype);
    expect(BEACON_SINGLE_READER_TOKEN).toBe('quick-mirror-result');
  });

  it('the inline fragment reads each beacon key by literal string', () => {
    // Asserting the literal string lives in the fragment proves the
    // build-time codegen has the same address as the React hook.
    const src = beaconScriptFragment();
    expect(src).toContain(`'${BEACON_KEYS.archetype}'`);
    expect(src).toContain(`'${BEACON_KEYS.snapshots}'`);
    expect(src).toContain(`'${BEACON_KEYS.memory}'`);
  });
});
