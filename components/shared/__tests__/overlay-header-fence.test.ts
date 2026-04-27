/**
 * overlay-header-fence — site-wide fence around the overlay-nameplate kernel.
 *
 * Same shape as `dismiss-verb-fence.test.ts` (Mike #77 §"Modules involved"
 * — five axes, source-string lint, no DOM, no React). Three sibling
 * overlays — `ResonanceDrawer`, `QuoteKeepsake`, `ThreadKeepsake` — each
 * used to hand-roll the same `flex … justify-between p-sys-6 pb-sys-4`
 * skeleton with a `<DismissButton.Inline>` slotted at the right; two of
 * three drifted onto `items-start` instead of `items-center`. The kernel
 * absorbs the skeleton; this fence makes a fourth dialect impossible.
 *
 *   Axis A · Caller fence    no `<div>` carrying `justify-between p-sys-6
 *                            pb-sys-4` and a nearby `<DismissButton.Inline`
 *                            outside the kernel. Catches a future overlay
 *                            hand-rolling the header skeleton instead of
 *                            importing `<OverlayHeader>`.
 *
 *   Axis B · Kernel fence    `OverlayHeader.tsx` renders
 *                            `<DismissButton.Inline`, hardcodes
 *                            `items-center` (not `items-start`), uses the
 *                            type-token triple verbatim, and exports the
 *                            `OverlayHeader` symbol.
 *
 *   Axis C · Universality    the literal layout substring `flex
 *                            items-center justify-between p-sys-6 pb-sys-4`
 *                            appears in exactly ONE `.tsx`: the kernel.
 *
 *   Axis D · Beat rejection  no `items-start` paired with `justify-between
 *                            p-sys-6 pb-sys-4` anywhere. The wrong beat is
 *                            rejected at lint level, not just absent at
 *                            migration time (Tanya UIX #21 §3).
 *
 *   Axis E · Address Test    the kernel's five utterances all spell
 *                            `overlay-header` (file path · exported symbol
 *                            · props symbol · fence file name · JSDoc
 *                            anchor). LOCAL to this primitive only — N=2
 *                            with `dismiss-verb-fence`; rule of three has
 *                            not fired (Mike #87 §6 — "a registry of one
 *                            is not a registry"; N=2 still is not).
 *
 *   Axis F · Doorway is air  no `<div … border-t …>`, no `<hr>`, no
 *                            `<Divider…>` immediately follows
 *                            `<OverlayHeader>` outside the kernel. Promotes
 *                            the kernel's prose-doctrine (`OverlayHeader.tsx`
 *                            lines 110–114 — *"no border, no divider; the
 *                            body's pb-sys-4 is the seam"*) to a guarded
 *                            invariant. The seam is breath, not ink (Tanya
 *                            UIX #33 §5; Mike #4 §"Decision"). Catches the
 *                            `ResonanceDrawer` regression we just retired.
 *
 * Credits: Mike K. (#77 napkin §"Modules involved" + §"Fence shape" — the
 * five-axis spec, the SCAN_DIRS scope, the source-string lint stance, the
 * second application of the kernel-plus-fence pattern; #4 §"Decision" — the
 * Axis F shape: rule-of-one outlier + two doctrine-compliers, fence the
 * doctrine, do not crown the drift), Tanya D. (UIX #21 §6 — the kill list
 * this fence enforces; §8 — the contract-fence-not-pixel-fence call;
 * UIX #33 §§4–5 — the air-not-ink call, the three-lens reading that earned
 * Axis F), Krystle C. (#47 — the three-call-site audit the fence is the
 * receipt for; the negative-LOC discipline), Sid (this fence — same shape,
 * second time, in the right neighborhood for the right family; Axis F as
 * the receipt for the deletion).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  preloadFiles,
  lineAt,
  stripCommentsAndTemplates as preprocess,
} from './_jsx-fence-walker';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Scan footprint — the JSX surface this fence guards ────────────────────

/** Same scope as the dismiss-verb fence: app + components. */
const SCAN_DIRS: readonly string[] = ['app', 'components'];

/** Single source of truth for the kernel's location — five utterances rest on this. */
const KERNEL_PATH = 'components/shared/OverlayHeader.tsx';

/** The frozen layout literal — the row's skeleton, lives only in the kernel. */
const LAYOUT_LITERAL =
  'flex items-center justify-between p-sys-6 pb-sys-4';

/** The type-token triple on the title — the kernel's typography contract. */
const TITLE_TRIPLE =
  'text-sys-lg font-display font-sys-display text-foreground';

/** Read every preloaded file once; downstream describes share the cache. */
const preloadAll = (): readonly { rel: string; src: string }[] =>
  preloadFiles(SCAN_DIRS);

// ─── Axis A · Caller fence — no hand-rolled header skeletons ──────────────

interface CallerViolation { file: string; line: number; snippet: string }

/**
 * Find every `<div … className="… justify-between p-sys-6 pb-sys-4 …">`
 * whose body (within ~20 lines) contains `<DismissButton.Inline`. The
 * kernel itself is exempt by file-path filter. Pure source-string lint.
 */
function findCallerViolations(rel: string, src: string): CallerViolation[] {
  if (rel === KERNEL_PATH) return [];
  const opens = [...src.matchAll(/<div\b[^>]*className="[^"]*\bjustify-between\b[^"]*\bp-sys-6\b[^"]*\bpb-sys-4\b[^"]*"/g)];
  return opens.flatMap((m) => classifyCaller(rel, src, m));
}

function classifyCaller(
  rel: string, src: string, m: RegExpMatchArray,
): CallerViolation[] {
  const openIdx = m.index ?? 0;
  const tail = src.slice(openIdx, openIdx + 1200);
  if (!/<DismissButton\.Inline\b/.test(tail)) return [];
  return [{ file: rel, line: lineAt(src, openIdx), snippet: m[0].slice(0, 140) }];
}

let cachedCallerViolations: CallerViolation[] | null = null;

function scanAllCallers(): CallerViolation[] {
  if (cachedCallerViolations !== null) return cachedCallerViolations;
  cachedCallerViolations = preloadAll()
    .filter(({ rel }) => rel.endsWith('.tsx'))
    .flatMap(({ rel, src }) => findCallerViolations(rel, src));
  return cachedCallerViolations;
}

function formatCallerFailure(v: CallerViolation): string {
  return (
    `  ${v.file}:${v.line} — <div justify-between p-sys-6 pb-sys-4> wraps <DismissButton.Inline />\n\n` +
    `    snippet: ${v.snippet}\n` +
    `    The overlay-nameplate skeleton is the OverlayHeader kernel's job,\n` +
    `    not the caller's. Replace with <OverlayHeader title={…} blurb={…}\n` +
    `    onClose={…} />. Import from @/components/shared/OverlayHeader.`
  );
}

describe('overlay-header-fence — Axis A · no hand-rolled header skeletons', () => {
  it('no <div justify-between p-sys-6 pb-sys-4> wraps <DismissButton.Inline /> outside the kernel', () => {
    const violations = scanAllCallers();
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) {
      throw new Error('\n' + violations.map(formatCallerFailure).join('\n\n'));
    }
  });
});

// ─── Axis B · Kernel fence — the kernel honors its frozen contract ────────

describe('overlay-header-fence — Axis B · kernel anchors the row', () => {
  const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
  const stripped = preprocess(src);

  it('the kernel renders <DismissButton.Inline (the only slot)', () => {
    expect(stripped).toMatch(/<DismissButton\.Inline\b/);
  });

  it('the kernel hardcodes items-center (not items-start)', () => {
    expect(stripped).toMatch(/\bitems-center\b/);
    expect(stripped).not.toMatch(/\bitems-start\b/);
  });

  it('the kernel renders the frozen layout literal verbatim', () => {
    expect(stripped).toContain(LAYOUT_LITERAL);
  });

  it('the kernel renders the title type-token triple verbatim', () => {
    expect(stripped).toContain(TITLE_TRIPLE);
  });

  it('the kernel exports an `OverlayHeader` function symbol', () => {
    expect(stripped).toMatch(/export\s+function\s+OverlayHeader\b/);
  });
});

// ─── Axis C · Universality — the layout literal lives in one .tsx ─────────

describe('overlay-header-fence — Axis C · the layout literal lives in exactly one .tsx', () => {
  function carriers(): string[] {
    return preloadAll()
      .filter(({ rel }) => rel.endsWith('.tsx'))
      .filter(({ src }) => src.includes(LAYOUT_LITERAL))
      .map(({ rel }) => rel);
  }

  it('exactly one .tsx file carries the layout literal', () => {
    expect(carriers()).toEqual([KERNEL_PATH]);
  });

  it('the kernel is exactly that file (no parallel kernel may emerge)', () => {
    const all = carriers();
    expect(all).toContain(KERNEL_PATH);
    expect(all.length).toBe(1);
  });
});

// ─── Axis D · Beat rejection — no items-start with the layout literal ─────

interface BeatViolation { file: string; line: number; snippet: string }

/**
 * Reject the wrong beat at lint level. Any `<div … className="…
 * items-start … justify-between p-sys-6 pb-sys-4 …">` is the failed
 * dialect we just retired (Tanya UIX #21 §3). Catches a future PR that
 * tries to reopen the fork.
 */
function findBeatViolations(rel: string, src: string): BeatViolation[] {
  const opens = [...src.matchAll(/<div\b[^>]*className="[^"]*\bitems-start\b[^"]*\bjustify-between\b[^"]*\bp-sys-6\b[^"]*\bpb-sys-4\b[^"]*"/g)];
  return opens.map((m) => ({
    file: rel,
    line: lineAt(src, m.index ?? 0),
    snippet: m[0].slice(0, 160),
  }));
}

let cachedBeatViolations: BeatViolation[] | null = null;

function scanAllBeats(): BeatViolation[] {
  if (cachedBeatViolations !== null) return cachedBeatViolations;
  cachedBeatViolations = preloadAll()
    .filter(({ rel }) => rel.endsWith('.tsx'))
    .flatMap(({ rel, src }) => findBeatViolations(rel, src));
  return cachedBeatViolations;
}

function formatBeatFailure(v: BeatViolation): string {
  return (
    `  ${v.file}:${v.line} — items-start paired with justify-between p-sys-6 pb-sys-4\n\n` +
    `    snippet: ${v.snippet}\n` +
    `    items-start pulls the close glyph above the title's optical mid-line\n` +
    `    and reads as "the close floating up off the row" (Tanya UIX #21 §3).\n` +
    `    The kernel's beat is items-center; remove the override and use\n` +
    `    <OverlayHeader> instead.`
  );
}

describe('overlay-header-fence — Axis D · no items-start paired with the layout literal', () => {
  it('no <div items-start justify-between p-sys-6 pb-sys-4> appears anywhere', () => {
    const violations = scanAllBeats();
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) {
      throw new Error('\n' + violations.map(formatBeatFailure).join('\n\n'));
    }
  });
});

// ─── Axis E · Address Test — five utterances spell `overlay-header` ───────
//
// LOCAL to this primitive only — N=2 with `dismiss-verb-fence`. The rule of
// three has not fired (Mike #87 §6); when verb-primitive #3 graduates, the
// five-utterance pattern factors out into a shared helper. Until then, the
// address stays honest by repetition.

describe('overlay-header-fence — Axis E · five utterances spell `overlay-header`', () => {
  it('utterance #1 — kernel file path is `components/shared/OverlayHeader.tsx`', () => {
    expect(KERNEL_PATH).toBe('components/shared/OverlayHeader.tsx');
    expect(preloadAll().some(({ rel }) => rel === KERNEL_PATH)).toBe(true);
  });

  it('utterance #2 — kernel exports an `OverlayHeader` function', () => {
    const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
    expect(src).toMatch(/export\s+function\s+OverlayHeader\b/);
  });

  it('utterance #3 — kernel exports an `OverlayHeaderProps` interface', () => {
    const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
    expect(src).toMatch(/export\s+interface\s+OverlayHeaderProps\b/);
  });

  it('utterance #4 — this fence file is named `overlay-header-fence.test.ts`', () => {
    expect(__filename.endsWith('overlay-header-fence.test.ts')).toBe(true);
  });

  it('utterance #5 — JSDoc anchors the kernel as the room\'s nameplate', () => {
    const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
    expect(src).toMatch(/OverlayHeader\b[^\n]*nameplate/i);
  });
});

// ─── Axis F · Doorway is air — no hairline between OverlayHeader and body ─

interface DoorwayViolation {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

/**
 * Forbidden JSX tokens that may not appear immediately after the closing
 * `>` of an `<OverlayHeader>`. The kernel's JSDoc (lines 110–114) documents
 * the doctrine in prose; this list pins it as enforceable source-string
 * regex. Three forms cover every dialect a future drift might reach for:
 * `<div className="… border-t …">` (the retired `ResonanceDrawer` shape),
 * `<hr>` (the lazy HTML reach), `<Divider…>` (the wrong-tone primitive).
 */
const DOORWAY_FORBIDDEN: ReadonlyArray<{ rx: RegExp; reason: string }> = [
  { rx: /<div\b[^>]*\bborder-t\b/, reason: '<div className="… border-t …">' },
  { rx: /<hr\b/,                   reason: '<hr> element' },
  { rx: /<Divider\b/,              reason: '<Divider…> JSX element' },
];

/**
 * Walk forward from `<OverlayHeader`, balancing JSX `{ }` expression depth
 * and skipping over `"…"` / `'…'` attribute strings, until the first `>`
 * at depth 0. The `blurb` prop carries fragment JSX (`{<>…</>}`) whose
 * inner `>` would mis-close a naïve `indexOf('>')` — this scanner is the
 * fix. Returns the byte offset just past that `>`, or -1 (defensive).
 */
function endOfOpenTag(src: string, openIdx: number): number {
  let depth = 0; let quote: '"' | "'" | null = null;
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i];
    if (quote)            { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return i + 1;
  }
  return -1;
}

/**
 * Return the byte offset just after the OverlayHeader element. Self-
 * closing (`/>`) returns immediately; explicit-close hunts for the
 * matching `</OverlayHeader>`. Returns -1 when unclosed (defensive).
 */
function endOfOverlayHeader(src: string, openIdx: number): number {
  const openEnd = endOfOpenTag(src, openIdx);
  if (openEnd === -1) return -1;
  if (src[openEnd - 2] === '/') return openEnd;
  const m = /<\/OverlayHeader\s*>/g.exec(src.slice(openEnd));
  return m ? openEnd + m.index + m[0].length : -1;
}

/**
 * Slice the JSX text immediately following the OverlayHeader element. The
 * 400-char window is generous cover for whitespace + the next sibling's
 * open tag — call sites place that sibling within ~3 lines per doctrine.
 */
function tailAfterOverlayHeader(
  src: string, openIdx: number,
): { tail: string; tailIdx: number } | null {
  const close = endOfOverlayHeader(src, openIdx);
  if (close === -1) return null;
  return { tail: src.slice(close, close + 400), tailIdx: close };
}

/** Return the candidate JSX open-tag text right after `<OverlayHeader/>`. */
function nextSiblingHead(tail: string): { head: string; offset: number } | null {
  const at = tail.indexOf('<');
  if (at === -1) return null;
  return { head: tail.slice(at, at + 200), offset: at };
}

function buildDoorwayViolation(
  rel: string, src: string, tailIdx: number,
  offset: number, head: string, reason: string,
): DoorwayViolation {
  return {
    file: rel,
    line: lineAt(src, tailIdx + offset),
    snippet: head.split('\n')[0].slice(0, 140),
    reason,
  };
}

function classifyDoorway(
  rel: string, src: string, m: RegExpMatchArray,
): DoorwayViolation[] {
  const sliced = tailAfterOverlayHeader(src, m.index ?? 0);
  if (sliced === null) return [];
  const next = nextSiblingHead(sliced.tail);
  if (next === null) return [];
  const hit = DOORWAY_FORBIDDEN.find(({ rx }) => rx.test(next.head));
  if (!hit) return [];
  return [buildDoorwayViolation(
    rel, src, sliced.tailIdx, next.offset, next.head, hit.reason)];
}

function findDoorwayViolations(rel: string, src: string): DoorwayViolation[] {
  if (rel === KERNEL_PATH) return [];
  const opens = [...src.matchAll(/<OverlayHeader\b/g)];
  return opens.flatMap((m) => classifyDoorway(rel, src, m));
}

let cachedDoorwayViolations: DoorwayViolation[] | null = null;

function scanAllDoorways(): DoorwayViolation[] {
  if (cachedDoorwayViolations !== null) return cachedDoorwayViolations;
  cachedDoorwayViolations = preloadAll()
    .filter(({ rel }) => rel.endsWith('.tsx'))
    .flatMap(({ rel, src }) => findDoorwayViolations(rel, src));
  return cachedDoorwayViolations;
}

function formatDoorwayFailure(v: DoorwayViolation): string {
  return (
    `  ${v.file}:${v.line} — ${v.reason} immediately follows <OverlayHeader>\n\n` +
    `    snippet: ${v.snippet}\n` +
    `    The doorway is air, not ink. The kernel's pb-sys-4 + the body's\n` +
    `    first-breath padding is the seam — no hairline, no <hr>, no\n` +
    `    <Divider/>. (OverlayHeader.tsx lines 110–114; Tanya UIX #33 §5;\n` +
    `    Mike #4 §"Decision".) Remove the line and let the body's first\n` +
    `    breath carry the seam.`
  );
}

describe('overlay-header-fence — Axis F · doorway is air, not ink', () => {
  it('no <div border-t>, <hr>, or <Divider> follows <OverlayHeader> outside the kernel', () => {
    const violations = scanAllDoorways();
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) {
      throw new Error('\n' + violations.map(formatDoorwayFailure).join('\n\n'));
    }
  });
});

// ─── Sanity guards — the fence is not a no-op ──────────────────────────────

describe('overlay-header-fence — sanity · the kernel is reachable from the call sites', () => {
  it('at least three .tsx files import OverlayHeader from the kernel', () => {
    const rx = /import[^;]*\bOverlayHeader\b[^;]*from\s+['"]@\/components\/shared\/OverlayHeader['"]/;
    const callers = preloadAll()
      .filter(({ rel }) => rel.endsWith('.tsx') && rel !== KERNEL_PATH)
      .filter(({ src }) => rx.test(src))
      .map(({ rel }) => rel);
    expect(callers.length).toBeGreaterThanOrEqual(3);
  });

  it('the kernel itself does not carry a `className` prop on its public API', () => {
    const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
    // The OverlayHeaderProps interface body does not declare className,
    // align, tone, or as. The kernel's invariance is the trust anchor.
    const propsBlock = src.match(/export interface OverlayHeaderProps\s*\{([\s\S]*?)\}/);
    expect(propsBlock).not.toBeNull();
    const body = propsBlock?.[1] ?? '';
    expect(body).not.toMatch(/\bclassName\b\s*[?:]/);
    expect(body).not.toMatch(/\balign\b\s*[?:]/);
    expect(body).not.toMatch(/\btone\b\s*[?:]/);
    expect(body).not.toMatch(/\bas\b\s*[?:]/);
  });
});
