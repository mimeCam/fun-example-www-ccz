/**
 * Stagger Ledger — adoption fence.
 *
 * Forbids bare `*-stagger-N` literals (`share-stagger-1` /
 * `mirror-stagger-2` / etc) outside the canonical home
 * (`lib/design/stagger.ts`). Every other `.ts`/`.tsx` file under
 * `app/**` + `components/**` + `lib/**` must reach for the lookup —
 * `staggerClassOf({ family, rung })` — so a future contributor cannot
 * paste a class string that quietly forgets to set `data-sys-stagger`
 * (the silence hook) on its DOM node.
 *
 * Why this fence is narrow: the CSS rule names live in `app/globals.css`
 * (excluded by extension). The TypeScript ledger holds the table. Any
 * other call site speaks through the lookup. The fence shape lifts
 * from `numeric-features-adoption` and `caption-metric-adoption`
 * (kernel: `_adoption-fence.ts`).
 *
 * Pure: no DOM, no Jest jsdom warmup. The fence is the lock that makes
 * the silence hook un-forgettable.
 *
 * Credits: Krystle C. (the fence prescription), Mike K. (#napkin §6 #5
 * — kernel-reuse, allow-list shape), Tanya D. (UX gate — "the fence
 * test is the contributor-facing surface"), Sid (this test —
 * 2026-04-27).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runFence, formatViolations, type FenceDecl } from './_adoption-fence';
import {
  STAGGER_ALLOWED_PATHS,
  STAGGER_LEDGER_EXEMPT_TOKEN,
} from '../stagger';

const ROOT = join(__dirname, '..', '..', '..');

/** Files that legitimately spell the bare `*-stagger-N` literals. */
const STAGGER_ALLOW: ReadonlySet<string> = new Set(STAGGER_ALLOWED_PATHS);

/** The bare-class regex — `share-stagger-N` or `mirror-stagger-N` for
 *  N ∈ {1,2,3}. Word-boundary guards keep `mirror-stagger-headline` (a
 *  hypothetical future neighbour) from false-positive. */
const STAGGER_RX = /(?<![\w-])(?:share|mirror)-stagger-[1-3](?![\w-])/;

const FENCE: FenceDecl = {
  scanDirs: ['components', 'lib', 'app'],
  patterns: [{ regex: STAGGER_RX, allow: STAGGER_ALLOW, kind: 'bare-stagger-class' }],
  exemptToken: STAGGER_LEDGER_EXEMPT_TOKEN,
};

// ─── Tests — the bare-class fence ─────────────────────────────────────────

describe('stagger adoption — every *-stagger-N literal routes through staggerClassOf', () => {
  const violations = runFence(FENCE);

  const fixHint =
    `    → use staggerClassOf({ family, rung }) from lib/design/stagger\n` +
    `    → and spread STAGGER_DATA_PROPS on the DOM node (silence hook)\n` +
    `    → exempt: // ${STAGGER_LEDGER_EXEMPT_TOKEN} — <honest reason>`;

  it('no module outside the ledger spells a bare *-stagger-N class', () => {
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + formatViolations(violations, fixHint));
  });
});

// ─── Positive tests — the canonical home exports the seam ─────────────────

describe('stagger adoption — the ledger exports the lookup surface', () => {
  const src = readFileSync(join(ROOT, 'lib/design/stagger.ts'), 'utf8');

  it('exports staggerClassOf as the consumer-facing helper', () => {
    expect(src).toMatch(/export\s+function\s+staggerClassOf/);
  });

  it('exports STAGGER_DATA_PROPS for the JSX-spread silence hook', () => {
    expect(src).toMatch(/export\s+const\s+STAGGER_DATA_PROPS/);
  });

  it('exports the StaggerFamily type union', () => {
    expect(src).toMatch(/export\s+type\s+StaggerFamily\s*=\s*'cluster'\s*\|\s*'reveal'/);
  });

  it('the class table holds both cluster and reveal rows verbatim', () => {
    expect(src).toMatch(/'share-stagger-1'/);
    expect(src).toMatch(/'mirror-stagger-3'/);
  });
});

// ─── Positive tests — the two consumer call sites use the lookup ──────────

describe('stagger adoption — call sites import from the canonical seam', () => {
  it('ShareOverlay imports staggerClassOf from lib/design/stagger', () => {
    const src = readFileSync(join(ROOT, 'components/mirror/ShareOverlay.tsx'), 'utf8');
    expect(src).toMatch(
      /import\s*\{[^}]*\bstaggerClassOf\b[^}]*\}\s*from\s*['"]@\/lib\/design\/stagger['"]/,
    );
  });

  it('ShareOverlay sets the data-sys-stagger silence hook on the cascade node', () => {
    const src = readFileSync(join(ROOT, 'components/mirror/ShareOverlay.tsx'), 'utf8');
    expect(src).toMatch(/STAGGER_DATA_PROPS/);
  });

  it('MirrorRevealCard imports staggerClassOf from lib/design/stagger', () => {
    const src = readFileSync(join(ROOT, 'components/mirror/MirrorRevealCard.tsx'), 'utf8');
    expect(src).toMatch(
      /import\s*\{[^}]*\bstaggerClassOf\b[^}]*\}\s*from\s*['"]@\/lib\/design\/stagger['"]/,
    );
  });

  it('MirrorRevealCard sets data-sys-stagger on its cascade rungs', () => {
    const src = readFileSync(join(ROOT, 'components/mirror/MirrorRevealCard.tsx'), 'utf8');
    expect(src).toMatch(/STAGGER_DATA_PROPS/);
  });
});

// ─── Positive test — exempt token is exported ─────────────────────────────

describe('stagger adoption — exempt token is exported', () => {
  it('the inline-exempt token is a discoverable string constant', () => {
    expect(STAGGER_LEDGER_EXEMPT_TOKEN).toBe('stagger-ledger:exempt');
  });
});
