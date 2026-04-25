/**
 * `excerpt()` — pin the cold-open contract (Mike §4 + Tanya §2).
 *
 * Covered:
 *  1.  Markdown emphasis stripped; words preserved
 *  1b. Stray `*nix` asterisk preserved (no paired emphasis)
 *  2.  Link text kept; URL dropped
 *  3.  Image syntax dropped entirely (alt-text dropped)
 *  4.  Heading marker dropped, heading text kept
 *  5.  Word-boundary clip; never mid-word
 *  6.  Short input returned verbatim, no orphan ellipsis
 *  7.  Empty / whitespace-only input → empty string (no orphan `…`)
 *  8.  Multi-byte unicode: emoji + CJK clip without breaking surrogates
 *  9.  Whitespace runs collapsed
 *  10. List bullets stripped → flowing prose
 *  +   `…` is U+2026 (one glyph), never three periods
 *  +   Sentence-terminated clip omits the ellipsis (Tanya §5.1)
 *  +   Soft-tail (`,` `;` `:`) trimmed before the ellipsis
 *  +   Blockquote markers dropped
 *  +   Default budget = 160 characters
 *  +   CJK without spaces hard-clips at code-point budget
 */

import { excerpt } from '../excerpt';

const ELLIPSIS = '…';

describe('excerpt() — markdown silence', () => {
  test('1. strips paired emphasis, keeps the words', () => {
    expect(excerpt('**bold** _italic_ `code` together', 200))
      .toBe('bold italic code together');
  });

  test('1b. preserves stray asterisk in `*nix` (no closing pair)', () => {
    expect(excerpt('*nix systems are sturdy', 200))
      .toBe('*nix systems are sturdy');
  });

  test('2. renders link text only; URL dropped', () => {
    expect(excerpt('See [the docs](https://example.com) for more.', 200))
      .toBe('See the docs for more.');
  });

  test('3. drops image syntax entirely (alt-text dropped — Mike §4)', () => {
    expect(excerpt('![sunrise](sun.png) Begin the day with care.', 200))
      .toBe('Begin the day with care.');
  });

  test('4. drops heading marker, keeps heading text', () => {
    expect(excerpt('# A Heading\n\nthe body follows', 200))
      .toBe('A Heading the body follows');
  });

  test('blockquote markers dropped', () => {
    expect(excerpt('> quoted line\n> continues here', 200))
      .toBe('quoted line continues here');
  });

  test('10. list bullets stripped; reads as flowing prose', () => {
    expect(excerpt('- one\n- two\n- three', 200)).toBe('one two three');
  });

  test('ordered list markers stripped', () => {
    expect(excerpt('1. first\n2. second\n3. third', 200))
      .toBe('first second third');
  });
});

describe('excerpt() — word honesty', () => {
  const SOURCE =
    'The cold open is the half-second between painted and engaged.';

  test('5. clips at last word boundary; never mid-word', () => {
    const out = excerpt(SOURCE, 30);
    expect(out.endsWith(ELLIPSIS)).toBe(true);
    const body = out.slice(0, -1);                   // drop the … glyph
    expect(SOURCE.startsWith(body)).toBe(true);      // body is a prefix
    const next = SOURCE.charAt(body.length);
    // the char immediately after `body` in source is whitespace —
    // proof of a word-boundary cut
    expect(next === ' ' || next === '').toBe(true);
  });

  test('6. short input returned verbatim, no orphan ellipsis', () => {
    expect(excerpt('A short note.', 200)).toBe('A short note.');
  });

  test('default budget is 160 characters', () => {
    const text = 'word '.repeat(100); // ~500 chars, every 5th is space
    const out = excerpt(text);
    expect(Array.from(out).length).toBeLessThanOrEqual(161);
  });
});

describe('excerpt() — ellipsis discipline', () => {
  test('7. empty input returns empty string (no orphan …)', () => {
    expect(excerpt('', 200)).toBe('');
  });

  test('7b. whitespace-only input returns empty string', () => {
    expect(excerpt('   \n\t  ', 200)).toBe('');
  });

  test('uses U+2026 (one glyph), never three periods', () => {
    const out = excerpt('one two three four five six seven eight nine ten', 20);
    expect(out).toContain(ELLIPSIS);
    expect(out).not.toContain('...');
    // verify the one-glyph promise: `…` is a single code point
    expect(Array.from(ELLIPSIS).length).toBe(1);
  });

  test('sentence-terminated clip omits the ellipsis (Tanya §5.1)', () => {
    const text =
      'The first sentence ends here. And then a long second sentence continues for many more words on and on.';
    const out = excerpt(text, 30);
    expect(out.endsWith(ELLIPSIS)).toBe(false);
    expect(out.endsWith('.')).toBe(true);
  });

  test('soft-tail punctuation trimmed before the ellipsis', () => {
    // window of 20 chars lands inside "words, more words, a"
    // → last space at idx 18 → "words, more words," → comma trimmed
    const out = excerpt('words, more words, and a final tail', 20);
    expect(out).not.toMatch(/[,;:]…$/);
    expect(out.endsWith(ELLIPSIS)).toBe(true);
  });
});

describe('excerpt() — unicode safety', () => {
  test('8. emoji clip does not break surrogate pairs', () => {
    const text =
      'thoughts about 🚀 launches and the 🌌 cosmos and everything in between';
    const out = excerpt(text, 20);
    expect(out).not.toContain('�');             // no replacement char
    expect(out.endsWith(ELLIPSIS)).toBe(true);
    // budget honored in code points, not UTF-16 units
    expect(Array.from(out).length).toBeLessThanOrEqual(21);
  });

  test('CJK without spaces hard-clips at code-point budget', () => {
    const text = '深い仕事は集中を要求する継続的な実践であり結果を出すための鍵となる';
    const out = excerpt(text, 10);
    expect(Array.from(out).length).toBeLessThanOrEqual(11);
    expect(out.endsWith(ELLIPSIS)).toBe(true);
  });
});

describe('excerpt() — whitespace normalization', () => {
  test('9. collapses runs of whitespace (newlines, tabs, spaces)', () => {
    expect(excerpt('one\n\n\ntwo\t\tthree    four', 200))
      .toBe('one two three four');
  });

  test('budget is spent on visible characters, not invisible ones', () => {
    // 100 visible chars + huge whitespace run — should not waste budget
    const text = 'a'.repeat(50) + '\n\n\n\n\n' + 'b'.repeat(50);
    const out = excerpt(text, 200);
    expect(out).toBe('a'.repeat(50) + ' ' + 'b'.repeat(50));
  });
});
