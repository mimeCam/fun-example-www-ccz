/**
 * Recognition Surface Selector — truth-table + mutual-exclusion proof.
 *
 * Two layers:
 *
 *   1. Truth-table — every documented row in the selector's contract
 *      maps a context to a verdict; we verify each row.
 *
 *   2. Mutual-exclusion property — for ANY synthesised context, the
 *      selector returns at most one of `letter` | `whisper`. This is
 *      the invariant the feature exists to prove. Cartesian product
 *      across (surface × tier × via × dismissed × hasWhisper).
 *
 * Pure module under test — `node` test environment is sufficient.
 */

import { pickRecognitionSurface } from '@/lib/return/recognition-surface';
import type {
  RecognitionSurface,
  RecognitionSurfaceContext,
  SurfaceLocation,
} from '@/lib/return/recognition-surface';
import type { ReturnRecognitionState, RecognitionTier } from '@/lib/hooks/useReturnRecognition';
import type { ArchetypeKey } from '@/types/content';

// ─── Fixture builders ─────────────────────────────────────────

function makeRecognition(opts: {
  tier: RecognitionTier;
  archetype?: ArchetypeKey | null;
  hasWhisper?: boolean;
}): ReturnRecognitionState {
  const archetype = opts.archetype ?? (opts.tier === 'stranger' ? null : 'deep-diver');
  const hasWhisper = opts.hasWhisper ?? (opts.tier !== 'stranger');
  return {
    isReturning: opts.tier !== 'stranger',
    archetype,
    daysSinceLastVisit: opts.tier === 'stranger' ? null : 5,
    visitCount: opts.tier === 'stranger' ? 0 : 3,
    recognitionTier: opts.tier,
    lastWhisper: hasWhisper ? 'the room remembers your last descent' : null,
  };
}

function makeCtx(over: Partial<RecognitionSurfaceContext> = {}): RecognitionSurfaceContext {
  return {
    surface: 'home',
    recognition: makeRecognition({ tier: 'returning' }),
    viaArchetype: null,
    letterDismissed: false,
    ...over,
  };
}

// ─── 1 · Truth table — Mike's spec §5 ─────────────────────────

describe('pickRecognitionSurface · home rail', () => {
  it('stranger → silent', () => {
    const ctx = makeCtx({ recognition: makeRecognition({ tier: 'stranger' }) });
    expect(pickRecognitionSurface(ctx)).toBe('silent');
  });

  it('returning + no via + not dismissed → letter', () => {
    expect(pickRecognitionSurface(makeCtx())).toBe('letter');
  });

  it('returning + via → whisper (deep-link supersedes letter)', () => {
    const ctx = makeCtx({ viaArchetype: 'deep-diver' });
    expect(pickRecognitionSurface(ctx)).toBe('whisper');
  });

  it('returning + dismissed → whisper (graceful fallback)', () => {
    expect(pickRecognitionSurface(makeCtx({ letterDismissed: true }))).toBe('whisper');
  });

  it('known + no via + not dismissed → letter', () => {
    const ctx = makeCtx({ recognition: makeRecognition({ tier: 'known' }) });
    expect(pickRecognitionSurface(ctx)).toBe('letter');
  });

  it('known + dismissed → whisper', () => {
    const ctx = makeCtx({
      recognition: makeRecognition({ tier: 'known' }),
      letterDismissed: true,
    });
    expect(pickRecognitionSurface(ctx)).toBe('whisper');
  });

  it('home + dismissed but lastWhisper missing → silent (fail-quiet)', () => {
    const ctx = makeCtx({
      recognition: makeRecognition({ tier: 'returning', hasWhisper: false }),
      letterDismissed: true,
    });
    expect(pickRecognitionSurface(ctx)).toBe('silent');
  });
});

describe('pickRecognitionSurface · article rail', () => {
  function articleCtx(over: Partial<RecognitionSurfaceContext> = {}) {
    return makeCtx({ surface: 'article', ...over });
  }

  it('stranger → silent', () => {
    const ctx = articleCtx({ recognition: makeRecognition({ tier: 'stranger' }) });
    expect(pickRecognitionSurface(ctx)).toBe('silent');
  });

  it('returning → whisper', () => {
    expect(pickRecognitionSurface(articleCtx())).toBe('whisper');
  });

  it('known → whisper', () => {
    const ctx = articleCtx({ recognition: makeRecognition({ tier: 'known' }) });
    expect(pickRecognitionSurface(ctx)).toBe('whisper');
  });

  it('returning + lastWhisper missing → silent (fail-quiet)', () => {
    const ctx = articleCtx({
      recognition: makeRecognition({ tier: 'returning', hasWhisper: false }),
    });
    expect(pickRecognitionSurface(ctx)).toBe('silent');
  });

  it('letter is NEVER returned on article surface', () => {
    // Property: across every plausible context-on-article, no `letter` ever leaks.
    const surfaces: SurfaceLocation[] = ['article'];
    const tiers: RecognitionTier[] = ['stranger', 'returning', 'known'];
    const vias: (ArchetypeKey | null)[] = [null, 'deep-diver', 'explorer'];
    const dismissed = [true, false];
    for (const surface of surfaces) for (const tier of tiers)
      for (const via of vias) for (const d of dismissed) {
        const ctx = makeCtx({
          surface,
          recognition: makeRecognition({ tier }),
          viaArchetype: via,
          letterDismissed: d,
        });
        expect(pickRecognitionSurface(ctx)).not.toBe('letter');
      }
  });
});

// ─── 2 · Mutual-exclusion proof — Mike's spec §5 invariant ────

describe('pickRecognitionSurface · mutual-exclusion property', () => {
  const tiers: RecognitionTier[] = ['stranger', 'returning', 'known'];
  const vias: (ArchetypeKey | null)[] = [null, 'deep-diver', 'explorer', 'collector'];
  const dismissed = [true, false];
  const whisper = [true, false];
  const surfaces: SurfaceLocation[] = ['home', 'article'];

  it('returns exactly one of letter|whisper|silent for every context', () => {
    const valid: RecognitionSurface[] = ['letter', 'whisper', 'silent'];
    for (const surface of surfaces) for (const tier of tiers)
      for (const via of vias) for (const d of dismissed) for (const w of whisper) {
        const ctx = makeCtx({
          surface,
          recognition: makeRecognition({ tier, hasWhisper: w }),
          viaArchetype: via,
          letterDismissed: d,
        });
        const result = pickRecognitionSurface(ctx);
        expect(valid).toContain(result);
      }
  });

  it('never picks `letter` when route is `article` (route-level exclusion)', () => {
    for (const tier of tiers) for (const via of vias)
      for (const d of dismissed) for (const w of whisper) {
        const ctx = makeCtx({
          surface: 'article',
          recognition: makeRecognition({ tier, hasWhisper: w }),
          viaArchetype: via,
          letterDismissed: d,
        });
        expect(pickRecognitionSurface(ctx)).not.toBe('letter');
      }
  });

  it('never picks `whisper` without a synthesised whisper line', () => {
    // Fail-quiet rule (invisible-product.md §5): nothing speaks empty.
    for (const surface of surfaces) for (const tier of tiers)
      for (const via of vias) for (const d of dismissed) {
        const ctx = makeCtx({
          surface,
          recognition: makeRecognition({ tier, hasWhisper: false }),
          viaArchetype: via,
          letterDismissed: d,
        });
        expect(pickRecognitionSurface(ctx)).not.toBe('whisper');
      }
  });

  it('stranger always → silent (no recognition without history)', () => {
    for (const surface of surfaces) for (const via of vias)
      for (const d of dismissed) for (const w of whisper) {
        const ctx = makeCtx({
          surface,
          recognition: makeRecognition({ tier: 'stranger', hasWhisper: w }),
          viaArchetype: via,
          letterDismissed: d,
        });
        expect(pickRecognitionSurface(ctx)).toBe('silent');
      }
  });
});

// ─── 3 · Determinism — same input twice → same output ─────────

describe('pickRecognitionSurface · purity', () => {
  it('is referentially transparent (no hidden state)', () => {
    const ctx = makeCtx({ viaArchetype: 'resonator' });
    const a = pickRecognitionSurface(ctx);
    const b = pickRecognitionSurface(ctx);
    const c = pickRecognitionSurface({ ...ctx });
    expect(a).toBe(b);
    expect(b).toBe(c);
  });
});
