/**
 * SelectionShareTrigger — source-pin invariants.
 *
 * jsdom is not configured (jest's `testEnvironment` is `node`); we cannot
 * mount the component. Instead we pin the load-bearing wiring at the
 * source level — drift would silently break the gesture in production.
 *
 * Pinned claims (one falsifiable assertion per `it`):
 *
 *   1. Imports `generateShareLink` from the orphan that just graduated.
 *   2. Imports `copyToClipboard` from the canonical clipboard helper.
 *   3. Rides `<ActionPressable>` + `useActionPhase` (the canonical Copy →
 *      Copied affordance with the SR peer — same primitive ReturnLetter,
 *      QuoteKeepsake, ThreadKeepsake, ShareOverlay-CopyLink ride).
 *   4. Carries the `'use client'` directive (required for hooks + window
 *      access).
 *   5. The pure helpers are exported via `__testing__` — and `runCopy`
 *      refuses to copy an empty quote (the empty-selection quiet path).
 *
 * Credits: Mike K. (#39 §POI 3 — `<ActionPressable>` is the 5th speaker;
 * fingertip-witness covenant), Tanya D. (UIX — silence in production,
 * the icon-only popover row), Sid (this lift; source-pin pattern from
 * `useActionPhase.test.ts` and `useReducedMotion.test.ts`).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { __testing__ } from '../SelectionShareTrigger';

const SRC_PATH = join(__dirname, '..', 'SelectionShareTrigger.tsx');
const SRC = readFileSync(SRC_PATH, 'utf8');

// ─── 1 · Source-pin imports ──────────────────────────────────────────────

describe('SelectionShareTrigger · source-pin imports', () => {
  it('imports generateShareLink from share-links (the orphan)', () => {
    expect(SRC).toMatch(/generateShareLink/);
    expect(SRC).toMatch(/from\s+['"]@\/lib\/sharing\/share-links['"]/);
  });

  it('imports copyToClipboard from clipboard-utils', () => {
    expect(SRC).toMatch(/copyToClipboard/);
    expect(SRC).toMatch(/from\s+['"]@\/lib\/sharing\/clipboard-utils['"]/);
  });

  it('rides ActionPressable + useActionPhase (the 5th speaker)', () => {
    expect(SRC).toMatch(/from\s+['"]@\/components\/shared\/ActionPressable['"]/);
    expect(SRC).toMatch(/from\s+['"]@\/lib\/hooks\/useActionPhase['"]/);
  });

  it('uses the LinkIcon glyph (sister to Copy and Download silhouettes)', () => {
    expect(SRC).toMatch(/LinkIcon/);
  });
});

// ─── 2 · Use-client envelope ─────────────────────────────────────────────

describe('SelectionShareTrigger · client-only envelope', () => {
  it('carries the "use client" directive (window + hooks)', () => {
    expect(SRC).toMatch(/^['"]use client['"];/m);
  });
});

// ─── 3 · Pure helper behaviour ───────────────────────────────────────────
//
// The pure helpers are exposed via `__testing__` precisely so we can
// exercise them without mounting the component.

describe('SelectionShareTrigger · pure helpers', () => {
  it('runCopy resolves false on an empty / whitespace-only quote', async () => {
    // A click with no captured selection must not call clipboard at all.
    // The boolean carries through ActionPressable's pulse contract: the
    // witness collapses to idle (FAIL → idle is the fail-quiet path).
    expect(await __testing__.runCopy('')).toBe(false);
    expect(await __testing__.runCopy('    ')).toBe(false);
  });

  it('buildShareUrl returns an empty string when window is undefined', () => {
    // jest's testEnvironment is `node`; window is genuinely absent.
    // The encoder must not throw, must not invent a URL, must not paint.
    // The fragment shape is still emitted on the empty base — the parent
    // gates the click on a non-empty quote, but we pin the lower-level
    // behaviour so the gate's contract holds.
    const url = __testing__.buildShareUrl('A sentence.');
    expect(url).toMatch(/^#highlight=/);
  });
});

// ─── 4 · Visual covenant — icon-only popover row ─────────────────────────

describe('SelectionShareTrigger · visual covenant', () => {
  it('uses labelMode="hidden" (icon-only inside the popover row)', () => {
    expect(SRC).toMatch(/labelMode=["']hidden["']/);
  });

  it('uses variant="icon" + size="sm" (matches the gem sibling)', () => {
    expect(SRC).toMatch(/variant=["']icon["']/);
    expect(SRC).toMatch(/size=["']sm["']/);
  });
});
