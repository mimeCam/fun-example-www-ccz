/**
 * Toast migration receipt — the sprint-exit metric.
 *
 * Mike §8: "the *measurable* sprint-exit metric" — six `:exempt` tokens
 * across two foreign-DOM toast call sites must drop to zero, and the two
 * `document.createElement('div')` toast mounts must drop to zero. Once
 * those are gone, the 6th-primitive `<Toast>` is the only mouth on the
 * site. This test runs from CI, so the receipt cannot drift back silently.
 *
 * Test scope is strict: ONLY the two files Mike scoped (clipboard-utils,
 * export-utils). A separate adoption test (already extended in
 * elevation-adoption.test.ts) backs this with a positive presence check.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

const CALLSITES = [
  'lib/sharing/clipboard-utils.ts',
  'lib/quote-cards/export-utils.ts',
] as const;

const EXEMPT_TOKENS = [
  'elevation-ledger:exempt',
  'radius-ledger:exempt',
  'spacing-ledger:exempt',
] as const;

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

describe('Toast migration — `:exempt` tokens removed from call sites', () => {
  it.each(CALLSITES)('%s carries zero ledger exempt tokens', (file) => {
    const src = readSrc(file);
    for (const token of EXEMPT_TOKENS) {
      expect(src).not.toContain(token);
    }
  });
});

describe('Toast migration — foreign-DOM toast mounts removed', () => {
  it.each(CALLSITES)('%s no longer creates a toast `<div>` via createElement', (file) => {
    const src = readSrc(file);
    // The pattern that defined the old foreign-DOM toast mounts.
    expect(src).not.toMatch(/document\.createElement\(['"`]div['"`]\)/);
    // And the inline `cssText` literal that carried the old shadow/radius.
    expect(src).not.toMatch(/\.style\.cssText\s*=/);
  });
});

describe('Toast migration — call-site wrappers route through toast-store', () => {
  it.each(CALLSITES)('%s imports toastShow from the shared store', (file) => {
    const src = readSrc(file);
    expect(src).toMatch(/from\s+['"]@\/lib\/sharing\/toast-store['"]/);
    expect(src).toMatch(/\btoastShow\b/);
  });
});

describe('Toast migration — the 6th primitive exists and is mounted once', () => {
  it('components/shared/Toast.tsx exists', () => {
    expect(existsSync(join(ROOT, 'components/shared/Toast.tsx'))).toBe(true);
  });

  it('components/shared/ToastHost.tsx exists', () => {
    expect(existsSync(join(ROOT, 'components/shared/ToastHost.tsx'))).toBe(true);
  });

  it('ThermalLayout mounts <ToastHost /> exactly once', () => {
    const src = readSrc('components/thermal/ThermalLayout.tsx');
    const matches = src.match(/<ToastHost\s*\/>/g) ?? [];
    expect(matches.length).toBe(1);
  });
});
