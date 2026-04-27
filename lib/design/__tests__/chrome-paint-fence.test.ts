/**
 * chrome-paint-fence — pinning fence for the `chromeMutedBorder()`
 * kernel-lift. Reads the raw source of the six chrome surfaces that
 * share the muted-rung hairline and asserts they all spell the
 * migrated factory call IDENTICALLY.
 *
 * Why a separate fence (Mike napkin §2 + §5):
 *
 *   • The kernel was born of five (now six) sites that already shared
 *     the rung by accident of three independently-typed class strings
 *     plus two raw `border-fog/30` literals (`Threshold`, `KeepsakePlate`).
 *     The kernel names that paint can. If a future PR rewrites one
 *     site to drift against the others, the felt sentence ("the room
 *     has a single hand drawing its frames") fragments by 1px.
 *
 *   • Per-site `*.alpha.test.ts` files pin the *outcome* of the
 *     lookup (the wire-format string `border-fog/30`). This fence
 *     pins the *positive shape* — every migrated site reads the SAME
 *     `chromeMutedBorder()` literal — so the rhythm cannot drift back
 *     even if the per-file lookup test is later rewritten.
 *
 *   • The grandfather list ONLY shrinks. This fence makes that promise
 *     structural for the chrome register's six sites: removing them
 *     from the list is paired with pinning their migrated text.
 *
 * Pure source-string lint. No DOM, no React render, no Jest jsdom
 * warmup. Each assertion ≤ 10 LoC; the whole fence ≤ 100 LoC of test
 * body.
 *
 * Credits: Mike K. (napkin §2 / §5 — fence shape, the per-site
 * `readFileSync` + grep pattern lifted from `gestures-call-site-
 * rhythm.test.ts`, the migration-receipt-as-fence discipline,
 * "Polymorphism is a killer" reminder); Tanya D. (UX §2 / §10 —
 * "five edges, one hand" — the felt sentence the fence makes
 * structurally true; the join-or-fork rule for any sixth surface);
 * Krystle C. (the rule-of-three timing and 5th-caller observation
 * that licensed the lift); Paul K. (risk #2 — byte-identical
 * concern this fence resolves); Elon M. (the photons-vs-doctrine
 * teardown; the cut-line that kept this a fence and not a Voice
 * Ledger entry); Sid (this lift; ≤ 10 LOC per helper, source-only,
 * no jsdom dependency added).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { alphaClassOf } from '@/lib/design/alpha';
import { chromeMutedBorder, __testing__ } from '@/lib/design/chrome-paint';

const { SITES, FACTORY_CALL, EXEMPT_TOKEN } = __testing__;
const ROOT = join(__dirname, '..', '..', '..');

/** Read raw file source from project root — pure, ≤ 10 LoC. */
function readSite(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

/**
 * Strip `// chrome-paint:exempt — <reason>` lines so the drift-sweep
 * regex never flags an honestly-marked exemption. Pure, ≤ 10 LoC.
 */
function withoutExempt(src: string): string {
  return src
    .split('\n')
    .filter((line) => !line.includes(EXEMPT_TOKEN))
    .join('\n');
}

/**
 * Strip JSDoc / block / line comments — the drift sweep targets
 * runtime class strings, not commentary that names the wire format
 * for human readers. Same shape as `nav-voice-adoption.test.ts`.
 * Pure, ≤ 10 LoC.
 */
function stripComments(src: string): string {
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/[^\n]*/g, '$1');
}

// ─── 1 · Per-site source grep — every site reads `chromeMutedBorder()` ────

describe('chrome-paint — every site spells the factory call verbatim', () => {
  SITES.forEach((rel) => {
    it(`${rel} reads chromeMutedBorder() in source`, () => {
      expect(readSite(rel)).toContain(FACTORY_CALL);
    });
  });
});

// ─── 2 · Import seam — every site imports the kernel from one path ────────

describe('chrome-paint — every site imports from the canonical seam', () => {
  it('every site imports chromeMutedBorder from `@/lib/design/chrome-paint`', () => {
    SITES.forEach((rel) => {
      const src = readSite(rel);
      const imp =
        /import\s*\{[^}]*\bchromeMutedBorder\b[^}]*\}\s*from\s*['"](?:@\/lib\/design\/chrome-paint|\.\.?\/[\w./-]*chrome-paint)['"]/;
      expect(src).toMatch(imp);
    });
  });
});

// ─── 3 · Drift sweep — no bare `border-fog/30` literals at the call sites ─

describe('chrome-paint — migrated sites carry zero raw `border-fog/30` literals', () => {
  /** Match raw `border-fog/<N>` literals at the muted/hairline rungs. */
  const DRIFT_RX = /\bborder-fog\/(?:20|30)\b/g;

  SITES.forEach((rel) => {
    it(`${rel} contains no raw border-fog/30 outside an exempt token`, () => {
      // 1. Strip exempt-token lines (honest carve-outs).
      // 2. Strip comments — the wire format is named there for humans.
      const swept = stripComments(withoutExempt(readSite(rel)));
      const hits = Array.from(swept.matchAll(DRIFT_RX)).map((m) => m[0]);
      expect(hits).toEqual([]);
    });
  });
});

// ─── 4 · Byte-identity — kernel == ledger == wire format ──────────────────

describe('chrome-paint — kernel resolves to the on-ledger literal', () => {
  it('chromeMutedBorder() === alphaClassOf("fog","muted","border")', () => {
    expect(chromeMutedBorder()).toBe(alphaClassOf('fog', 'muted', 'border'));
  });

  it('chromeMutedBorder() === literal `border-fog/30` (the wire format)', () => {
    expect(chromeMutedBorder()).toBe('border-fog/30');
  });

  it('SITES has at least the five chrome surfaces named in the napkin', () => {
    // Acceptance criterion #5 (Mike §8): the kernel's site list teaches
    // a contributor *which* five surfaces share the register in 60s.
    expect(SITES.length).toBeGreaterThanOrEqual(5);
  });
});
