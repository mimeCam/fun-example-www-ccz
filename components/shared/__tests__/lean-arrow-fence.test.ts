/**
 * lean-arrow-fence — site-wide fence around the forward-motion arrow glyph.
 *
 * The fence exists because the kernel-promotion to `<LeanArrow />` (Mike
 * #80, Tanya UIX #62) makes the silent-regression class concrete:
 *
 *   • A future caller types `→` into a label literal instead of importing
 *     the kernel — the lean fires on three surfaces, the fourth flickers
 *     and the room loses its single voice (Tanya §2 — the felt-coherence
 *     stake; Krystle #61 — the orphan-class regression named at
 *     `ResonancesClient.tsx:205`).
 *   • A future caller hand-rolls a second `<span class="lean-arrow">`
 *     somewhere outside `LeanArrow.tsx` — the kernel is no longer the
 *     single import surface, the JSDoc no longer reaches every site, and
 *     the next contributor has two patterns to choose from (Mike #78 —
 *     one stateless kernel, N callers, no class hierarchy).
 *
 * Four axes, one fence — each is a string-content lint on raw source, not
 * a DOM test. They survive Tailwind JIT, server components, and tree-
 * shaking because they never touch React. Same shape as
 * `empty-adoption.test.ts` and `skeleton-adoption.test.ts` (Mike rule of
 * three for the *test pattern* — already at three).
 *
 *   Axis A — Caller fence on `<EmptySurface />` action labels (existing).
 *     `primary.label` / `secondary.label` literals end with no directional
 *     glyph. Glyph set: `→ ↗ ⟶ › »` (Tanya §5.3). The arrow is the
 *     system's job, not the copywriter's; localization stays glyph-blind
 *     (Elon §4 silent-failure mode #1).
 *
 *   Axis B — Primitive fence (retargeted to the kernel).
 *     `components/shared/LeanArrow.tsx` is the kernel anchor: it renders
 *     a single `<span class="lean-arrow" aria-hidden>` and nothing else
 *     does (Mike #78 — one kernel; #80 — the kernel lives in its own
 *     file, not inside `EmptySurface`).
 *
 *   Axis C — Universality fence.
 *     The literal `.lean-arrow` appears in exactly ONE `.tsx` file
 *     outside CSS / tests: `components/shared/LeanArrow.tsx`. Any hand-
 *     rolled clone of the span anywhere else fails the build.
 *
 *   Axis E — Address Test (LOCAL to this verb only; Mike #87 §6, Tanya
 *     UIX #79 §3.2). The five utterances of this verb-primitive — kernel
 *     file path, exported symbol, rendered className, top-level CSS
 *     class, and this fence file's name — must all spell `lean-arrow`.
 *     Five short string-content lints, scoped to the kernel only. NOT a
 *     sweep across `components/shared/`: the population of verb-primitives
 *     is N=1; a registry of one is not a registry. When verb #2 graduates,
 *     it earns its own per-verb fence; when verb #3 graduates, the
 *     pattern factors out (Mike rule of three).
 *
 *   Axis D — Forward-door fence (NEW).
 *     No raw trailing `→ ↗ ⟶ › »` inside JSX text children of
 *     `<TextLink>`, `<Pressable>`, or `<ActionPressable>` anywhere in
 *     `app/` or `components/`. Catches the orphan-class regression: a
 *     future caller typing the glyph instead of importing the kernel
 *     (Krystle #61, Tanya §2).
 *
 * Credits: Mike K. (#80 napkin §3 — kernel + fence + orphan adoption,
 * Axes C+D, source-string fence not DOM, scoped to app/ + components/),
 * Tanya D. (UIX §1 — every forward door leans the same; §3 surfaces in
 * scope; §5.3 directional-glyph rejection set; §6 — fence widening is
 * invisible UX infrastructure), Krystle C. (#61 — diagnosed the orphan
 * at `ResonancesClient.tsx:205`; named the regression class), Elon M.
 * (#22 — silent-failure-of-string-parsing → the kernel-author authority
 * is enforced, not advertised), Paul K. (#94 — felt-coherence stake;
 * fence as the receipt that the voice holds), Jason F. (#25/#49 — verb-
 * primitive framing — kept LOCAL on `LeanArrow.tsx` as per Elon §6 +
 * Mike §5; not promoted to project doctrine).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Glyph rejection set (Tanya §5.3) ──────────────────────────────────────

/** The directional glyphs we forbid as a label suffix. Order does not matter. */
const FORBIDDEN_TRAILING_GLYPHS: readonly string[] = ['→', '↗', '⟶', '›', '»'];

// ─── File walker (pure, ≤10 LOC each — pattern-cloned from empty-adoption)

const SCAN_DIRS: readonly string[] = ['app', 'components', 'lib/sharing'];
const SCAN_EXTS: ReadonlySet<string> = new Set<string>(['.ts', '.tsx']);

function isScannableFile(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.'));
  if (!SCAN_EXTS.has(ext)) return false;
  if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) return false;
  if (path.endsWith('.d.ts')) return false;
  return !path.includes(`${sep}__tests__${sep}`);
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (isScannableFile(full)) acc.push(full);
  }
  return acc;
}

function collectFiles(): string[] {
  return SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
}

function relativePath(full: string): string {
  return relative(ROOT, full).split(sep).join('/');
}

// ─── Comment / template stripping (so prose docs cannot trigger) ──────────

function stripComments(src: string): string {
  const blocks = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  return blocks.replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
}

function preprocess(src: string): string {
  return stripComments(src);
}

function lineAt(src: string, index: number): number {
  return src.slice(0, index).split(/\r?\n/).length;
}

// ─── Balanced-brace reader (the `primary={{ … }}` body, recursively) ──────

function readBalancedBraces(src: string, start: number): string | null {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start + 1, i); }
  }
  return null;
}

// ─── EmptySurface attribute extraction ─────────────────────────────────────

interface EmptySurfaceCall { index: number; attrs: string }

function findEmptySurfaceCalls(src: string): EmptySurfaceCall[] {
  const out: EmptySurfaceCall[] = [];
  for (const m of src.matchAll(/<EmptySurface\b/g)) {
    const start = (m.index ?? 0) + m[0].length;
    const end = findElementClose(src, start);
    if (end < 0) continue;
    out.push({ index: m.index ?? 0, attrs: src.slice(start, end) });
  }
  return out;
}

/** Find the `>` that closes the opening tag, skipping over `{ ... }` blocks. */
function findElementClose(src: string, start: number): number {
  let i = start;
  while (i < src.length) {
    const c = src[i];
    if (c === '{') { const inner = readBalancedBraces(src, i); if (inner === null) return -1; i += inner.length + 2; continue; }
    if (c === '>') return i;
    i++;
  }
  return -1;
}

/** Read the `{ … }` body for an attribute name, or `null` if absent. */
function extractObjectAttr(attrs: string, name: string): string | null {
  const rx = new RegExp(`\\b${name}\\s*=\\s*\\{`);
  const m = rx.exec(attrs);
  if (!m) return null;
  // The attribute opens with `{`; for object literals, the inner reader
  // descends one extra level to land inside `{{ … }}`.
  return readBalancedBraces(attrs, m.index + m[0].length - 1);
}

// ─── Label-literal extraction inside an action body ───────────────────────

interface LabelHit { value: string; offset: number }

/** Pull every `label: 'literal'` (or `"literal"`) pair from an action body. */
function extractLabelLiterals(body: string): LabelHit[] {
  const out: LabelHit[] = [];
  const rx = /\blabel\s*:\s*(['"])([^'"]*)\1/g;
  for (const m of body.matchAll(rx)) {
    out.push({ value: m[2], offset: m.index ?? 0 });
  }
  return out;
}

// ─── Violation shape (Axis A) ──────────────────────────────────────────────

interface LabelViolation {
  file: string;
  line: number;
  prop: 'primary' | 'secondary';
  label: string;
  glyph: string;
}

function endsWithForbiddenGlyph(label: string): string | null {
  const trimmed = label.trimEnd();
  for (const g of FORBIDDEN_TRAILING_GLYPHS) {
    if (trimmed.endsWith(g)) return g;
  }
  return null;
}

const ACTION_PROPS: ReadonlyArray<'primary' | 'secondary'> = ['primary', 'secondary'];

function scanCall(rel: string, src: string, call: EmptySurfaceCall): LabelViolation[] {
  return ACTION_PROPS.flatMap((prop) => {
    const body = extractObjectAttr(call.attrs, prop);
    if (body === null) return [];
    return extractLabelLiterals(body).flatMap((hit) =>
      classifyLabel(rel, src, call.index, prop, hit),
    );
  });
}

function classifyLabel(
  rel: string, src: string, callIndex: number,
  prop: 'primary' | 'secondary', hit: LabelHit,
): LabelViolation[] {
  const glyph = endsWithForbiddenGlyph(hit.value);
  if (glyph === null) return [];
  return [{ file: rel, line: lineAt(src, callIndex), prop, label: hit.value, glyph }];
}

// ─── Single-pass collector (memoized — multiple describes read it) ────────

interface FilePreload { rel: string; src: string }

let cachedFiles: FilePreload[] | null = null;

function preloadAll(): FilePreload[] {
  if (cachedFiles !== null) return cachedFiles;
  cachedFiles = collectFiles().map((p) => ({
    rel: relativePath(p),
    src: preprocess(readFileSync(p, 'utf8')),
  }));
  return cachedFiles;
}

let cachedLabelViolations: LabelViolation[] | null = null;

function scanAllLabels(): LabelViolation[] {
  if (cachedLabelViolations !== null) return cachedLabelViolations;
  cachedLabelViolations = preloadAll().flatMap(({ rel, src }) =>
    findEmptySurfaceCalls(src).flatMap((c) => scanCall(rel, src, c)),
  );
  return cachedLabelViolations;
}

// ─── Failure formatter (three-block, parity with empty-adoption) ──────────

function formatLabelFailure(v: LabelViolation): string {
  return (
    `  ${v.file}:${v.line} — <EmptySurface /> ${v.prop}.label ` +
    `ends with '${v.glyph}'\n\n` +
    `    label literal: '${v.label}'\n` +
    `    The arrow is the LeanArrow kernel's job, not the caller's.\n` +
    `    Strip the trailing glyph; the EmptySurface primitive renders\n` +
    `    <LeanArrow /> automatically when primary.kind === 'link'.`
  );
}

// ─── Tests — Axis A · caller fence (verbatim from empty-arrow-fence) ──────

describe('lean-arrow-fence — Axis A · <EmptySurface /> labels carry no trailing glyph', () => {
  it('no <EmptySurface /> primary/secondary label ends with a directional glyph', () => {
    const violations = scanAllLabels();
    expect(violations.map((v) => `${v.file}:${v.line} ${v.prop}=${v.label}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + violations.map(formatLabelFailure).join('\n\n'));
  });

  it('the rejection set names the five canonical directional glyphs', () => {
    expect([...FORBIDDEN_TRAILING_GLYPHS].sort()).toEqual(['↗', '→', '⟶', '›', '»'].sort());
  });

  it('at least one <EmptySurface /> call exists in the scanned tree (not a no-op test)', () => {
    const calls = preloadAll().flatMap(({ src }) => findEmptySurfaceCalls(src));
    expect(calls.length).toBeGreaterThanOrEqual(4);
  });
});

// ─── Tests — Axis B · kernel owns the arrow span ──────────────────────────

const KERNEL_PATH = 'components/shared/LeanArrow.tsx';

describe('lean-arrow-fence — Axis B · <LeanArrow /> kernel owns the span', () => {
  const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');

  it('the kernel renders a `.lean-arrow` span (the kernel anchor)', () => {
    expect(src).toMatch(/className=['"]lean-arrow['"]/);
  });

  it('the arrow span is marked `aria-hidden` (decorative, not announced)', () => {
    const span = src.match(/<span[^>]*lean-arrow[^>]*>/);
    expect(span).not.toBeNull();
    expect(span![0]).toMatch(/aria-hidden/);
  });

  it('the kernel exports a parameterless `LeanArrow` function (zero props, ever)', () => {
    expect(src).toMatch(/export\s+function\s+LeanArrow\s*\(\s*\)/);
  });

  it('the kernel embeds a leading-space-inside-the-span string literal (Tanya §5.1)', () => {
    // The literal shape `{' →'}` is load-bearing — the U+0020 lives
    // INSIDE the span so the 2px translate moves text + glyph as one
    // rigid unit. Without it, the pair drifts apart at large display
    // sizes. Pattern: `{` whitespace? quote whitespace+ glyph quote ws? `}`
    expect(preprocess(src)).toMatch(/\{\s*['"]\s+→['"]\s*\}/);
  });
});

// ─── Tests — Axis C · universality (the kernel is the only span site) ────

describe('lean-arrow-fence — Axis C · `.lean-arrow` lives in exactly one .tsx', () => {
  function spanCarriers(): string[] {
    const rx = /<span[^>]*lean-arrow[^>]*>/;
    return preloadAll()
      .filter(({ rel }) => rel.endsWith('.tsx'))
      .filter(({ src }) => rx.test(src))
      .map(({ rel }) => rel);
  }

  it('exactly one .tsx file in the scanned tree inlines a `.lean-arrow` span', () => {
    expect(spanCarriers()).toEqual([KERNEL_PATH]);
  });

  it('the kernel is exactly that file (no parallel kernel may emerge)', () => {
    const carriers = spanCarriers();
    expect(carriers).toContain(KERNEL_PATH);
    expect(carriers.length).toBe(1);
  });
});

// ─── Tests — Axis D · forward-door JSX text children carry no raw glyph ──

interface ForwardDoorViolation {
  file: string;
  line: number;
  host: string;
  trailing: string;
  glyph: string;
}

const FORWARD_DOOR_HOSTS: readonly string[] = ['TextLink', 'Pressable', 'ActionPressable'];

/**
 * Find raw trailing-glyph regressions in a forward-door element. The
 * pattern we forbid: literal text ending in a rejection glyph that sits
 * immediately before the closing tag (modulo whitespace). The kernel
 * adoption shape — `<TextLink>Verb<LeanArrow /></TextLink>` — is
 * indistinguishable from text-then-component, so we match on the raw
 * glyph rather than on textual position. Pure, ≤ 10 LOC.
 */
function scanForwardDoorRegressions(rel: string, src: string): ForwardDoorViolation[] {
  return FORWARD_DOOR_HOSTS.flatMap((host) => scanHost(rel, src, host));
}

function scanHost(rel: string, src: string, host: string): ForwardDoorViolation[] {
  const open = new RegExp(`<${host}\\b`, 'g');
  return [...src.matchAll(open)].flatMap((m) => detectRegressionAt(rel, src, host, m.index ?? 0));
}

function detectRegressionAt(
  rel: string, src: string, host: string, openIndex: number,
): ForwardDoorViolation[] {
  const tagClose = findElementClose(src, openIndex + host.length + 1);
  if (tagClose < 0) return [];
  const close = src.indexOf(`</${host}>`, tagClose);
  if (close < 0) return [];
  const body = src.slice(tagClose + 1, close);
  return classifyBody(rel, src, host, openIndex, body);
}

function classifyBody(
  rel: string, src: string, host: string, openIndex: number, body: string,
): ForwardDoorViolation[] {
  const trailing = trailingTextChild(body);
  const glyph = endsWithForbiddenGlyph(trailing);
  if (glyph === null) return [];
  return [{
    file: rel, line: lineAt(src, openIndex),
    host, trailing: trailing.trim(), glyph,
  }];
}

/**
 * Return the text-child substring that immediately precedes the closing
 * tag — i.e., everything after the LAST `>` (which closes the most-recent
 * inner JSX element) or after the last `}` (which closes a JSX expression).
 * Falls back to the whole body when neither boundary appears (pure text
 * children). Pure, ≤ 10 LOC.
 */
function trailingTextChild(body: string): string {
  const lastClose = Math.max(body.lastIndexOf('>'), body.lastIndexOf('}'));
  return lastClose < 0 ? body : body.slice(lastClose + 1);
}

let cachedDoorViolations: ForwardDoorViolation[] | null = null;

function scanAllForwardDoors(): ForwardDoorViolation[] {
  if (cachedDoorViolations !== null) return cachedDoorViolations;
  cachedDoorViolations = preloadAll()
    .filter(({ rel }) => rel.endsWith('.tsx'))
    .flatMap(({ rel, src }) => scanForwardDoorRegressions(rel, src));
  return cachedDoorViolations;
}

function formatDoorFailure(v: ForwardDoorViolation): string {
  return (
    `  ${v.file}:${v.line} — <${v.host}> trails raw '${v.glyph}' ` +
    `in JSX text child\n\n` +
    `    trailing text: '${v.trailing}'\n` +
    `    The arrow is the LeanArrow kernel's job, not the copywriter's.\n` +
    `    Replace the trailing glyph with <LeanArrow /> imported from\n` +
    `    @/components/shared/LeanArrow. The leading space lives INSIDE\n` +
    `    the kernel's span — drop the trailing space too.`
  );
}

describe('lean-arrow-fence — Axis D · forward-door JSX children carry no raw glyph', () => {
  it('no <TextLink> / <Pressable> / <ActionPressable> trails a directional glyph', () => {
    const violations = scanAllForwardDoors();
    expect(violations.map((v) => `${v.file}:${v.line} <${v.host}> ${v.trailing}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + violations.map(formatDoorFailure).join('\n\n'));
  });

  it('at least one <TextLink> call exists in the scanned tree (not a no-op test)', () => {
    const rx = /<TextLink\b/g;
    const total = preloadAll()
      .filter(({ rel }) => rel.endsWith('.tsx'))
      .reduce((n, { src }) => n + (src.match(rx)?.length ?? 0), 0);
    expect(total).toBeGreaterThanOrEqual(2);
  });

  it('at least one <Pressable> call exists in the scanned tree (not a no-op test)', () => {
    const rx = /<Pressable\b/g;
    const total = preloadAll()
      .filter(({ rel }) => rel.endsWith('.tsx'))
      .reduce((n, { src }) => n + (src.match(rx)?.length ?? 0), 0);
    expect(total).toBeGreaterThanOrEqual(2);
  });
});

// ─── Tests — Axis E · the verb's five utterances spell `lean-arrow` ───────
//
// Local to THIS verb only — not a sweep across `components/shared/` (the
// other 16 files there are nouns; sweeping nouns by a verb-rule is a
// category error). When verb #2 graduates, it earns its own per-verb
// fence; when verb #3 graduates, the pattern factors into a shared helper.
// Until then, the address book stays honest by repetition. Five short
// assertions, all string-content lints. (Mike #87 §6, Tanya UIX #79 §3.2.)

describe('lean-arrow-fence — Axis E · five utterances spell one verb', () => {
  it('utterance #1 — kernel file path is `components/shared/LeanArrow.tsx`', () => {
    expect(KERNEL_PATH).toBe('components/shared/LeanArrow.tsx');
    expect(preloadAll().some(({ rel }) => rel === KERNEL_PATH)).toBe(true);
  });

  it('utterance #2 — kernel exports a parameterless `LeanArrow` symbol', () => {
    const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
    expect(src).toMatch(/export\s+function\s+LeanArrow\s*\(\s*\)/);
  });

  it('utterance #3 — kernel renders className="lean-arrow"', () => {
    const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
    expect(src).toMatch(/className=['"]lean-arrow['"]/);
  });

  it('utterance #4 — `app/globals.css` declares `.lean-arrow` at top level', () => {
    const css = readFileSync(join(ROOT, 'app/globals.css'), 'utf8');
    expect(css).toMatch(/^\.lean-arrow\s*\{/m);
  });

  it('utterance #5 — this fence file is named `lean-arrow-fence.test.ts`', () => {
    expect(__filename.endsWith('lean-arrow-fence.test.ts')).toBe(true);
  });
});

// ─── Tests — Axis F · JSDoc prose claims have falsifiable test peers ──────
//
// LOCAL to this verb only · N=1 · not a sweep. Three sub-assertions pin
// the load-bearing JSDoc claims that Axes A–E do NOT already cover. The
// contract is closed at three; if a coder is tempted to add F.4, stop.
// (Mike #29 napkin §"Three sub-assertions, not five"; Krystle, DoD #1.)
//
// Direct single-file reads (no walker pollution): the kernel and the CSS
// are one path each — re-walking the tree would be cache pollution. The
// scan cache is for tree-wide work (Axes A–D); F.* opens two files and
// closes them. Failure formatter shape parity with formatLabelFailure /
// formatDoorFailure: location, the offending bit, the prescription.

const CSS_PATH = 'app/globals.css';

interface JsdocViolation { claim: string; detail: string; prescription: string }

function formatJsdocFailure(v: JsdocViolation): string {
  return (
    `  ${KERNEL_PATH} — JSDoc claim '${v.claim}' has no falsifiable peer\n\n` +
    `    detail: ${v.detail}\n` +
    `    ${v.prescription}`
  );
}

/** F.1 — `no props ever`: no `LeanArrowProps` interface or type alias on the kernel. */
function findPropsTypeDecl(src: string): string | null {
  const stripped = preprocess(src);
  const m = stripped.match(/\b(?:interface|type)\s+LeanArrowProps\b/);
  return m === null ? null : m[0];
}

/** F.2 — `reduced-motion silenced`: a @media reduce block mentions `.lean-arrow`. */
function reducedMotionMentionsLeanArrow(css: string): boolean {
  const rx = /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{/g;
  for (const m of css.matchAll(rx)) {
    const inner = readBalancedBraces(css, (m.index ?? 0) + m[0].length - 1);
    if (inner !== null && inner.includes('.lean-arrow')) return true;
  }
  return false;
}

/** F.3 — `forced-colors via currentColor`: the .lean-arrow rule sets no explicit color. */
function leanArrowRuleExplicitColor(css: string): string | null {
  const rule = css.match(/^\.lean-arrow\s*\{([\s\S]*?)\}/m);
  if (rule === null) return null;
  const decl = rule[1].match(/(?<![a-zA-Z-])color\s*:\s*([^;}\n]+)/);
  if (decl === null) return null;
  const value = decl[1].trim();
  return /^currentColor\b/i.test(value) ? null : value;
}

describe('lean-arrow-fence — Axis F · JSDoc prose claims have falsifiable peers', () => {
  const kernelSrc = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
  const cssSrc = readFileSync(join(ROOT, CSS_PATH), 'utf8');

  it('F.1 · `no props ever` — no LeanArrowProps interface/type is declared in the kernel', () => {
    const decl = findPropsTypeDecl(kernelSrc);
    if (decl !== null) throw new Error('\n' + formatJsdocFailure({
      claim: 'no props ever',
      detail: `kernel declares '${decl}' — props were re-introduced`,
      prescription: 'Delete the declaration; the kernel is parameterless by construction (Mike #78).',
    }));
    expect(decl).toBeNull();
  });

  it('F.2 · `reduced-motion silenced` — globals.css @media reduce block mentions .lean-arrow', () => {
    const ok = reducedMotionMentionsLeanArrow(cssSrc);
    if (!ok) throw new Error('\n' + formatJsdocFailure({
      claim: 'reduced-motion silenced',
      detail: `no @media (prefers-reduced-motion: reduce) block in ${CSS_PATH} mentions .lean-arrow`,
      prescription: 'Restore the override (globals.css:1224–1226) so the 2px translate zeros under reduced-motion.',
    }));
    expect(ok).toBe(true);
  });

  it('F.3 · `forced-colors via currentColor` — the .lean-arrow rule sets no explicit non-currentColor color', () => {
    const explicit = leanArrowRuleExplicitColor(cssSrc);
    if (explicit !== null) throw new Error('\n' + formatJsdocFailure({
      claim: 'forced-colors via currentColor',
      detail: `.lean-arrow rule sets explicit color: ${explicit}`,
      prescription: 'Remove the color declaration; currentColor inheritance survives forced-colors via CanvasText.',
    }));
    expect(explicit).toBeNull();
  });
});
