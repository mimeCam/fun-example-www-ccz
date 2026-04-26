/**
 * `stripCommentsAndStrings` — pin the layout-honest substrate.
 *
 * Two invariants ride along every fixture (asserted via shared helpers):
 *   (a) length is preserved   (one byte in, one byte out)
 *   (b) newlines are preserved at their original offsets
 * Together they guarantee `lineOf(scrubbed, idx) === lineOf(source, idx)`,
 * which is what lets the audit script's match indices keep reporting
 * original-source line numbers (Mike #2 §6.1).
 *
 * Edge cases covered (Mike #2 §6.2–§6.5):
 *   1.  bare code passes through unchanged
 *   2.  `// …` to EOL is blanked; the `\n` survives
 *   3.  `/* …  *​/` block is blanked end-to-end
 *   4.  unterminated block at EOF blanks to the end without crashing
 *   5.  `'…'` body blanked; outer quote replaced with a space
 *   6.  `"…"` body blanked
 *   7.  template `` `…` `` body blanked
 *   8.  `//` inside a string is NOT a comment (string state shadows)
 *   9.  escaped quote inside a string is honoured (`"a\"b"`, `'\''`)
 *   10. multi-line block comment preserves every interior `\n`
 *   11. JSDoc `/** … *​/` behaves identically to a plain block
 *   12. consecutive comments and strings round-trip without state leak
 *   +   length + newline-count invariant on every fixture (assertSameShape)
 */

import { stripCommentsAndStrings } from '../strip-comments';

/** Shared invariant: same length, same newline grid. */
function assertSameShape(src: string, scrubbed: string): void {
  expect(scrubbed).toHaveLength(src.length);
  expect(scrubbed.split('\n')).toHaveLength(src.split('\n').length);
}

/** Convenience: scrub and run the shape invariant in one breath. */
function scrub(src: string): string {
  const out = stripCommentsAndStrings(src);
  assertSameShape(src, out);
  return out;
}

describe('stripCommentsAndStrings — layout invariants', () => {
  test('1. bare code passes through unchanged', () => {
    const src = 'const x = 1 + 2;\nreturn x;';
    expect(scrub(src)).toBe(src);
  });

  test('2. `//` line comment is blanked; trailing newline survives', () => {
    const src = 'const x = 1; // a tail comment\nconst y = 2;';
    const out = scrub(src);
    expect(out).toBe('const x = 1;                  \nconst y = 2;');
  });

  test('3. `/* … */` block comment is blanked end-to-end', () => {
    const src = 'a /* hidden */ b';
    expect(scrub(src)).toBe('a              b');
  });

  test('4. unterminated `/*` blanks to EOF without crashing', () => {
    const src = 'a /* never closed';
    const out = scrub(src);
    expect(out).toBe('a                ');
  });

  test('5. single-quoted string body is blanked; quotes go to spaces', () => {
    const src = "const tag = 'whisper';";
    expect(scrub(src)).toBe('const tag =          ;');
  });

  test('6. double-quoted string body is blanked', () => {
    const src = 'const cls = "mt-sys-10";';
    expect(scrub(src)).toBe('const cls =            ;');
  });

  test('7. template literal body is blanked, including interpolation', () => {
    const src = 'const t = `before ${x} after`;';
    const out = scrub(src);
    // Whole template body is masked — Mike #2 §6.5 documents the limitation.
    // 30 chars in: `const t = ` (10) + 19-char masked body + `;` (1) = 30.
    expect(out).toBe('const t = ' + ' '.repeat(19) + ';');
  });

  test('8. `//` inside a string is NOT a comment', () => {
    const src = 'const u = "https://example.com"; let z = 1;';
    const out = scrub(src);
    // The string is 21 chars wide (incl. quotes). After scrub: 21 spaces.
    expect(out).toBe('const u = ' + ' '.repeat(21) + '; let z = 1;');
    // The trailing `let z = 1;` survives — proving the string closed
    // on its own quote, not on the slashes inside it.
    expect(out).toMatch(/let z = 1;$/);
  });

  test('9a. escaped double quote inside `"…"` is honoured', () => {
    const src = 'const q = "a\\"b"; const r = 1;';
    const out = scrub(src);
    expect(out).toBe('const q =       ; const r = 1;');
  });

  test('9b. escaped single quote inside `\'…\'` is honoured', () => {
    const src = "const q = '\\''; const r = 1;";
    const out = scrub(src);
    expect(out).toBe('const q =     ; const r = 1;');
  });

  test('10. multi-line block comment preserves interior newlines', () => {
    const src = 'a\n/*\nhidden\nlines\n*/\nb';
    const out = scrub(src);
    expect(out.split('\n')).toHaveLength(6);
    expect(out).toMatch(/^a\n/);
    expect(out).toMatch(/\nb$/);
    // Every interior char is a space; only the newlines and the
    // outer `a`/`b` survive.
    const interior = out.slice(2, -2);
    expect(interior.replace(/\n/g, '')).toMatch(/^ +$/);
  });

  test('11. JSDoc `/** … */` behaves like a plain block', () => {
    const src = '/** doc */\nfn();';
    const out = scrub(src);
    expect(out).toBe('          \nfn();');
  });

  test('12. consecutive comments + strings round-trip without state leak', () => {
    const src = "// hi\n'a' /* b */ \"c\" `d`;";
    const out = scrub(src);
    // After the line comment closes on `\n`, every literal opens and
    // closes cleanly — no stale state should bleed through. The line-2
    // body is 20 chars (`'a' /* b */ "c" ` + `d` + `;`), all masked
    // except the closing `;`.
    expect(out).toBe(' '.repeat(5) + '\n' + ' '.repeat(19) + ';');
  });

  test('13. final `\\n` is preserved', () => {
    const src = '// trailing\n';
    const out = scrub(src);
    expect(out).toBe('           \n');
    expect(out.endsWith('\n')).toBe(true);
  });

  test('14. lone slash at EOF is not a comment opener', () => {
    const src = 'const r = a /';
    expect(scrub(src)).toBe(src);
  });

  test('15. mixed-content fixture preserves the `lineOf` contract', () => {
    const src = [
      'const x = 1; // c1',
      "const s = 'mt-sys-10';",
      'const y = 2; /* c2 */',
      'const z = 3;',
    ].join('\n');
    const out = scrub(src);
    // Code identifiers survive at their original lines.
    expect(out.split('\n')[0]).toMatch(/^const x = 1;/);
    expect(out.split('\n')[1]).toMatch(/^const s =/);
    expect(out.split('\n')[2]).toMatch(/^const y = 2;/);
    expect(out.split('\n')[3]).toMatch(/^const z = 3;$/);
    // Comment text and string body are gone from the masked source.
    expect(out).not.toMatch(/c1/);
    expect(out).not.toMatch(/c2/);
    expect(out).not.toMatch(/mt-sys-10/);
  });

  test('16. empty input → empty output', () => {
    expect(scrub('')).toBe('');
  });

  test('17. only-newlines input → unchanged', () => {
    const src = '\n\n\n';
    expect(scrub(src)).toBe(src);
  });
});
