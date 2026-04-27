/**
 * divider-fence — site-wide fence around the section-divider kernel.
 *
 * Same shape as `dismiss-verb-fence.test.ts` and `lean-arrow-fence.test.ts`
 * — the third independent verb-primitive fence (Mike #37 §6 closing note).
 * The pattern of three has fired, but the `makeKernelFence()` extraction is
 * deferred — let the fourth verb-primitive decide whether the abstraction
 * earns itself. Until then the address stays honest by repetition.
 *
 *   Axis A · Caller fence    no `h-px` paired with `max-w-divider` outside
 *                            the kernel. A future seventh dialect of the
 *                            hairline (the seven we already merged + one
 *                            more) fails the build before it merges.
 *
 *   Axis B · Kernel fence    `Divider.tsx` reaches `alphaClassOf('gold',
 *                            'hairline','bg')` and `gestureClassesForMotion(
 *                            'fade-neutral', …)`. No raw `bg-gold/<N>` or
 *                            `transition-transform duration-…` literal
 *                            escapes inside the kernel.
 *
 *   Axis C · Universality    the export `Divider` is imported by the
 *                            migrated call sites; a future caller cannot
 *                            paint a hairline outside the kernel without
 *                            tripping Axis A. Counts a positive floor of
 *                            importers (≥ 5) so the fence isn't a no-op.
 *
 *   Axis D · Geometry reject no raw `<hr>` in `app/**` or `components/**`
 *                            outside the print-hairline domain
 *                            (`components/reading/` — `ReadersMark` /
 *                            `ArticleProvenance`). The print kernel is a
 *                            separate primitive (Mike #37 §10 / Tanya §7).
 *                            One paper-only `<hr>` survives on
 *                            `app/article/[id]/page.tsx:141` — the
 *                            print-hairline domain that brackets the
 *                            printed article (paired with `ReadersMark`).
 *
 *   Axis E · Address Test    the verb-primitive's seven utterances all
 *                            spell `divider` — kernel file path, exported
 *                            symbol, the three placement names (`Static` /
 *                            `Reveal` / `Centered` are framed by the
 *                            `Divider.` namespace), the spacing token
 *                            `--sys-maxw-divider`, and this fence file's
 *                            name. LOCAL to this verb only — N=3 verb-
 *                            primitives total, but the helper graduation
 *                            is deferred (Mike #37 §6).
 *
 *   Axis F · Border alpha    sister axis to B (kernel) — no raw
 *                            `border-gold/<N>` literal in `app/**` or
 *                            `components/**` outside the kernel, the
 *                            ledger lookup tables, the print-hairline
 *                            domain, and the JIT-mirror carve-out
 *                            (Mike napkin #113 §6 PoI #3 — `ExploreArticle
 *                            Card.tsx`'s `hover:border-gold/50` literal
 *                            mirrors the `CURATED_HOVER` const because
 *                            Tailwind's JIT cannot see `hover:${X}`
 *                            interpolation; the byte-identical pair is the
 *                            audit trail). The Golden Thread paints at one
 *                            address, one rung, one filament — the whisper
 *                            line and the section divider above/below it
 *                            now arrive on the same `hairline` rung
 *                            (Tanya UIX #54 §1).
 *
 * Credits: Mike K. (#37 napkin §6 — the five-axis spec, the print-hairline
 * carve-out, the fence-helper-deferred-until-fourth rule), Tanya D. (UIX
 * #28 §3 — the "one rung, one width, one breath" doctrine the fence
 * enforces; §7 — the print kernel separation), Krystle C. (the migration-
 * receipt rigor the importer floor counts), Sid (this fence — same shape,
 * third time, in the right neighborhood for the right family).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  preloadFiles,
  lineAt,
  stripCommentsAndTemplates as preprocess,
} from '../../../lib/design/__tests__/_fence';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Scan footprint — the JSX surface this fence guards ───────────────────

/** Same scope as the dismiss-verb fence: app + components. */
const SCAN_DIRS: readonly string[] = ['app', 'components'];

/** Single source of truth for the kernel's location — utterances rest on this. */
const KERNEL_PATH = 'components/shared/Divider.tsx';

/**
 * Print-hairline carve-out: `components/reading/` houses the print-only
 * primitives (`ReadersMark`, `ArticleProvenance`) that bracket the printed
 * article. Different kernel, different fence (Mike #37 §10 / Tanya §7).
 * The article page's paper-only `<hr>` on line 141 lives in this domain.
 */
const PRINT_HAIRLINE_PATHS: readonly string[] = [
  'components/reading/',
  // The article header `<hr>` that pairs with ReadersMark/ArticleProvenance
  // to bracket the printed page. The line below it (199) — the coda
  // hairline — migrates onto `<Divider.Static />` in this PR.
  'app/article/[id]/page.tsx',
  // The article-loading skeleton mirrors `page.tsx`'s print-hairline `<hr>`
  // (the divider draw under the title's HeaderSkeleton), so the loading
  // state can fade in identically when the article lands. Same domain,
  // same kernel, same carve-out (Sid 2026-04-27 — divider-fence Axis D
  // graduation; the loading file was always part of the print pair).
  'app/article/[id]/loading.tsx',
];

/**
 * JIT-mirror carve-out (Mike napkin #113 §6 PoI #3): files that paint a
 * raw `border-gold/<N>` literal as a JIT-visible mirror of `alphaClassOf`-
 * resolved consts in the same module. Tailwind's JIT cannot see
 * `hover:${X}` template interpolation, so the full token must appear
 * verbatim in source — and the byte-identical pair (resolved const +
 * raw literal) is the audit trail. Each file in this list carries an
 * inline `// alpha-ledger:exempt — JIT mirror of …` comment naming the
 * mirrored consts; the path-allow + comment pair is the same convention
 * `AmbientNav.tsx`'s structural-scrim exempt uses (Mike napkin #110 §4).
 */
const JIT_MIRROR_PATHS: readonly string[] = [
  'components/explore/ExploreArticleCard.tsx',
];

/** Read every preloaded file once; downstream describes share the cache. */
const preloadAll = (): readonly { rel: string; src: string }[] =>
  preloadFiles(SCAN_DIRS);

// ─── Axis A · Caller fence — no hand-rolled hairlines ─────────────────────

interface CallerViolation { file: string; line: number; snippet: string }

/**
 * Find every `h-px` paired with `max-w-divider` in the same className. The
 * kernel itself is exempt by file-path filter. Pure source-string lint; no
 * React, no DOM. The pairing is the load-bearing signal — `h-px` alone is
 * legal (vitality bars, tracks); `max-w-divider` alone is non-existent.
 */
function findCallerViolations(rel: string, src: string): CallerViolation[] {
  if (rel === KERNEL_PATH) return [];
  const violations: CallerViolation[] = [];
  for (const m of src.matchAll(/h-px[^"`{}\n]*max-w-divider|max-w-divider[^"`{}\n]*h-px/g)) {
    violations.push({
      file: rel, line: lineAt(src, m.index ?? 0), snippet: m[0].slice(0, 80),
    });
  }
  return violations;
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
    `  ${v.file}:${v.line} — raw \`h-px max-w-divider\` outside the kernel\n\n` +
    `    snippet: ${v.snippet}\n` +
    `    The section-divider primitive is the Divider kernel's job, not the\n` +
    `    caller's. Replace with <Divider.Static />, <Divider.Reveal /> or\n` +
    `    <Divider.Centered /> from @/components/shared/Divider. Custom\n` +
    `    spacing? Use the \`spacing\` allowlist token; raw className escape\n` +
    `    hatches are forbidden by the kernel's frozen contract.`
  );
}

describe('divider-fence — Axis A · no hand-rolled hairlines outside the kernel', () => {
  it('no `h-px` paired with `max-w-divider` outside Divider.tsx', () => {
    const violations = scanAllCallers();
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) {
      throw new Error('\n' + violations.map(formatCallerFailure).join('\n\n'));
    }
  });
});

// ─── Axis B · Kernel fence — the kernel honors its frozen contract ───────

describe('divider-fence — Axis B · kernel anchors the verb', () => {
  const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
  const stripped = preprocess(src);

  it('the kernel reaches alphaClassOf for the gold/hairline rung', () => {
    expect(stripped).toMatch(/alphaClassOf\(\s*['"]gold['"]\s*,\s*['"]hairline['"]/);
  });

  it('the kernel reaches gestureClassesForMotion for the fade-neutral verb', () => {
    expect(stripped).toMatch(/gestureClassesForMotion\(\s*['"]fade-neutral['"]/);
  });

  it('the kernel exposes a single `Divider` const namespace', () => {
    expect(stripped).toMatch(/export\s+const\s+Divider\s*=/);
  });

  it('the kernel exports the three frozen placements (Static · Reveal · Centered)', () => {
    expect(stripped).toMatch(/Static\s*:/);
    expect(stripped).toMatch(/Reveal\s*:/);
    expect(stripped).toMatch(/Centered\s*:/);
  });

  it('the kernel does not inline a raw `bg-gold/<N>` literal (must route through alphaClassOf)', () => {
    // Direct `bg-gold/10` literals in the kernel would side-step the
    // alpha-call-site fence and break the JIT-safety lesson the ledger
    // already paid for. The handle `HAIRLINE_BG = alphaClassOf(…)` is
    // the only legal spelling.
    expect(stripped).not.toMatch(/['"`]bg-gold\/\d+['"`]/);
  });

  it('the kernel does not inline a raw `duration-* ease-*` pair (must route through gesture atlas)', () => {
    // The transition-transform class lives in the kernel; the (duration,
    // ease) pair must come from `gestureClassesForMotion('fade-neutral',
    // reduce)`. A raw literal would fork the verb registry.
    expect(stripped).not.toMatch(/duration-(?:fade|crossfade|enter|hover|reveal|linger|settle|instant)\s+ease-/);
  });

  it('the kernel renders role="separator" on every variant (ARIA contract)', () => {
    // The shared ARIA_PROPS bag is spread on each variant's hairline div;
    // its declaration is the single source of truth.
    expect(stripped).toMatch(/role:\s*['"]separator['"]/);
    expect(stripped).toMatch(/['"]aria-orientation['"]\s*:\s*['"]horizontal['"]/);
  });
});

// ─── Axis C · Universality — `Divider` is imported by the migrated callers ─

describe('divider-fence — Axis C · `Divider` is imported by the migrated call sites', () => {
  function importers(): string[] {
    const rx = /import[^;]*\bDivider\b[^;]*from\s+['"]@\/components\/shared\/Divider['"]/;
    return preloadAll()
      .filter(({ rel }) => rel.endsWith('.tsx') && rel !== KERNEL_PATH)
      .filter(({ src }) => rx.test(src))
      .map(({ rel }) => rel);
  }

  it('at least five .tsx files import Divider (the migrated call sites)', () => {
    // Six call sites migrate in this PR (article-coda, MirrorRevealCard,
    // ReturnLetter, StratifiedRenderer, ResonancesClient, ResonanceEntry).
    // Floor at ≥5 to keep the fence robust under future consolidations
    // (e.g. if `ResonancesClient` ever merges with `ResonanceEntry`).
    const carriers = importers();
    expect(carriers.length).toBeGreaterThanOrEqual(5);
  });

  it('every importer reaches the kernel via `@/components/shared/Divider` (no parallel kernel)', () => {
    const carriers = importers();
    // Every importer is in app/ or components/ — no surprise paths.
    for (const c of carriers) {
      expect(c.startsWith('app/') || c.startsWith('components/')).toBe(true);
    }
  });
});

// ─── Axis D · Geometry rejection — no raw `<hr>` outside the print domain ─

interface HrViolation { file: string; line: number; snippet: string }

/** True iff the given path lives inside the print-hairline domain. */
function isPrintHairlinePath(rel: string): boolean {
  return PRINT_HAIRLINE_PATHS.some((p) => rel.startsWith(p) || rel === p);
}

/**
 * Find every `<hr` opening tag in the file. The print-hairline domain is
 * exempt by path filter; everywhere else, the legacy raw `<hr>` retires
 * onto the kernel. Pure source-string lint, ≤ 10 LoC.
 */
function findHrViolations(rel: string, src: string): HrViolation[] {
  if (isPrintHairlinePath(rel)) return [];
  const violations: HrViolation[] = [];
  for (const m of src.matchAll(/<hr\b[^>]*>/g)) {
    violations.push({
      file: rel, line: lineAt(src, m.index ?? 0), snippet: m[0].slice(0, 80),
    });
  }
  return violations;
}

let cachedHrViolations: HrViolation[] | null = null;

function scanAllHrs(): HrViolation[] {
  if (cachedHrViolations !== null) return cachedHrViolations;
  cachedHrViolations = preloadAll()
    .filter(({ rel }) => rel.endsWith('.tsx'))
    .flatMap(({ rel, src }) => findHrViolations(rel, src));
  return cachedHrViolations;
}

function formatHrFailure(v: HrViolation): string {
  return (
    `  ${v.file}:${v.line} — raw <hr> outside the print-hairline domain\n\n` +
    `    snippet: ${v.snippet}\n` +
    `    The section-divider primitive is the Divider kernel's job, not a\n` +
    `    raw <hr> tag. Replace with <Divider.Static /> from\n` +
    `    @/components/shared/Divider. Print-only hairlines (ReadersMark /\n` +
    `    ArticleProvenance) live in components/reading/ — different kernel.`
  );
}

describe('divider-fence — Axis D · no raw <hr> outside the print-hairline domain', () => {
  it('no <hr> survives in app/** or components/** outside the print kernel', () => {
    const violations = scanAllHrs();
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) {
      throw new Error('\n' + violations.map(formatHrFailure).join('\n\n'));
    }
  });
});

// ─── Axis F · No raw `border-gold/<N>` outside the ledger + kernel ────────
//
// Sister axis to A (geometry) and B (kernel). After EvolutionThread's snap
// (Mike napkin #113), `lib/design/alpha.ts` is the only home that may spell
// `border-gold/<N>` as a raw literal in source — and even there only inside
// the lookup tables. The kernel (`Divider.tsx`) reaches the literal via
// `alphaClassOf` (Axis B already pins this). All other paint sites must
// route through `alphaClassOf('gold','hairline'|'muted'|'recede'|'quiet',
// 'border')` and bind to a module-scope `const`. The print-hairline carve-
// out (Axis D's `PRINT_HAIRLINE_PATHS`) is inherited verbatim — the printed
// page hairlines bracket the article and live in a separate kernel. The
// JIT-mirror carve-out (`JIT_MIRROR_PATHS`) covers the one legitimate raw-
// literal exception (`ExploreArticleCard.tsx:84` — `hover:border-gold/50`
// is invisible to Tailwind's JIT under template interpolation).

interface BorderGoldViolation { file: string; line: number; snippet: string }

/** True iff this path lives inside the JIT-mirror carve-out. */
function isJitMirrorPath(rel: string): boolean {
  return JIT_MIRROR_PATHS.some((p) => rel === p);
}

/**
 * Find every raw `border-gold/<N>` literal in the file. Pure source-string
 * lint, ≤ 10 LoC. Print-hairline + JIT-mirror domains are exempt by path
 * filter; everywhere else, the literal must route through `alphaClassOf`.
 * Operates on the preload's stripped source (comments + backtick-template
 * bodies blanked by `_fence`) — JSDoc references to "the rung
 * resolves to `border-gold/10`" stay free; the rule fires on bare class
 * literals only. Single-quoted class strings (like the `ExploreArticleCard`
 * mirror) are still visible and earn an exempt path.
 */
function findBorderGoldViolations(rel: string, src: string): BorderGoldViolation[] {
  if (isPrintHairlinePath(rel) || isJitMirrorPath(rel)) return [];
  const violations: BorderGoldViolation[] = [];
  for (const m of src.matchAll(/\bborder-gold\/\d+\b/g)) {
    violations.push({ file: rel, line: lineAt(src, m.index ?? 0), snippet: m[0] });
  }
  return violations;
}

let cachedBorderGoldViolations: BorderGoldViolation[] | null = null;

function scanAllBorderGold(): BorderGoldViolation[] {
  if (cachedBorderGoldViolations !== null) return cachedBorderGoldViolations;
  cachedBorderGoldViolations = preloadAll()
    .filter(({ rel }) => rel.endsWith('.tsx'))
    .flatMap(({ rel, src }) => findBorderGoldViolations(rel, src));
  return cachedBorderGoldViolations;
}

function formatBorderGoldFailure(v: BorderGoldViolation): string {
  return (
    `  ${v.file}:${v.line} — raw \`${v.snippet}\` outside the ledger\n\n` +
    `    The Golden Thread is one filament, one rung, one address. Route\n` +
    `    through alphaClassOf('gold', <hairline|muted|recede|quiet>,\n` +
    `    'border') from @/lib/design/alpha and bind to a module-scope\n` +
    `    const (sister to Divider.HAIRLINE_BG, MirrorRevealCard.\n` +
    `    BORDER_HAIRLINE, EvolutionThread.HAIRLINE_BORDER). Print-only\n` +
    `    hairlines live in components/reading/ + the article print pair.`
  );
}

describe('divider-fence — Axis F · no raw `border-gold/<N>` outside the ledger', () => {
  it('no raw border-gold/<N> survives in app/** or components/** outside the carve-outs', () => {
    const violations = scanAllBorderGold();
    expect(violations.map((v) => `${v.file}:${v.line} ${v.snippet}`)).toEqual([]);
    if (violations.length > 0) {
      throw new Error('\n' + violations.map(formatBorderGoldFailure).join('\n\n'));
    }
  });

  it('the ledger lookup table at lib/design/alpha.ts still spells `border-gold/<N>` (sanity-positive)', () => {
    // The fence is in scope of `app/**` + `components/**`; the ledger lives
    // at `lib/design/alpha.ts` and is canonically out of scope. Read it
    // directly to assert the literal forms still exist — the fence isn't
    // a no-op; the ledger is just the one source of truth by construction.
    const ledger = readFileSync(join(ROOT, 'lib/design/alpha.ts'), 'utf8');
    expect(ledger).toMatch(/['"]border-gold\/10['"]/);
    expect(ledger).toMatch(/['"]border-gold\/30['"]/);
  });

  it('the JIT-mirror carve-out names ExploreArticleCard (one entry only)', () => {
    expect(JIT_MIRROR_PATHS).toEqual(['components/explore/ExploreArticleCard.tsx']);
  });
});

// ─── Axis E · Address Test — the verb's utterances all spell `divider` ────
//
// LOCAL to this verb only — N=3 verb-primitive fences total, but the helper
// graduation is deferred (Mike #37 §6 closing note). The fourth verb-
// primitive earns the `makeKernelFence()` extraction. Until then the
// address stays honest by repetition. Same constraint the dismiss-verb and
// lean-arrow fences honor.

describe('divider-fence — Axis E · seven utterances spell `divider`', () => {
  it('utterance #1 — kernel file path is `components/shared/Divider.tsx`', () => {
    expect(KERNEL_PATH).toBe('components/shared/Divider.tsx');
    expect(preloadAll().some(({ rel }) => rel === KERNEL_PATH)).toBe(true);
  });

  it('utterance #2 — kernel exports a `Divider` const namespace', () => {
    const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
    expect(src).toMatch(/export\s+const\s+Divider\s*=/);
  });

  it('utterance #3 — kernel exports `.Static` placement on the namespace', () => {
    const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
    expect(preprocess(src)).toMatch(/Static\s*:/);
  });

  it('utterance #4 — kernel exports `.Reveal` placement on the namespace', () => {
    const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
    expect(preprocess(src)).toMatch(/Reveal\s*:/);
  });

  it('utterance #5 — kernel exports `.Centered` placement on the namespace', () => {
    const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
    expect(preprocess(src)).toMatch(/Centered\s*:/);
  });

  it('utterance #6 — Tailwind config declares `divider` max-width token', () => {
    const tw = readFileSync(join(ROOT, 'tailwind.config.ts'), 'utf8');
    expect(tw).toMatch(/['"]divider['"]\s*:\s*['"]var\(--sys-maxw-divider\)['"]/);
  });

  it('utterance #7 — this fence file is named `divider-fence.test.ts`', () => {
    expect(__filename.endsWith('divider-fence.test.ts')).toBe(true);
  });
});

// ─── Sanity guard — the fence is not a no-op ──────────────────────────────

describe('divider-fence — sanity · the kernel is reachable from the call sites', () => {
  it('the kernel file exists and the namespace export resolves', () => {
    const src = readFileSync(join(ROOT, KERNEL_PATH), 'utf8');
    expect(src.length).toBeGreaterThan(0);
    expect(src).toContain('export const Divider');
  });

  it('the print-hairline carve-out names the components/reading domain', () => {
    expect(PRINT_HAIRLINE_PATHS).toContain('components/reading/');
  });
});
