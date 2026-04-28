/**
 * share-links — round-trip pin for the orphan that just graduated.
 *
 * The contract is small and load-bearing: a sentence handed to
 * `generateShareLink` MUST come out of `parseHighlightFragment` byte-for-
 * byte equal (modulo the `cleanText` whitespace/quote normalisation that
 * the encoder ships through). Same shape, both directions, no surprises.
 *
 * The orphan-graduates fence (sister test in this folder) keeps the file
 * connected to a non-test importer; this round-trip pins the URL contract
 * itself so a future encoder/decoder drift fails here first.
 *
 * Credits: Mike K. (#39 — the round-trip pin in the punch list), Sid
 * (this lift; one-shot per assertion, no jsdom required — the share-
 * links module is pure-string).
 */

import {
  clearHighlightFragment,
  generateShareLink,
  hasHighlightFragment,
  parseHighlightFragment,
} from '@/lib/sharing/share-links';
import { cleanText } from '@/lib/sharing/text-utils';

const BASE = 'https://blog.example.com/article/passage-one';

describe('share-links — generate ↔ parse round-trip', () => {
  it('preserves a simple ASCII sentence (first 100 chars)', () => {
    const sentence = 'The thermal engine warms when the reader leans in.';
    const url = generateShareLink(BASE, sentence);
    expect(parseHighlightFragment(url)).toBe(cleanText(sentence));
  });

  it('truncates at 100 chars (the encoder snapshot pin)', () => {
    const long = 'word '.repeat(40); // 200 chars before cleanText
    const url = generateShareLink(BASE, long);
    const parsed = parseHighlightFragment(url) ?? '';
    expect(parsed.length).toBeLessThanOrEqual(100);
    expect(cleanText(long).startsWith(parsed)).toBe(true);
  });

  it('round-trips Unicode through `encodeURIComponent`', () => {
    const sentence = 'The blog reads you back — even when ümlauts arrive.';
    const url = generateShareLink(BASE, sentence);
    expect(parseHighlightFragment(url)).toBe(cleanText(sentence));
  });

  it('strips a pre-existing fragment from the base before composing', () => {
    const sentence = 'A quiet sentence.';
    const dirty = `${BASE}#highlight=DEADBEEF&text=stale`;
    const url = generateShareLink(dirty, sentence);
    expect(url.startsWith(`${BASE}#highlight=`)).toBe(true);
    expect(parseHighlightFragment(url)).toBe(cleanText(sentence));
  });

  it('emits the canonical fragment shape `#highlight=HASH&text=ENC`', () => {
    const url = generateShareLink(BASE, 'A canonical sentence.');
    expect(url).toMatch(/#highlight=[A-Za-z0-9]+&text=[A-Za-z0-9%.~_-]+/);
  });
});

describe('share-links — `parseHighlightFragment` honesty', () => {
  it('returns null when the URL has no highlight fragment', () => {
    expect(parseHighlightFragment(BASE)).toBeNull();
    expect(parseHighlightFragment(`${BASE}#other=value`)).toBeNull();
  });

  it('returns null when the fragment is malformed (text= missing)', () => {
    expect(parseHighlightFragment(`${BASE}#highlight=HASH`)).toBeNull();
  });
});

describe('share-links — server-safe helpers (no window)', () => {
  it('hasHighlightFragment is false when window is undefined', () => {
    // jest's testEnvironment is `node`; window is genuinely absent.
    expect(hasHighlightFragment()).toBe(false);
  });

  it('clearHighlightFragment is a no-op without window.history', () => {
    // Should not throw. This is the SSR-safety contract.
    expect(() => clearHighlightFragment()).not.toThrow();
  });
});
