/**
 * Baseline-Nudge Adoption Test — the fence around the typed glyph map.
 *
 * One literal, one canonical home: `verticalAlign: '0.08em'` (the inline
 * style that lifts an inline glyph's centroid onto the surrounding line's
 * x-height) lives ONLY in `lib/design/typography.ts`, exported as the
 * typed map `BASELINE_NUDGE_BY_GLYPH`. Two consumers — `<ExternalGlyph>`
 * inside `components/shared/TextLink.tsx` (key `externalGlyph`) and
 * `<FooterDot>` inside `components/shared/WhisperFooter.tsx` (key
 * `middleDot`) — reach for members by name.
 *
 * **The narrow fence** (Mike's napkin — *one literal, one home, one
 * fence*): a single regex family, one allow-list. A second spelling fails
 * CI and names the legal exit. N=2 is a typed table, not a taxonomy — the
 * fence does NOT pre-emptively allow new shapes; the third use-site has
 * to walk in for a third key to land.
 *
 * Walker / comment-stripper / exempt-token check live in `_fence.ts`
 * (rule-of-three already fired on the prior fences;
 * `filled-glyph-lift-adoption.test.ts` is the line-for-line precedent).
 *
 * Whitespace tolerance — the regex uses `\s*:\s*` so a Prettier pass
 * cannot smuggle drift in under a tab/space-around-colon difference.
 *
 * Credits: Mike K. (the napkin — promote-to-typed-map at N=2, *one
 * literal, one home, one fence* shape, JSDoc-says-physics rule, kill the
 * speculative `_NUDGE_MAP` umbrella), Tanya D. (UX spec #24 — the
 * centered-line exhale, the screenshot eye-test gate, the loud-silence
 * out-of-scope list), Krystle C. (the original constant, fence pattern,
 * sub-pixel caveat, screenshot-receipt discipline that this map promotion
 * inherits and extends), Elon M. (referenced — physics > ceremony;
 * mechanism > metaphor).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runLinePatterns, formatViolations, type FenceDecl } from './_fence';

const ROOT = join(__dirname, '..', '..', '..');

/** Inline token a caller writes when intentionally bypassing the fence. */
export const BASELINE_NUDGE_EXEMPT_TOKEN = 'baseline-nudge:exempt';

/** Files that legitimately spell the raw `verticalAlign: '0.08em'` literal.
 *  One home — the canonical typed map in the typography ledger. The two
 *  consumers (`TextLink.tsx`, `WhisperFooter.tsx`) reach for members by
 *  name. */
const NUDGE_ALLOW: ReadonlySet<string> = new Set(['lib/design/typography.ts']);

/** The `verticalAlign: '0.08em'` literal, whitespace-tolerant around the
 *  colon and quote-style-tolerant (single or double quotes) so a future
 *  formatter pass cannot smuggle drift in. */
const NUDGE_RX = /verticalAlign\s*:\s*['"]0\.08em['"]/;

/**
 * Carve out the JSDoc block that immediately precedes `name` in `src`.
 * Returns the substring between the last `/**` and the matching `*​/` that
 * sits directly above the export. Pure, ≤ 10 LOC.
 */
function extractDocBlockBefore(src: string, name: string): string {
  const idx = src.indexOf(`export const ${name}`);
  if (idx < 0) return '';
  const before = src.slice(0, idx);
  const open = before.lastIndexOf('/**');
  const close = before.lastIndexOf('*/');
  if (open < 0 || close < 0 || close < open) return '';
  return before.slice(open, close + 2);
}

const FENCE: FenceDecl = {
  scanDirs: ['components', 'lib', 'app'],
  patterns: [{ regex: NUDGE_RX, allow: NUDGE_ALLOW }],
  exemptToken: BASELINE_NUDGE_EXEMPT_TOKEN,
};

// ─── Tests — the grep-fence ──────────────────────────────────────────────

describe('baseline-nudge adoption — every verticalAlign:0.08em routes through the canonical map', () => {
  const violations = runLinePatterns(FENCE);

  /** Human-readable fix hint — names the home and the exit token. */
  const fixHint =
    `    → import BASELINE_NUDGE_BY_GLYPH from lib/design/typography\n` +
    `      and pass BASELINE_NUDGE_BY_GLYPH.<glyph> as the inline style prop\n` +
    `      (precedents: TextLink.tsx → externalGlyph; WhisperFooter.tsx → middleDot)\n` +
    `    → exempt: // ${BASELINE_NUDGE_EXEMPT_TOKEN} — <honest reason>`;

  it('no module outside the typography ledger spells the verticalAlign 0.08em literal', () => {
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + formatViolations(violations, fixHint));
  });
});

// ─── Positive tests — the typography ledger owns the canonical map ───────

describe('baseline-nudge adoption — typography ledger exports the canonical typed map', () => {
  const src = readFileSync(join(ROOT, 'lib/design/typography.ts'), 'utf8');

  it('exports BASELINE_NUDGE_BY_GLYPH as the canonical map name', () => {
    expect(src).toContain('BASELINE_NUDGE_BY_GLYPH');
  });

  it('binds to a frozen `as const` map with externalGlyph + middleDot members carrying verticalAlign 0.08em', () => {
    expect(src).toMatch(
      /BASELINE_NUDGE_BY_GLYPH\s*=\s*\{[\s\S]*?externalGlyph\s*:\s*\{\s*verticalAlign\s*:\s*['"]0\.08em['"]\s*,?\s*\}[\s\S]*?middleDot\s*:\s*\{\s*verticalAlign\s*:\s*['"]0\.08em['"]\s*,?\s*\}[\s\S]*?\}\s*as const satisfies/,
    );
  });

  it('JSDoc above the map names the optical reason in plain English', () => {
    // The JSDoc rule: the prose must mention 0.08em, the SVG glyph, and
    // the centroid drift — without these anchors a future contributor can
    // "simplify" the map back to zero. We scope the proximity check to
    // the doc-block immediately preceding the export.
    const block = extractDocBlockBefore(src, 'BASELINE_NUDGE_BY_GLYPH');
    expect(block).toMatch(/centroid/);
    expect(block).toMatch(/0\.08em/);
    expect(block).toMatch(/SVG/);
  });

  it('the legacy single-literal export is gone (no alias debt)', () => {
    expect(src).not.toMatch(/export\s+const\s+EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE/);
  });
});

// ─── Positive tests — the two consumers reach for the map by key ─────────

describe('baseline-nudge adoption — TextLink imports the externalGlyph member', () => {
  const src = readFileSync(join(ROOT, 'components/shared/TextLink.tsx'), 'utf8');

  it('TextLink imports BASELINE_NUDGE_BY_GLYPH from the typography ledger', () => {
    expect(src).toMatch(
      /import\s*\{[^}]*BASELINE_NUDGE_BY_GLYPH[^}]*\}\s*from\s*['"]@\/lib\/design\/typography['"]/,
    );
  });

  it('TextLink wires BASELINE_NUDGE_BY_GLYPH.externalGlyph onto the SVG style prop', () => {
    expect(src).toMatch(/style=\{BASELINE_NUDGE_BY_GLYPH\.externalGlyph\}/);
  });

  it('TextLink no longer carries the inline verticalAlign 0.08em literal', () => {
    expect(src).not.toMatch(NUDGE_RX);
  });
});

describe('baseline-nudge adoption — WhisperFooter imports the middleDot member', () => {
  const src = readFileSync(join(ROOT, 'components/shared/WhisperFooter.tsx'), 'utf8');

  it('WhisperFooter imports BASELINE_NUDGE_BY_GLYPH from the typography ledger', () => {
    expect(src).toMatch(
      /import\s*\{[^}]*BASELINE_NUDGE_BY_GLYPH[^}]*\}\s*from\s*['"]@\/lib\/design\/typography['"]/,
    );
  });

  it('WhisperFooter wires BASELINE_NUDGE_BY_GLYPH.middleDot onto the dot span style prop', () => {
    expect(src).toMatch(/style=\{BASELINE_NUDGE_BY_GLYPH\.middleDot\}/);
  });

  it('WhisperFooter no longer carries the inline verticalAlign 0.08em literal', () => {
    expect(src).not.toMatch(NUDGE_RX);
  });
});

// ─── Positive test — exempt token is a discoverable string constant ──────

describe('baseline-nudge adoption — exempt token is exported', () => {
  it('the inline-exempt token is a discoverable string constant', () => {
    expect(BASELINE_NUDGE_EXEMPT_TOKEN).toBe('baseline-nudge:exempt');
  });
});
