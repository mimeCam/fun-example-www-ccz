/**
 * stripCommentsAndStrings — mask comment and string-literal *bodies* in
 * a TypeScript / TSX source string while preserving every byte of layout
 * (length, line breaks). The output is the same shape as the input —
 * every `\n` survives in place — so a regex match on the scrubbed source
 * can still hand the original-source `lineOf(offset)` back unchanged.
 *
 * The audit script (`scripts/audit-spacing-collapse.ts`) is the first
 * caller; the helper lives here so the next scanner inherits an honest
 * substrate (Mike #2 §1, AGENTS.md "always increase shared code").
 *
 * What this masks:
 *   • `// …` to end-of-line
 *   • `/* …` to the matching `*` `/` (or to EOF if unterminated)
 *   • `'…'`, `"…"`, `` `…` `` literals (template `${expr}` is treated
 *     as part of the literal body — see Limitations below)
 *
 * Invariants (pinned in `__tests__/strip-comments.test.ts`):
 *   • `scrubbed.length === source.length`
 *   • `scrubbed.split('\n').length === source.split('\n').length`
 *   • Every newline byte is preserved at its original offset.
 *
 * Limitations (Mike #2 §6.5 — *let the next finding earn its tuning*):
 *   • Regex literals (`/foo/g`) are not recognised as a separate class.
 *     For the audit's two regexes (`surface !== 'X' return null` and
 *     `mt-sys-N`), regex bodies almost never carry these tokens; if a
 *     real false positive earns the tune, add a `regex` state and a
 *     post-`/`-context disambiguator. Until then, simplicity wins.
 *   • Template-literal interpolations (`${expr}`) are scrubbed along
 *     with the surrounding string body. This is acceptable because
 *     the audit's regexes do not fire on template-interpolated code
 *     in practice; if a future scanner needs honest interpolation
 *     scoping, layer a thin pass on top of this one.
 *
 * Pure · synchronous · no I/O · no allocations beyond the output array.
 *
 * Credits: Mike Koch (#2 §1, §3, §6.1–§6.6 — the napkin shape, the
 * char-scanner choice, the limitation list this docblock pins down),
 * Tanya Donska (#3 §5, §97 §1 — the invariant the audit defends and
 * the rule that this helper is *invisible product* — readers feel its
 * effect through held vertical rhythm, never through a UI surface).
 */

/** Lex states — `code` is the only state that emits source verbatim. */
type State = 'code' | 'line' | 'block' | 'sq' | 'dq' | 'tq';

/** One scanner step: what to emit, what state to transition to, how far to advance. */
interface Step {
  readonly emit: string;
  readonly next: State;
  readonly advance: number;
}

const SPACE = ' ';

/** Replace any non-newline byte with a single space; keep `\n` intact. */
const blank = (c: string): string => (c === '\n' ? '\n' : SPACE);

/** Two-char emit whose newlines (if any) survive — used at delimiters. */
const blankPair = (a: string, b: string): string => blank(a) + blank(b);

/** State `code` — emit verbatim; recognise opening delimiters. */
function stepCode(s: string, i: number): Step {
  const a = s[i], b = s[i + 1];
  if (a === '/' && b === '/') return { emit: '  ', next: 'line', advance: 2 };
  if (a === '/' && b === '*') return { emit: '  ', next: 'block', advance: 2 };
  if (a === "'") return { emit: SPACE, next: 'sq', advance: 1 };
  if (a === '"') return { emit: SPACE, next: 'dq', advance: 1 };
  if (a === '`') return { emit: SPACE, next: 'tq', advance: 1 };
  return { emit: a, next: 'code', advance: 1 };
}

/** State `line` — `// …` runs to the first `\n`; the newline stays. */
function stepLine(s: string, i: number): Step {
  const c = s[i];
  if (c === '\n') return { emit: '\n', next: 'code', advance: 1 };
  return { emit: SPACE, next: 'line', advance: 1 };
}

/** State `block` — `/* … *​/`; unterminated block (EOF) blanks to the end. */
function stepBlock(s: string, i: number): Step {
  const a = s[i], b = s[i + 1];
  if (a === '*' && b === '/') return { emit: '  ', next: 'code', advance: 2 };
  return { emit: blank(a), next: 'block', advance: 1 };
}

/** Shared string-state stepper — handles backslash escapes; closes on `q`. */
function stepString(s: string, i: number, q: string, here: State): Step {
  const a = s[i];
  if (a === '\\' && i + 1 < s.length) {
    return { emit: blankPair(a, s[i + 1]), next: here, advance: 2 };
  }
  if (a === q) return { emit: SPACE, next: 'code', advance: 1 };
  return { emit: blank(a), next: here, advance: 1 };
}

/** Dispatch one step to the per-state handler. Total · pure. */
function step(state: State, s: string, i: number): Step {
  if (state === 'code') return stepCode(s, i);
  if (state === 'line') return stepLine(s, i);
  if (state === 'block') return stepBlock(s, i);
  if (state === 'sq') return stepString(s, i, "'", 'sq');
  if (state === 'dq') return stepString(s, i, '"', 'dq');
  return stepString(s, i, '`', 'tq');
}

/**
 * Mask comment and string bodies in `src`. Length-preserving and
 * newline-preserving (see invariants above). Pure.
 */
export function stripCommentsAndStrings(src: string): string {
  const out: string[] = [];
  let state: State = 'code';
  let i = 0;
  while (i < src.length) {
    const s = step(state, src, i);
    out.push(s.emit);
    state = s.next;
    i += s.advance;
  }
  return out.join('');
}
