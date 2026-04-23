/**
 * reply-lexicon — semantic-lock + total-coverage invariants.
 *
 * The voice contract for the 6th primitive lives here as code. Two
 * non-negotiables are encoded as tests, not intentions:
 *
 *  1. Total coverage — every `ReplyKind × ToneBucket` cell has a phrase.
 *     A future contributor adding a kind without phrases triggers a
 *     deterministic failure, not a runtime undefined.
 *
 *  2. Confirm-verb invariant — every `confirm`-shaped cell carries one of
 *     `CONFIRM_VERBS` (case-insensitive). Tone may tint; semantic must not
 *     erase the verb. (Elon §3.2 / Tanya §7.1 / Mike §6.4)
 *
 * Plus the archetype → tone fold (5 → 3) and the unknown-archetype default.
 */

import {
  archetypeToTone, phraseFor, confirmVerbInvariantHolds,
  REPLY_KINDS, TONE_BUCKETS, ARCHETYPE_KEYS,
  CONFIRM_KINDS, CONFIRM_VERBS, DEFAULT_TONE,
} from '@/lib/sharing/reply-lexicon';

describe('reply-lexicon — total coverage', () => {
  it('every ReplyKind × ToneBucket cell returns a non-empty phrase', () => {
    for (const k of REPLY_KINDS) {
      for (const t of TONE_BUCKETS) {
        const phrase = phraseFor(k, t);
        expect(typeof phrase).toBe('string');
        expect(phrase.length).toBeGreaterThan(0);
      }
    }
  });

  it('archetypeToTone maps every ArchetypeKey to a known ToneBucket', () => {
    for (const a of ARCHETYPE_KEYS) {
      expect(TONE_BUCKETS).toContain(archetypeToTone(a));
    }
  });
});

describe('reply-lexicon — semantic lock (confirm-verb invariant)', () => {
  it('confirmVerbInvariantHolds() reports true', () => {
    expect(confirmVerbInvariantHolds()).toBe(true);
  });

  it('every confirm cell contains a recognisable copy/save verb', () => {
    for (const k of CONFIRM_KINDS) {
      for (const t of TONE_BUCKETS) {
        const phrase = phraseFor(k, t).toLowerCase();
        const hit = CONFIRM_VERBS.some((v) => phrase.includes(v));
        expect({ kind: k, tone: t, phrase, hit }).toMatchObject({ hit: true });
      }
    }
  });
});

describe('reply-lexicon — archetype fold + defaults', () => {
  it('null / undefined archetype folds to the DEFAULT_TONE', () => {
    expect(archetypeToTone(null)).toBe(DEFAULT_TONE);
    expect(archetypeToTone(undefined)).toBe(DEFAULT_TONE);
  });

  it('reflective archetypes are the only ones to receive a tonal shift', () => {
    expect(archetypeToTone('deep-diver')).toBe('reflective');
    expect(archetypeToTone('faithful')).toBe('reflective');
  });

  it('kinetic archetypes converge on the neutral default', () => {
    expect(archetypeToTone('explorer')).toBe('kinetic');
    expect(archetypeToTone('collector')).toBe('kinetic');
  });

  it('resonator is the analytical archetype', () => {
    expect(archetypeToTone('resonator')).toBe('analytical');
  });
});

describe('reply-lexicon — under-tinting discipline (Tanya §7.2)', () => {
  it('reflective cells differ from kinetic for at least one confirm kind', () => {
    const differs = CONFIRM_KINDS.some(
      (k) => phraseFor(k, 'reflective') !== phraseFor(k, 'kinetic'),
    );
    expect(differs).toBe(true);
  });

  it('kinetic IS the default — null archetype gets the kinetic phrase', () => {
    for (const k of REPLY_KINDS) {
      expect(phraseFor(k, archetypeToTone(null))).toBe(phraseFor(k, 'kinetic'));
    }
  });
});
