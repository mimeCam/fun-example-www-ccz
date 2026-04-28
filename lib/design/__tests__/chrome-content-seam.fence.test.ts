/**
 * Chrome→Content Seam — single-rung, four-call-site fence.
 *
 * Pins the T1 / T3 chassis-seam contract introduced by Mike #4 napkin
 * §4 (Tanya UIX #4 §4): one numeric rung (`CHASSIS_SEAM_RUNG = 9`)
 * applied at the chrome→content boundary of every reader-facing route,
 * and at the universal `WhisperFooter`'s top edge for the symmetric
 * content→chrome boundary. *One symbol, one rung, four call sites.*
 *
 * Why a fence, not a code-review checklist (Mike #4 §POI 5):
 *
 *   • Stops drift back to per-route seam values (`py-sys-11`,
 *     `py-sys-10`, layered TopBar / ArticleHeader / divider) — the
 *     wobble we just removed. A loosening seam reads as "extra blank
 *     space appeared," which is exactly the felt-jank the chassis-seam
 *     sprint corrected (Mike #4 §POI 1).
 *   • Stops a 13th rung or a `breathline`-named token from being
 *     introduced through any of the four sites. Naming is numeric on
 *     purpose; the seam's *intent* is grep-able through
 *     `CHASSIS_SEAM_TOP_CLASS`, the rung is integer (Elon, Tanya UIX
 *     #4 §3.3, spacing.ts:17–23).
 *   • Stops the `WhisperFooter`'s top edge from re-acquiring its old
 *     `py-sys-10` (which would double-pad against the route-body seam
 *     when both fire — *"not both" is the rule*, Mike #4 napkin §3).
 *   • Stops `app/article/[id]/page.tsx` from re-introducing TopBar's
 *     stripped `pt-sys-7` — the wrap-and-strip pattern (Mike #4 §POI 2).
 *
 * Allow-list shape:
 *
 *   • Inside `app/` and `components/`, exactly four files import
 *     `CHASSIS_SEAM_TOP_CLASS` — the four call sites. Anyone else
 *     reaching for the handle is a copy-paste; the answer is "open a
 *     separate brief; chassis seam is not your seam."
 *   • The export site `lib/design/spacing.ts` is the canonical home;
 *     its mention is positively pinned (the fence guards nothing if
 *     the export disappears).
 *
 * Pure source-string lint. Uses the canonical kernel (`runLinePatterns`
 * for the import-occurrence count + the banned-shapes scan) so
 * comment-stripping is shared and the cache is honored.
 *
 * Credits: Mike K. (#4 napkin — fence shape, scan dirs, allow-list
 * doctrine; the rung-9 pick that this fence pins; the wrap-and-strip
 * pattern), Tanya D. (UIX #4 — the cap-height anchor framing, the
 * T1 = T3 mirror rule, the layer-cleanup recommendations), Elon M.
 * (no `breathline` in tokens — verdict survives in this fence by
 * banning any `--sys-space-chrome-content-bridge`-style declaration),
 * Krystle C. (kernel — the original T1/T3 chassis-polish brief),
 * Sid (the source-string fence pattern lifted from
 * `accent-bias-allowlist.fence.test.ts` byte-for-byte).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  runLinePatterns,
  stripComments,
  type FenceDecl,
  type Violation,
} from './_fence';
import { CHASSIS_SEAM_RUNG, CHASSIS_SEAM_TOP_CLASS } from '../spacing';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Scan footprint + allow-list ──────────────────────────────────────────

/** Directories scanned for the chassis-seam handle. */
const SCAN_DIRS: readonly string[] = ['app', 'components'];

/** The four legal call sites — exactly the seam-owning surfaces. */
const ALLOWED_CALL_SITES: readonly string[] = [
  'app/page.tsx',
  'app/article/[id]/page.tsx',
  'components/articles/ArticlesPageClient.tsx',
  'components/shared/WhisperFooter.tsx',
];
const ALLOW_SET: ReadonlySet<string> = new Set<string>(ALLOWED_CALL_SITES);

// ─── The fences ───────────────────────────────────────────────────────────

/**
 * Any file under `app/` or `components/` that imports
 * `CHASSIS_SEAM_TOP_CLASS` outside the four allow-listed sites is a
 * copy-paste. The fence carries `kind: 'copycat'` so a regression
 * surfaces with the right name.
 */
const COPYCAT_FENCE: FenceDecl = {
  scanDirs: SCAN_DIRS,
  patterns: [{
    regex: /CHASSIS_SEAM_TOP_CLASS/,
    allow: ALLOW_SET,
    kind: 'chassis-seam-copycat',
  }],
  exemptToken: 'chassis-seam-fence:exempt',
};

/**
 * No file mints a new `--sys-space-chrome-content-bridge` /
 * `breathline`-named CSS variable or TS export. The ledger's naming
 * rule (spacing.ts:17–23) is binding; this fence pins it at the
 * file-edit layer (the spacing-sync test pins it at the rung-set
 * layer — both rails matter).
 */
const NAMED_TOKEN_FENCE: FenceDecl = {
  scanDirs: ['app', 'components', 'lib'],
  patterns: [{
    regex: /--sys-space-(?:chrome|content|bridge|breathline|breath|stanza|passage)/i,
    allow: new Set<string>(),
    kind: 'named-seam-token',
  }, {
    regex: /\b(?:CHROME_CONTENT_BRIDGE|BREATHLINE|BREATH_RUNG|STANZA_RUNG|PASSAGE_RUNG)\b/,
    allow: new Set<string>(),
    kind: 'named-seam-export',
  }],
  exemptToken: 'chassis-seam-fence:exempt',
};

// ─── Failure prose — failure-message-is-documentation (Mike #38 §4) ───────

function formatCopycat(v: Violation): string {
  return (
    `  ${v.file}:${v.line} — imports CHASSIS_SEAM_TOP_CLASS\n` +
    `    → only the four allow-listed call sites may carry the chassis seam:\n` +
    `      ${ALLOWED_CALL_SITES.join(', ')}.\n` +
    `      A new seam-bearing surface is a different brief — not a copy-paste.`
  );
}

function formatNamedToken(v: Violation): string {
  return (
    `  ${v.file}:${v.line} [${v.kind}] — ${v.match}\n` +
    `    → naming is numeric on purpose (spacing.ts:17–23).\n` +
    `      Use \`CHASSIS_SEAM_TOP_CLASS\` (rung 9) instead.`
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('chassis seam — four call sites, one rung handle', () => {
  it('exactly the four allow-listed files import CHASSIS_SEAM_TOP_CLASS', () => {
    const offenders = runLinePatterns(COPYCAT_FENCE);
    if (offenders.length > 0) {
      throw new Error('\n' + offenders.map(formatCopycat).join('\n'));
    }
    expect(offenders.map((v) => v.file)).toEqual([]);
  });

  it('the allow-list contains exactly four entries', () => {
    expect([...ALLOW_SET].sort()).toEqual([...ALLOWED_CALL_SITES].sort());
  });

  it('every allow-listed file actually imports the handle (positive pin)', () => {
    for (const rel of ALLOWED_CALL_SITES) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      expect(src).toMatch(/CHASSIS_SEAM_TOP_CLASS/);
    }
  });
});

describe('chassis seam — the rung is 9, the handle resolves to pt-sys-9', () => {
  it('CHASSIS_SEAM_RUNG === 9 (the documented pick)', () => {
    expect(CHASSIS_SEAM_RUNG).toBe(9);
  });

  it('CHASSIS_SEAM_TOP_CLASS resolves to pt-sys-9', () => {
    expect(CHASSIS_SEAM_TOP_CLASS).toBe('pt-sys-9');
  });
});

describe('chassis seam — no named bridge token sneaks back in', () => {
  it('no source file mints --sys-space-chrome-content-bridge / breathline / passage / stanza', () => {
    const offenders = runLinePatterns(NAMED_TOKEN_FENCE);
    if (offenders.length > 0) {
      throw new Error('\n' + offenders.map(formatNamedToken).join('\n'));
    }
    expect(offenders.map((v) => v.file)).toEqual([]);
  });
});

// ─── Wrap-and-strip pin — TopBar must not re-grow its own pt-sys-7 ───────

/**
 * Article-detail's `TopBar` was the trap (Mike #4 §POI 2 — *"the
 * article page is the trap"*). Its old `pt-sys-7` competed with the
 * new chassis-seam container's `pt-sys-9`. Wrap-and-strip stripped
 * the `pt-sys-7`; this pin makes a regression surface immediately.
 */
describe('chassis seam — article-detail TopBar wrap-and-strip', () => {
  const ARTICLE_PAGE = 'app/article/[id]/page.tsx';

  it('TopBar in article-detail does not carry pt-sys-7 (the seam container owns T1)', () => {
    const src = readFileSync(join(ROOT, ARTICLE_PAGE), 'utf8');
    const topBarBlock = extractTopBarBlock(src);
    expect(topBarBlock).not.toMatch(/pt-sys-7/);
  });

  it('TopBar in article-detail keeps pb-sys-3 (intra-cluster utility rhythm)', () => {
    const src = readFileSync(join(ROOT, ARTICLE_PAGE), 'utf8');
    const topBarBlock = extractTopBarBlock(src);
    expect(topBarBlock).toMatch(/pb-sys-3/);
  });
});

/**
 * Slice from `function TopBar` to the next top-level `function` declaration.
 * Comment-stripped so a JSDoc / inline note that references `pt-sys-7` (the
 * stripped-class history) does not false-positive the wrap-and-strip pin.
 */
function extractTopBarBlock(src: string): string {
  const stripped = stripComments(src);
  const start = stripped.indexOf('function TopBar');
  if (start < 0) return '';
  const tail = stripped.slice(start);
  const nextFn = tail.slice(1).search(/\nfunction\s/);
  return nextFn < 0 ? tail : tail.slice(0, nextFn + 1);
}
