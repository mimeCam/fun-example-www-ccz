/**
 * thread-adoption — ThreadDriver sources timing only from MOTION / CEREMONY.
 *
 * The Thread is the signature surface. If a raw `2000`, `'300ms'`, or a
 * stray `opacity: 0.3` slips into `lib/thread/**`, we lose the single-
 * source-of-truth posture that made the site-wide adoption guards worth
 * the mileage. One tiny file-scan keeps the flagship honest even though
 * it lives outside the directories the broader motion-adoption scanner
 * covers.
 *
 * What we enforce for `lib/thread/**`:
 *   (1) every timing reference routes through the Motion ledger (imports
 *       MOTION and/or CEREMONY from lib/design/motion when any duration
 *       is needed);
 *   (2) no quoted time literals (`'200ms'`, `'1.5s'`);
 *   (3) no numeric setTimeout(_, N≥10) — the driver uses RAF only;
 *   (4) no inline opacity literals (`opacity: 0.3`) — Alpha-ledger or
 *       nothing.
 *
 * This is belt-and-braces on top of the existing adoption guards — the
 * catch lands here before it spreads into the rest of the codebase.
 *
 * Credits: Mike K. (napkin §5 P4 — "Motion ledger discipline"; §4 —
 * this file's 30-LOC budget), Elon M. (first-principles: every literal
 * on the flagship must justify itself).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');
const THREAD_DIR = join(ROOT, 'lib', 'thread');

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { walk(full, acc); continue; }
    if (!full.endsWith('.ts') || full.endsWith('.test.ts')) continue;
    if (full.includes(`${sep}__tests__${sep}`)) continue;
    acc.push(full);
  }
  return acc;
}

function rel(full: string): string {
  return relative(ROOT, full).split(sep).join('/');
}

describe('thread-adoption — the flagship sources timing from MOTION/CEREMONY', () => {
  const files = walk(THREAD_DIR);

  it('finds thread module files to scan (sanity)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('no quoted time literals (e.g. "200ms", "1.5s") in lib/thread/**', () => {
    const hits = files.filter((f) => {
      const src = readFileSync(f, 'utf8');
      return /['"`]\d+\s*ms['"`]/.test(src)
          || /['"`]\d+(?:\.\d+)?\s*s['"`]/.test(src);
    });
    expect(hits.map(rel)).toEqual([]);
  });

  it('no numeric setTimeout(_, N≥10) — the driver uses RAF', () => {
    const hits = files.filter((f) =>
      /setTimeout\s*\(\s*[^,]+,\s*\d{2,}\s*\)/.test(readFileSync(f, 'utf8')),
    );
    expect(hits.map(rel)).toEqual([]);
  });

  it('no inline opacity literals (e.g. opacity: 0.3) in lib/thread/**', () => {
    const hits = files.filter((f) =>
      /opacity\s*:\s*(0?\.\d+|\d+)\b/.test(readFileSync(f, 'utf8')),
    );
    expect(hits.map(rel)).toEqual([]);
  });

  it('thread-tween imports MOTION from the ledger (not a literal beat)', () => {
    const tween = readFileSync(join(THREAD_DIR, 'thread-tween.ts'), 'utf8');
    expect(tween).toMatch(/from ['"]@\/lib\/design\/motion['"]/);
    expect(tween).toMatch(/MOTION\.\w+/);
  });
});
