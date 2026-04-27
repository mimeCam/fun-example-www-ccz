/**
 * dismiss-verb-fence — site-wide fence around the universal-exit kernel.
 *
 * Same shape as `lean-arrow-fence.test.ts` (Mike #90 §"Fence shape mirrors
 * lean-arrow-fence exactly"). The verb-primitive `<DismissButton>` is the
 * single home for every overlay's close affordance; the four call sites it
 * absorbs (`ResonanceDrawer`, `ThreadKeepsake`, `QuoteKeepsake`,
 * `ReturnLetter`) used to be four near-duplicate dialects of the same
 * gesture. The fence below makes a fifth dialect impossible.
 *
 *   Axis A · Caller fence   no `<Pressable variant="icon">` paired with
 *                           `<CloseIcon />` outside the kernel. Catches a
 *                           future overlay that hand-rolls the close
 *                           combination instead of importing `<DismissButton>`.
 *
 *   Axis B · Kernel fence   `DismissButton.tsx` renders `<CloseIcon />`,
 *                           hardcodes `aria-label="Close"`, and exports
 *                           both `.Inline` and `.Absolute` named placements.
 *
 *   Axis C · Universality   `<CloseIcon />` is imported in exactly ONE
 *                           `.tsx` file: `DismissButton.tsx`. The kernel
 *                           is the only glyph carrier; no other file may
 *                           import it.
 *
 *   Axis D · Glyph rejection no `&times;` HTML entity inside `<Pressable>`
 *                           children, anywhere. The historical dialect on
 *                           ReturnLetter retired with the kernel landing.
 *
 *   Axis E · Address Test   the verb-primitive's five utterances all spell
 *                           `dismiss-button` (file path, exported symbol,
 *                           fence file name, the two named-export
 *                           placements). LOCAL to this verb only — N=1; a
 *                           registry of one is not a registry. (Mike #87
 *                           §6, Tanya UIX #79 §3.2; same constraint the
 *                           lean-arrow fence honors.)
 *
 * Same five-axis shape as the lean-arrow fence — the third independent
 * verb-primitive doesn't yet exist, so the *pattern* doesn't graduate to
 * a shared helper (Mike rule of three: pattern reuse fires on the third).
 *
 * Credits: Mike K. (#90 napkin §"Modules involved" + §"Fence shape" — the
 * five-axis spec, the SCAN_DIRS scope, the source-string lint stance), Tanya
 * D. (UIX #33 §6 — the kill list this fence enforces; §3.3 — the decision
 * rule "no third placement, ever"), Krystle C. (the four-call-site audit
 * the fence is the receipt for), Sid (this fence — same shape, second time,
 * in the right neighborhood for the right family).
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

/** Same scope as the lean-arrow fence: app + components. */
const SCAN_DIRS: readonly string[] = ['app', 'components'];

/** Single source of truth for the kernel's location — five utterances rest on this. */
const KERNEL_PATH = 'components/shared/DismissButton.tsx';

/** Read every preloaded file once; downstream describes share the cache. */
const preloadAll = (): readonly { rel: string; src: string }[] =>
  preloadFiles(SCAN_DIRS);

// ─── Axis A · Caller fence — no hand-rolled close combinations ────────────

interface CallerViolation { file: string; line: number; snippet: string }

/**
 * Find every `<Pressable variant="icon" …>` opening tag whose body (until
 * `</Pressable>`) contains `<CloseIcon`. The kernel itself is exempt by
 * file-path filter. Pure source-string lint; no React, no DOM.
 */
function findCallerViolations(rel: string, src: string): CallerViolation[] {
  if (rel === KERNEL_PATH) return [];
  const opens = [...src.matchAll(/<Pressable\b[^>]*variant="icon"[^>]*>/g)];
  return opens.flatMap((m) => classifyCaller(rel, src, m));
}

function classifyCaller(
  rel: string, src: string, m: RegExpMatchArray,
): CallerViolation[] {
  const openIdx = m.index ?? 0;
  const close = src.indexOf('</Pressable>', openIdx + m[0].length);
  if (close < 0) return [];
  const body = src.slice(openIdx + m[0].length, close);
  if (!/<CloseIcon\b/.test(body)) return [];
  return [{ file: rel, line: lineAt(src, openIdx), snippet: m[0] }];
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
    `  ${v.file}:${v.line} — <Pressable variant="icon"> wraps <CloseIcon />\n\n` +
    `    snippet: ${v.snippet}\n` +
    `    The close affordance is the DismissButton kernel's job, not the\n` +
    `    caller's. Replace with <DismissButton.Inline onClose={…} /> for a\n` +
    `    header trailing slot, or <DismissButton.Absolute onClose={…} /> for\n` +
    `    a corner-chrome placement. Import from\n` +
    `    @/components/shared/DismissButton.`
  );
}

describe('dismiss-verb-fence — Axis A · no hand-rolled close combinations', () => {
  it('no <Pressable variant="icon"> paired with <CloseIcon /> outside the kernel', () => {
    const violations = scanAllCallers();
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) {
      throw new Error('\n' + violations.map(formatCallerFailure).join('\n\n'));
    }
  });
});

// ─── Axis B · Kernel fence — the kernel honors its frozen contract ────────

describe('dismiss-verb-fence — Axis B · kernel anchors the verb', () => {
  const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');

  it('the kernel renders <CloseIcon /> (the only glyph site)', () => {
    expect(preprocess(src)).toMatch(/<CloseIcon\b/);
  });

  it('the kernel hardcodes aria-label="Close" (no override allowed)', () => {
    expect(preprocess(src)).toMatch(/aria-label=\{?\s*['"]?Close['"]?/);
  });

  it('the kernel exports both .Inline and .Absolute placements', () => {
    const stripped = preprocess(src);
    expect(stripped).toMatch(/Inline\s*:/);
    expect(stripped).toMatch(/Absolute\s*:/);
  });

  it('the kernel exposes a single `DismissButton` const namespace', () => {
    expect(preprocess(src)).toMatch(/export\s+const\s+DismissButton\s*=/);
  });
});

// ─── Axis C · Universality — `<CloseIcon />` lives in one .tsx ────────────

describe('dismiss-verb-fence — Axis C · <CloseIcon /> is imported in exactly one .tsx', () => {
  function importers(): string[] {
    const rx = /import[^;]*\bCloseIcon\b[^;]*from\s+['"]@\/components\/shared\/Icons['"]/;
    return preloadAll()
      .filter(({ rel }) => rel.endsWith('.tsx'))
      .filter(({ src }) => rx.test(src))
      .map(({ rel }) => rel);
  }

  it('exactly one .tsx file imports CloseIcon from @/components/shared/Icons', () => {
    expect(importers()).toEqual([KERNEL_PATH]);
  });

  it('the kernel is exactly that file (no parallel kernel may emerge)', () => {
    const carriers = importers();
    expect(carriers).toContain(KERNEL_PATH);
    expect(carriers.length).toBe(1);
  });
});

// ─── Axis D · Glyph rejection — no `&times;` inside <Pressable> children ──

interface GlyphViolation { file: string; line: number; snippet: string }

/**
 * Walk every `<Pressable …>` opening tag; if `&times;` appears anywhere
 * before the matching `</Pressable>`, flag it. The kernel itself does not
 * speak `&times;` — the entity is rejected everywhere, but we only chase
 * the canonical regression site (the `<Pressable>` shell that used to hold
 * the historical dialect on ReturnLetter).
 */
function findGlyphViolations(rel: string, src: string): GlyphViolation[] {
  const opens = [...src.matchAll(/<Pressable\b[^>]*>/g)];
  return opens.flatMap((m) => classifyGlyph(rel, src, m));
}

function classifyGlyph(
  rel: string, src: string, m: RegExpMatchArray,
): GlyphViolation[] {
  const openIdx = m.index ?? 0;
  const close = src.indexOf('</Pressable>', openIdx + m[0].length);
  if (close < 0) return [];
  const body = src.slice(openIdx + m[0].length, close);
  if (!body.includes('&times;')) return [];
  return [{ file: rel, line: lineAt(src, openIdx), snippet: m[0] }];
}

let cachedGlyphViolations: GlyphViolation[] | null = null;

function scanAllGlyphs(): GlyphViolation[] {
  if (cachedGlyphViolations !== null) return cachedGlyphViolations;
  cachedGlyphViolations = preloadAll()
    .filter(({ rel }) => rel.endsWith('.tsx'))
    .flatMap(({ rel, src }) => findGlyphViolations(rel, src));
  return cachedGlyphViolations;
}

function formatGlyphFailure(v: GlyphViolation): string {
  return (
    `  ${v.file}:${v.line} — <Pressable> wraps a raw '&times;' HTML entity\n\n` +
    `    snippet: ${v.snippet}\n` +
    `    The HTML entity '&times;' carries the parent font-stack and drifts\n` +
    `    on warming surfaces. Replace the wrapping <Pressable> with the\n` +
    `    DismissButton kernel; the SVG <CloseIcon /> is geometrically\n` +
    `    constant and the typography-ledger:exempt comment retires with it.`
  );
}

describe('dismiss-verb-fence — Axis D · no `&times;` inside <Pressable> children', () => {
  it('no <Pressable> wraps a raw &times; HTML entity anywhere', () => {
    const violations = scanAllGlyphs();
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) {
      throw new Error('\n' + violations.map(formatGlyphFailure).join('\n\n'));
    }
  });
});

// ─── Axis E · Address Test — five utterances spell `dismiss-button` ───────
//
// LOCAL to this verb only — N=1, not a sweep. Same constraint the lean-arrow
// fence honors. When verb-primitive #3 graduates, the five-utterance pattern
// factors into a shared helper (Mike rule of three). Until then, the address
// stays honest by repetition.

describe('dismiss-verb-fence — Axis E · five utterances spell `dismiss-button`', () => {
  it('utterance #1 — kernel file path is `components/shared/DismissButton.tsx`', () => {
    expect(KERNEL_PATH).toBe('components/shared/DismissButton.tsx');
    expect(preloadAll().some(({ rel }) => rel === KERNEL_PATH)).toBe(true);
  });

  it('utterance #2 — kernel exports a `DismissButton` const namespace', () => {
    const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
    expect(src).toMatch(/export\s+const\s+DismissButton\s*=/);
  });

  it('utterance #3 — kernel exports `.Inline` placement on the namespace', () => {
    const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
    expect(preprocess(src)).toMatch(/Inline\s*:/);
  });

  it('utterance #4 — kernel exports `.Absolute` placement on the namespace', () => {
    const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
    expect(preprocess(src)).toMatch(/Absolute\s*:/);
  });

  it('utterance #5 — this fence file is named `dismiss-verb-fence.test.ts`', () => {
    expect(__filename.endsWith('dismiss-verb-fence.test.ts')).toBe(true);
  });
});

// ─── Sanity guards — the fence is not a no-op ──────────────────────────────

describe('dismiss-verb-fence — sanity · the kernel is reachable from the call sites', () => {
  it('at least four overlay surfaces reach the dismiss kernel (direct or via <OverlayHeader>)', () => {
    // After Mike #77 lift: three of the original four direct callers
    // (`ResonanceDrawer` / `QuoteKeepsake` / `ThreadKeepsake`) now reach
    // the dismiss kernel transitively through `<OverlayHeader>`. Reachability
    // is preserved: `OverlayHeader` itself imports DismissButton, and three
    // surfaces import OverlayHeader. We count both rungs so the sanity
    // floor still holds (Mike #77 §"Modules involved", §"How we know we won").
    const dismissRx = /import[^;]*\bDismissButton\b[^;]*from\s+['"]@\/components\/shared\/DismissButton['"]/;
    const overlayHeaderRx = /import[^;]*\bOverlayHeader\b[^;]*from\s+['"]@\/components\/shared\/OverlayHeader['"]/;
    const callers = preloadAll()
      .filter(({ rel }) => rel.endsWith('.tsx') && rel !== KERNEL_PATH)
      .filter(({ src }) => dismissRx.test(src) || overlayHeaderRx.test(src))
      .map(({ rel }) => rel);
    expect(callers.length).toBeGreaterThanOrEqual(4);
  });
});
