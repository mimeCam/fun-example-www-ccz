/**
 * Reader-Locale substrate — behavioral pin.
 *
 * Pins three things:
 *   1. Each flavor returns a non-empty string for a valid ISO.
 *   2. Each flavor returns '' for invalid input — never throws.
 *   3. Each flavor passes `undefined` (NOT a string literal) as the
 *      first arg to `Intl.DateTimeFormat`. This is the "substrate-
 *      itself-never-locks-a-locale" assertion — Jason's surviving
 *      contribution distilled by Elon, ratified by Mike.
 *   4. Output shape under a forced locale (constructor arg in the
 *      spy). Locks the *shape* of each flavor, not our default locale.
 *
 * Credits: Mike K. (#76 §6 test plan), Jason F. (substrate-self-
 * assertion), Tanya D. (#2 §9 acceptance — UK reader sees `25 April`,
 * US reader sees `Apr 25`, the substrate's ledger pins both).
 */

import {
  formatReaderShortDate,
  formatReaderMonthDay,
  formatReaderLongDate,
} from '../reader-locale';

describe('reader-locale substrate — three named flavors', () => {
  const ISO = '2026-04-25T12:00:00.000Z';

  describe('happy path — non-empty output for valid ISO', () => {
    test.each([
      ['formatReaderShortDate', formatReaderShortDate],
      ['formatReaderMonthDay',  formatReaderMonthDay],
      ['formatReaderLongDate',  formatReaderLongDate],
    ])('%s(iso) returns a non-empty string', (_name, fn) => {
      const out = fn(ISO);
      expect(typeof out).toBe('string');
      expect(out.length).toBeGreaterThan(0);
    });
  });

  describe('bad input — never throws, returns empty string', () => {
    const cases: Array<[string, string | null | undefined]> = [
      ['empty string',  ''],
      ['null',          null],
      ['undefined',     undefined],
      ['garbage',       'not-a-date'],
      ['NaN ISO',       'Invalid'],
    ];
    test.each(cases)('returns "" for %s', (_label, bad) => {
      expect(formatReaderShortDate(bad)).toBe('');
      expect(formatReaderMonthDay(bad)).toBe('');
      expect(formatReaderLongDate(bad)).toBe('');
    });
  });

  describe('substrate-itself-never-locks-a-locale (the bonus pin)', () => {
    /**
     * Spy on `Intl.DateTimeFormat` constructor. Every flavor must invoke
     * it with `undefined` as the first arg — never a literal locale.
     * If a future contributor "improves" the substrate by hard-coding
     * `'en-US'` here, this test fires before the centrality guard does.
     */
    let original: typeof Intl.DateTimeFormat;
    let firstArgs: unknown[];

    beforeEach(() => {
      original = Intl.DateTimeFormat;
      firstArgs = [];
      Intl.DateTimeFormat = function spy(locale?: unknown, opts?: Intl.DateTimeFormatOptions) {
        firstArgs.push(locale);
        return new original(locale as string | undefined, opts);
      } as unknown as typeof Intl.DateTimeFormat;
    });

    afterEach(() => {
      Intl.DateTimeFormat = original;
    });

    test('formatReaderShortDate passes undefined', () => {
      formatReaderShortDate(ISO);
      expect(firstArgs).toEqual([undefined]);
    });

    test('formatReaderMonthDay passes undefined', () => {
      formatReaderMonthDay(ISO);
      expect(firstArgs).toEqual([undefined]);
    });

    test('formatReaderLongDate passes undefined', () => {
      formatReaderLongDate(ISO);
      expect(firstArgs).toEqual([undefined]);
    });
  });

  describe('shape — forced locale pins the flavor, not the default', () => {
    /**
     * Forces `'en-GB'` via the constructor spy so the assertion proves
     * the *shape* (`"25 April 2026"`) rather than locking our default
     * to en-GB. The substrate itself still passes `undefined` — see the
     * spy block above.
     */
    let original: typeof Intl.DateTimeFormat;

    beforeEach(() => {
      original = Intl.DateTimeFormat;
      Intl.DateTimeFormat = function force(_l?: unknown, opts?: Intl.DateTimeFormatOptions) {
        return new original('en-GB', opts);
      } as unknown as typeof Intl.DateTimeFormat;
    });

    afterEach(() => {
      Intl.DateTimeFormat = original;
    });

    test('short flavor → "25 Apr" under en-GB', () => {
      expect(formatReaderShortDate(ISO)).toBe('25 Apr');
    });

    test('month-day flavor → "25 April" under en-GB', () => {
      expect(formatReaderMonthDay(ISO)).toBe('25 April');
    });

    test('long flavor → "25 April 2026" under en-GB', () => {
      expect(formatReaderLongDate(ISO)).toBe('25 April 2026');
    });
  });
});
