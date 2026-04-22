/**
 * textlink-adoption — adoption guardrail for the `<TextLink>` primitive.
 *
 * Direct fork of `pressable-adoption.test.ts` / `field-adoption.test.ts`.
 * Every textual navigation on the site goes through
 * `components/shared/TextLink.tsx`. This test fails when a raw `<a>`
 * tag or a `next/link` import slips into `components/**` or `app/**`
 * outside the small, documented allow-list.
 *
 * Allow-list intent (Mike §6.6):
 *   • `TextLink.tsx` itself — the primitive owns the raw anchor.
 *   • `AmbientNav.tsx` — its own voice, its own pulse dot (Tanya §2,
 *     §6.2). One documented exception, not a pattern.
 *   • `GemHome.tsx` — an icon link, not text (Tanya §6.2).
 *   • `ReadingInvitation.tsx` / `ExploreArticleCard.tsx` — card-as-link /
 *     `Pressable asChild` CTAs. Use `<Link>` inside a surface, not prose.
 *
 * Credits: Mike K. (napkin §6.6 — start permissive, land strict),
 * Tanya D. (allow-list justification §6.2), Elon M. (guard-as-test).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

/** The one module that legitimately renders a raw `<a>`. */
const ANCHOR_ALLOW = new Set<string>([
  'components/shared/TextLink.tsx',
]);

/**
 * Modules allowed to `import Link from 'next/link'` — because they
 * are either the primitive itself or a documented non-text surface
 * (nav, icon link, card-as-link, Pressable asChild CTA).
 *
 * The three `app/**` entries are empty-state primary CTAs that wrap
 * `<Link>` inside `<Pressable asChild>`. That is the established
 * pattern for consent surfaces (Tanya §6.2); prose moved to TextLink.
 */
const NEXTLINK_ALLOW = new Set<string>([
  'components/shared/TextLink.tsx',
  'components/navigation/AmbientNav.tsx',
  'components/navigation/GemHome.tsx',
  'components/home/ReadingInvitation.tsx',
  'components/explore/ExploreArticleCard.tsx',
  'app/not-found.tsx',
  'app/mirror/page.tsx',
  'app/resonances/ResonancesClient.tsx',
]);

/** Modules allowed to import link-phase recipe helpers. */
const RECIPE_ALLOW = new Set<string>([
  'components/shared/TextLink.tsx',
  'lib/utils/link-phase.ts',
]);

/** Directories to scan. */
const SCAN_DIRS = ['components', 'app'];

/** File extensions to scan. */
const SCAN_EXTS = new Set<string>(['.tsx']);

// ─── File walker (pure, ≤ 10 LOC each) ─────────────────────────────────────

function isScannableFile(path: string): boolean {
  if (!SCAN_EXTS.has(path.slice(path.lastIndexOf('.')))) return false;
  return !path.endsWith('.test.tsx') && !path.endsWith('.d.tsx');
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
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

// ─── Pattern scanners (pure, each returns a boolean) ──────────────────────

/** `<a href=…>` / `<a target=…>` style raw anchors in JSX. */
function hasRawAnchor(src: string): boolean {
  return /<a\s+(?:[^>]*\s)?(?:href|target|rel)=/.test(src);
}

/** Any `import … from 'next/link'` statement. */
function hasNextLinkImport(src: string): boolean {
  return /from\s+['"]next\/link['"]/.test(src);
}

/** Links that look like naked prose anchors (no TextLink migration). */
function hasAdHocLinkStyles(src: string): boolean {
  if (/hover:text-gold\/\d+/.test(src) && !/TextLink/.test(src)) return true;
  return false;
}

// ─── Violation collector ──────────────────────────────────────────────────

type Kind = 'raw-anchor' | 'next-link-import' | 'ad-hoc-link';

interface Violation { file: string; kind: Kind }

function checkOne(
  rel: string, src: string, kind: Kind, test: boolean, allow: Set<string>,
): Violation[] {
  return test && !allow.has(rel) ? [{ file: rel, kind }] : [];
}

function check(path: string, src: string): Violation[] {
  const rel = relativePath(path);
  return [
    ...checkOne(rel, src, 'raw-anchor', hasRawAnchor(src), ANCHOR_ALLOW),
    ...checkOne(rel, src, 'next-link-import', hasNextLinkImport(src), NEXTLINK_ALLOW),
    ...checkOne(rel, src, 'ad-hoc-link', hasAdHocLinkStyles(src), RECIPE_ALLOW),
  ];
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) => check(p, readFileSync(p, 'utf8')));
}

// ─── Tests — the whole point ───────────────────────────────────────────────

describe('textlink adoption — every text link speaks one dialect', () => {
  const violations = findAllViolations();

  it('no raw <a href=…> outside components/shared/TextLink.tsx', () => {
    const raw = violations.filter((v) => v.kind === 'raw-anchor');
    expect(raw.map((v) => v.file)).toEqual([]);
  });

  it('next/link is imported only by the primitive + documented non-text surfaces', () => {
    const nl = violations.filter((v) => v.kind === 'next-link-import');
    expect(nl.map((v) => v.file)).toEqual([]);
  });

  it('no ad-hoc prose link styling (hover:text-gold/*) outside the primitive', () => {
    const ah = violations.filter((v) => v.kind === 'ad-hoc-link');
    expect(ah.map((v) => v.file)).toEqual([]);
  });
});
