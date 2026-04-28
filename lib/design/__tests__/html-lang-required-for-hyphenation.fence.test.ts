/**
 * HTML `<html lang>` required-for-hyphenation — root-document invariant pin.
 *
 * Background. `hyphens: auto` is a **lang-bound** CSS property. A user
 * agent without a hyphenation dictionary for the document's language
 * silently no-ops. The dictionary lookup keys on the `<html lang="…">`
 * attribute on the root document. Without that byte, `hyphens: auto` on
 * `.typo-hyphens-passage` is a paint-time placebo — the rule applies; the
 * UA shrugs; the long word still strands.
 *
 * Today (2026-04-28) `<html lang="en">` lives at `app/layout.tsx:34`.
 * This fence pins the byte. If a future refactor moves the layout, drops
 * the attribute, or sets it to an empty string, this test reds and names
 * the regression in failure-message-is-documentation form (Mike #38 §4).
 *
 * One-line invariant — Elon §3 (no cosmology, no sub-ledger):
 *
 *   `app/layout.tsx` declares `<html lang="…">` where the value is a non-
 *   empty ISO-language token (BCP 47 stem at minimum: `^[a-z]{2,3}…`).
 *
 * Pure-source assertion — does NOT spin up React. Reads the file from
 * disk and parses with one regex. Reviewer muscle memory unchanged.
 *
 * Why a separate fence (not folded into the convergence fence):
 *   - The convergence fence pins three carrier files; this pins the root
 *     document. Different perimeter, different blast radius.
 *   - When this reds, every paragraph on every screen loses hyphenation
 *     simultaneously. Naming the root cause beats three carrier failures.
 *
 * Credits: Jason F. (Creative Director #86 — surfaced the lang-binding as
 * a first-class artifact deserving its own pin), Elon Musk (§3 — kept the
 * pin honest: "lang-binding is real, doctrine is not"; one-line invariant,
 * no cosmology), Mike Koch (architect napkin §3.3 — the explicit decision
 * to ship a separate fence rather than merge into convergence; the failure-
 * message-is-documentation framing), Tanya Donska (UX §4 — the lang-bound
 * carve-out table that documents which surfaces refuse hyphenation), Sid
 * (≤ 10 LoC per helper, source-truthfulness doctrine, no-renderer fence
 * pattern lifted from the convergence fences).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');
const LAYOUT_REL = 'app/layout.tsx';

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** Read the root layout source. ≤ 10 LoC. */
function readLayout(): string {
  return readFileSync(join(ROOT, LAYOUT_REL), 'utf8');
}

/** Extract the lang attribute value from `<html lang="…">`. ≤ 10 LoC. */
function extractHtmlLang(src: string): string | undefined {
  const match = src.match(/<html\s+[^>]*lang\s*=\s*["']([^"']*)["']/);
  return match ? match[1] : undefined;
}

/** True iff a value looks like a BCP 47 language tag stem (`en`, `en-US`). */
function isIsoLangToken(v: string | undefined): boolean {
  if (!v || v.length === 0) return false;
  return /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(v);
}

// ─── §1 · The root document declares <html lang="…"> ───────────────────────

describe('html-lang required for hyphenation · §1 root document carries <html lang>', () => {
  it('app/layout.tsx contains a <html …> tag', () => {
    expect(readLayout()).toMatch(/<html\b/);
  });

  it('app/layout.tsx <html> tag declares a `lang` attribute', () => {
    // The attribute must be present, not implicit. UA hyphenation dictionary
    // lookup keys on this attribute on the root element.
    expect(extractHtmlLang(readLayout())).toBeDefined();
  });

  it('app/layout.tsx `lang` value is a non-empty ISO-language token', () => {
    // BCP 47 stem at minimum (e.g. `en`, `en-US`). An empty string makes
    // `hyphens: auto` a paint-time placebo — the rule applies, the UA
    // shrugs, the long word still strands. Failure-message-is-documentation:
    // when this reds, the fix is "set lang to a real ISO token."
    const lang = extractHtmlLang(readLayout());
    expect(isIsoLangToken(lang)).toBe(true);
  });
});

// ─── §2 · The lang attribute is the lookup key, not a placeholder ─────────

describe('html-lang required for hyphenation · §2 the byte is load-bearing', () => {
  it('isIsoLangToken correctly accepts BCP 47 stems and rejects junk', () => {
    // Sanity-check the parser so a future refactor of the helper does not
    // silently widen the fence. Pure unit on the predicate above.
    expect(isIsoLangToken('en')).toBe(true);
    expect(isIsoLangToken('en-US')).toBe(true);
    expect(isIsoLangToken('zh-Hant')).toBe(true);
    expect(isIsoLangToken('')).toBe(false);
    expect(isIsoLangToken(undefined)).toBe(false);
    expect(isIsoLangToken('???')).toBe(false);
  });
});
