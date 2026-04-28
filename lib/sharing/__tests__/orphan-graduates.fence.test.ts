/**
 * orphan-graduates — the fence that prevents the share-links + highlight-
 * finder modules from re-orphaning during a future refactor.
 *
 * History: `lib/sharing/share-links.ts` and `lib/sharing/highlight-finder.ts`
 * shipped fully-formed and then sat for many sprints with **zero**
 * non-test importers anywhere in the app (Mike #39 §1 — "the actual
 * broken contract"). The wiring this PR landed graduates them; this
 * fence keeps the graduation honest by failing if the modules ever
 * lose their last reader-facing caller again.
 *
 * Why a small fence (Mike's punch list §5 — "earns its keep"): one
 * assertion per module, single rung, no sister pair. The failure
 * message names the problem in plain English so the next contributor
 * who deletes a caller knows immediately why CI went red.
 *
 * Scope is intentionally tight — the fence only checks for *non-test*
 * imports under `app/` + `components/` + `lib/`. Tests are excluded so
 * a test-only import does not satisfy the "graduated" claim.
 *
 * Credits: Mike K. (#39 §"the only new fence"), Sid (this lift;
 * non-test-importer scanner pattern lifted from the color-adoption
 * file walker — copy, do not reinvent).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');
const SCAN_DIRS = ['app', 'components', 'lib'];
const SCAN_EXTS = new Set<string>(['.ts', '.tsx']);

/** The two modules that need a non-test reader to claim "graduated." */
const GRADUATED_MODULES: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  {
    name: 'lib/sharing/share-links.ts',
    pattern: /from\s+['"]@\/lib\/sharing\/share-links['"]/,
  },
  {
    name: 'lib/sharing/highlight-finder.ts',
    pattern: /from\s+['"]@\/lib\/sharing\/highlight-finder['"]/,
  },
];

function isScannableFile(p: string): boolean {
  const ext = p.slice(p.lastIndexOf('.'));
  if (!SCAN_EXTS.has(ext)) return false;
  if (p.endsWith('.test.ts') || p.endsWith('.test.tsx')) return false;
  if (p.endsWith('.d.ts')) return false;
  return !p.includes(`${sep}__tests__${sep}`);
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (isScannableFile(full)) acc.push(full);
  }
  return acc;
}

function collectScannableFiles(): string[] {
  return SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
}

function relPath(full: string): string {
  return relative(ROOT, full).split(sep).join('/');
}

/** True iff the source string contains the import pattern. */
function importsMatch(src: string, rx: RegExp): boolean {
  return rx.test(src);
}

/** Files under SCAN_DIRS (sans tests) that import the given module path. */
function findImporters(rx: RegExp): string[] {
  return collectScannableFiles()
    .filter((p) => {
      const src = readFileSync(p, 'utf8');
      // Skip the module's own file (a module is not its own importer).
      const isSelfModule = p.endsWith('share-links.ts')
        || p.endsWith('highlight-finder.ts');
      return !isSelfModule && importsMatch(src, rx);
    })
    .map(relPath);
}

describe('orphan-graduates — the share-links family has non-test readers', () => {
  GRADUATED_MODULES.forEach(({ name, pattern }) => {
    it(`${name} has at least one non-test importer`, () => {
      const importers = findImporters(pattern);
      // The failure message IS the documentation (Mike #10 §5 lineage).
      if (importers.length === 0) {
        throw new Error(
          `\n${name} has no non-test importer.\n` +
          '  This module was orphaned for many sprints (Mike #39 §1) and just\n' +
          '  graduated. Re-orphaning it is the regression this fence catches.\n' +
          '  Either restore a real caller (an article-route component, a hook,\n' +
          '  a sibling sharing util) or delete the module + this fence entry.\n',
        );
      }
      expect(importers.length).toBeGreaterThan(0);
    });
  });

  it('the article route is the canonical caller for the landing hook', () => {
    // Stronger sanity-check: the recipient-side hook (which itself imports
    // share-links + highlight-finder) is mounted on the article page. If
    // someone deletes the wiring there, this will fail before the field
    // does.
    const page = readFileSync(
      join(ROOT, 'app/article/[id]/page.tsx'),
      'utf8',
    );
    expect(page).toMatch(/useSharedHighlightOnLand/);
  });

  it('the selection popover hosts the share trigger (sender-side caller)', () => {
    const popover = readFileSync(
      join(ROOT, 'components/resonances/SelectionPopover.tsx'),
      'utf8',
    );
    expect(popover).toMatch(/SelectionShareTrigger/);
  });
});
