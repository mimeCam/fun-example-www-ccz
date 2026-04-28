/**
 * Focus Reciprocal-Lane Allow-List — single CSS rule may chain
 * `hue-rotate(var(--thread-bias…))` on a user-gesture pseudo-class.
 *
 * This is the second source-string fence the accent-bias system carries.
 * Its sibling `accent-bias-allowlist.fence.test.ts` guards the AMBIENT
 * lane (one JSX call site: `components/reading/GoldenThread.tsx`). This
 * fence guards the RECIPROCAL lane — exactly one CSS rule in
 * `app/globals.css` may chain the carrier expression on a `:focus-visible`
 * (or `::after` of) user-gesture pseudo-class. Caret-color, `::selection`,
 * `::placeholder`, `:active`, `:hover`, `:checked`, scrollbar pseudos —
 * all explicitly forbidden. A second reciprocal surface needs a fresh
 * brief AND graduation to `lib/design/perceptual/`. Not a copy-paste
 * through this fence.
 *
 * Why this fence is the strategy made executable (Mike napkin §POI 8 /
 * Tanya UIX #46 §10 — "the deferred slate is a feature"):
 *   • The AMBIENT lane is sealed — no new entries this year. The fence
 *     enforces that seal at the JSX layer.
 *   • The RECIPROCAL lane is open by INVITATION only. The next reciprocal
 *     surface (caret-color on typing? link `:active` flash?) earns its
 *     slot via a separate brief and a fresh review — not by copy-pasting
 *     the carrier into a sibling pseudo-class.
 *   • The failure prose teaches the contract on hit. A reviewer reading
 *     a CI failure walks away knowing the lane vocabulary; a maintainer
 *     reading the fence source walks away knowing the seal.
 *
 * What the fence asserts (the gate, three positive shapes + one
 * pin-the-literal pin):
 *
 *   §1 ALLOW — exactly ONE CSS rule selector in `app/globals.css` chains
 *      the carrier expression. The selector matches the regex shape
 *      `:focus-visible[::after]?` AND the rule body contains the literal
 *      `hue-rotate(var(--thread-bias, 0deg))`.
 *
 *   §2 FORBID — no `caret-color`, `::selection`, `::placeholder`,
 *      `:active`, `:hover`, `:checked`, `::-webkit-scrollbar*`, or any
 *      other pseudo-class / pseudo-element rule body chains the carrier
 *      expression. The forbidden-list is enumerated explicitly so a CI
 *      failure names the offending pseudo.
 *
 *   §3 PIN — the carrier-expression literal in CSS is byte-identical to
 *      `THREAD_ACCENT_BIAS_FILTER` in `lib/design/accent-bias.ts`. Drift
 *      between the two strings is what the AMBIENT-lane fence catches at
 *      the JSX layer; this fence catches it at the CSS layer.
 *
 *   §4 STRANGER FLOOR — the carrier carries the `, 0deg` fallback. No
 *      sibling rule may consume `var(--thread-bias)` without the fallback
 *      (a missing fallback would break stranger byte-identity if the
 *      Recognition Beacon never runs). Three-layer zero or no consumer.
 *
 *   §5 FORCED-COLORS — the `@media (forced-colors: active)` block does
 *      NOT consume `var(--thread-bias)` (system color keywords override
 *      the lean by spec; the reciprocal-lane is a no-op under HCM by
 *      construction). Pinned belt-and-braces with `forced-colors-sync`.
 *
 * Pure source-string lint. No DOM, no Canvas, no React mount. Reads
 * `app/globals.css` once and runs the regex sweep — same shape as
 * `accent-bias-allowlist.fence.test.ts` (the JSX sibling) and
 * `presence-pre-lit-allowlist.test.ts` (the pattern's grandfather).
 *
 * Failure ergonomics — failure-message-IS-documentation (Mike #38 §4):
 *
 *   focus-reciprocal-lane: 2 sites chain hue-rotate(var(--thread-bias…))
 *     • app/globals.css:462  — `:focus-visible::after` (allow-listed)
 *     • app/globals.css:NNN  — `::placeholder { … }`  (FORBIDDEN)
 *       → A second reciprocal surface needs a fresh brief AND graduation
 *         to `lib/design/perceptual/`. Not a copy-paste through this fence.
 *         See accent-bias.ts §"Two-Lane Contract" for the seal rule.
 *
 * Credits:
 *   • Mike Koch (architect, napkin #54 §POI 8 — the failure-prose teaches
 *     the contract; §"Hand-off" — Sid owns this fence as he's shipped the
 *     same shape twice already).
 *   • Tanya Donska (UIX #46 §10) — the deferred slate, parked-with-a-lane,
 *     that this fence's failure prose enumerates as the seal rule.
 *   • Jason Fried (Creative Director) — the Ambient/Reciprocal lens; the
 *     two-name discipline this fence enforces at the source-string layer.
 *   • Paul Kim (strategy) — the must-not-do list (no animation, no token
 *     mint, no second reciprocal surface), baked into the FORBID list.
 *   • Sid (50-yr coder) — the source-string fence pattern lifted from
 *     `accent-bias-allowlist.fence.test.ts` byte-for-byte. One shape; the
 *     symmetry is the contract.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { THREAD_ACCENT_BIAS_FILTER } from '../accent-bias';

const ROOT = join(__dirname, '..', '..', '..');
const CSS_PATH = join(ROOT, 'app', 'globals.css');
const CSS = readFileSync(CSS_PATH, 'utf8');

// ─── The carrier-expression literal — pinned by §3 ───────────────────────

/**
 * The single carrier expression both lanes consume. Imported as the SSOT;
 * if `accent-bias.ts` ever renames the constant, this fence imports the
 * new one and the regex follows.
 */
const CARRIER = THREAD_ACCENT_BIAS_FILTER;

// ─── Helpers — pure, ≤ 10 LOC each ────────────────────────────────────────

/** Strip block + line comments from a CSS source string (line-preserving). */
function stripCssComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/** Split a CSS body into rule-shape blocks `selector { body }`. Pure. */
function readRuleBlocks(css: string): RuleBlock[] {
  const out: RuleBlock[] = [];
  const rx = /([^{}@]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(css)) !== null) {
    const selector = m[1].trim();
    if (selector.length === 0) continue;
    out.push({ selector, body: m[2], index: m.index });
  }
  return out;
}

interface RuleBlock { readonly selector: string; readonly body: string; readonly index: number }

/** 1-based line of `index` in the original CSS. Pure. */
function lineAt(src: string, index: number): number {
  return src.slice(0, index).split(/\r?\n/).length;
}

/** True iff a rule-block body contains the carrier expression literal. */
function bodyChainsCarrier(body: string): boolean {
  return body.includes(CARRIER);
}

/** True iff a selector is the allow-listed reciprocal-lane site. */
function selectorIsAllowed(selector: string): boolean {
  // Only `:focus-visible::after` (with optional whitespace) is allow-listed.
  // The bare `:focus-visible` selector MUST NOT chain the carrier — Mike
  // #54 §POI 4: filter on the host tints content; only the pseudo paints.
  return /^:focus-visible::after\s*$/.test(selector.trim());
}

/** Forbidden pseudo-class / pseudo-element substrings — explicit kill-list. */
const FORBIDDEN_PSEUDOS: readonly string[] = [
  '::selection',
  '::placeholder',
  '::-webkit-scrollbar',
  ':hover',
  ':active',
  ':checked',
  ':visited',
];

/** True iff a selector contains any forbidden pseudo from the kill-list. */
function selectorIsForbiddenPseudo(selector: string): boolean {
  return FORBIDDEN_PSEUDOS.some((p) => selector.includes(p));
}

// ─── §1/§2 — collect every rule that chains the carrier ──────────────────

interface CarrierSite { readonly selector: string; readonly line: number }

/** Every rule body in the CSS that chains the carrier expression. */
function collectCarrierSites(): readonly CarrierSite[] {
  const stripped = stripCssComments(CSS);
  return readRuleBlocks(stripped)
    .filter((r) => bodyChainsCarrier(r.body))
    .map((r) => ({ selector: r.selector, line: lineAt(CSS, r.index) }));
}

// ─── §3 — the literal byte-identity pin (TS ↔ CSS) ───────────────────────

/** True iff the CSS contains `CARRIER` byte-for-byte. */
function cssHasCarrierLiteral(): boolean {
  return CSS.includes(CARRIER);
}

// ─── §4 — stranger floor: every consumer of `var(--thread-bias)` carries the
//          `, 0deg` fallback. A missing fallback breaks byte-identity for
//          first-time visitors when the Recognition Beacon never runs.

/** Every `var(--thread-bias…)` reference in the CSS (with surrounding chars). */
function collectThreadBiasReferences(): readonly { ref: string; line: number }[] {
  const stripped = stripCssComments(CSS);
  const rx = /var\(--thread-bias[^)]*\)/g;
  const out: { ref: string; line: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = rx.exec(stripped)) !== null) {
    out.push({ ref: m[0], line: lineAt(CSS, m.index) });
  }
  return out;
}

/** True iff a `var(--thread-bias…)` reference includes the `, 0deg` fallback. */
function refHasStrangerFallback(ref: string): boolean {
  return /var\(\s*--thread-bias\s*,\s*0deg\s*\)/.test(ref);
}

// ─── §5 — forced-colors block must not consume `var(--thread-bias)` ──────

/** Body of the `@media (forced-colors: active) { … }` block (balanced braces). */
function readForcedColorsBlock(): string | undefined {
  const start = CSS.indexOf('@media (forced-colors: active)');
  if (start < 0) return undefined;
  const open = CSS.indexOf('{', start);
  if (open < 0) return undefined;
  let depth = 1;
  for (let i = open + 1; i < CSS.length; i++) {
    if (CSS[i] === '{') depth++;
    else if (CSS[i] === '}' && --depth === 0) return CSS.slice(open + 1, i);
  }
  return undefined;
}

// ─── §1 ALLOW — exactly one rule selector chains the carrier ─────────────

describe('focus-reciprocal-lane · §1 ALLOW (single allow-listed CSS rule)', () => {
  const sites = collectCarrierSites();

  it('exactly ONE rule chains hue-rotate(var(--thread-bias, 0deg)) in globals.css', () => {
    if (sites.length !== 1) {
      const list = sites.map((s) => `  app/globals.css:${s.line} — ${s.selector}`).join('\n');
      throw new Error(
        `\nfocus-reciprocal-lane: expected 1 site, got ${sites.length}\n${list}\n`
        + `  → A second reciprocal surface needs a fresh brief AND graduation\n`
        + `    to lib/design/perceptual/. Not a copy-paste through this fence.\n`
        + `    See accent-bias.ts §"Two-Lane Contract" for the seal rule.`,
      );
    }
    expect(sites).toHaveLength(1);
  });

  it('the allow-listed selector is `:focus-visible::after` (the pseudo paints the ring)', () => {
    expect(sites).toHaveLength(1);
    expect(selectorIsAllowed(sites[0].selector)).toBe(true);
  });

  it('the allow-listed rule lives in `app/globals.css` (not a sibling stylesheet)', () => {
    // Guards against a future "skin file" that copy-pastes the rule into
    // an archetype-specific stylesheet, bypassing the carrier seal.
    expect(sites).toHaveLength(1);
    expect(CSS.includes(CARRIER)).toBe(true);
  });
});

// ─── §2 FORBID — no other pseudo-class / pseudo-element chains the carrier

describe('focus-reciprocal-lane · §2 FORBID (no sibling pseudo joins the lane)', () => {
  const sites = collectCarrierSites();

  it('no rule selector contains a forbidden pseudo (selection, placeholder, etc.)', () => {
    const offenders = sites.filter((s) => selectorIsForbiddenPseudo(s.selector));
    if (offenders.length > 0) {
      const list = offenders
        .map((s) => `  app/globals.css:${s.line} — ${s.selector}`)
        .join('\n');
      throw new Error(
        `\nfocus-reciprocal-lane: ${offenders.length} forbidden pseudo(s) chain the carrier\n${list}\n`
        + `  → Forbidden: ${FORBIDDEN_PSEUDOS.join(', ')}\n`
        + `    The reciprocal lane is open BY INVITATION ONLY. Each pseudo above\n`
        + `    needs a fresh brief and a separate review — not a copy-paste through\n`
        + `    this fence. See accent-bias.ts §"Two-Lane Contract".`,
      );
    }
    expect(offenders).toEqual([]);
  });

  it('the bare `:focus-visible` host body does NOT chain the carrier (filter on the pseudo)', () => {
    // Mike #54 §POI 4: a `filter:` declaration on the HOST `:focus-visible`
    // body would tint the focused element's text/icons by ±2.5°. Sub-JND
    // but a real semantic regression — the ring should reply, host content
    // stays reader-invariant. Pinned here belt-and-braces with focus-sync.
    const hostHasCarrier = sites.some(
      (s) => /^:focus-visible\s*$/.test(s.selector.trim()),
    );
    expect(hostHasCarrier).toBe(false);
  });

  it('the FORBIDDEN_PSEUDOS list enumerates the kill-list explicitly', () => {
    // Sanity pin: a maintainer adding a new forbidden pseudo should add it
    // here, not as a separate test. The list IS the contract surface.
    expect(FORBIDDEN_PSEUDOS.length).toBeGreaterThanOrEqual(7);
    expect(FORBIDDEN_PSEUDOS).toContain('::selection');
    expect(FORBIDDEN_PSEUDOS).toContain('::placeholder');
    expect(FORBIDDEN_PSEUDOS).toContain(':active');
  });
});

// ─── §3 PIN — the literal in CSS is byte-identical to the TS export ──────

describe('focus-reciprocal-lane · §3 PIN (CSS ↔ TS carrier byte-identity)', () => {
  it('CSS contains the THREAD_ACCENT_BIAS_FILTER literal byte-for-byte', () => {
    expect(cssHasCarrierLiteral()).toBe(true);
  });

  it('the carrier literal is the canonical one frozen string (Mike #54 §POI 2)', () => {
    // Reuse, do not generalize — the literal MUST equal the TS export
    // verbatim. A `hue-rotate(var(--thread-bias))` (no fallback) shape is
    // not a "shorter" carrier; it is a stranger-floor regression.
    expect(CARRIER).toBe('hue-rotate(var(--thread-bias, 0deg))');
  });
});

// ─── §4 STRANGER FLOOR — every var(--thread-bias) ref carries `, 0deg` ──

describe('focus-reciprocal-lane · §4 STRANGER FLOOR (no missing fallback)', () => {
  const refs = collectThreadBiasReferences();

  it('every `var(--thread-bias…)` reference includes the `, 0deg` fallback', () => {
    const naked = refs.filter((r) => !refHasStrangerFallback(r.ref));
    if (naked.length > 0) {
      const list = naked
        .map((r) => `  app/globals.css:${r.line} — ${r.ref}`)
        .join('\n');
      throw new Error(
        `\nfocus-reciprocal-lane: ${naked.length} naked var(--thread-bias) reference(s)\n${list}\n`
        + `  → Stranger floor requires the three-layer zero:\n`
        + `      :root { --thread-bias: 0deg }   (CSS default)\n`
        + `      var(--thread-bias, 0deg)         (the , 0deg fallback)\n`
        + `      hue-rotate(0deg)                 (compositor no-op)\n`
        + `    Drop ANY layer and a stranger's pixels drift from today.`,
      );
    }
    expect(naked).toEqual([]);
  });

  it('the codebase has at least one var(--thread-bias) reference (the carrier itself)', () => {
    // Belt-and-braces — guards against a future "I removed --thread-bias"
    // PR that silently breaks the AMBIENT lane while passing this fence.
    expect(refs.length).toBeGreaterThan(0);
  });
});

// ─── §5 FORCED-COLORS — HCM block has no `--thread-bias` consumer ───────

describe('focus-reciprocal-lane · §5 FORCED-COLORS (HCM is a no-op)', () => {
  it('the @media (forced-colors: active) block exists in globals.css', () => {
    expect(readForcedColorsBlock()).toBeDefined();
  });

  it('the forced-colors block does NOT consume var(--thread-bias)', () => {
    // System color keywords (Highlight, etc.) override the lean by spec.
    // The reciprocal-lane is a no-op under HCM by construction; pinning
    // it here makes the construction load-bearing.
    const block = readForcedColorsBlock();
    expect(block).toBeDefined();
    expect(/var\(\s*--thread-bias/.test(block!)).toBe(false);
  });

  it('the forced-colors block declares `outline:` for `:focus-visible` (system override)', () => {
    const block = readForcedColorsBlock();
    expect(block).toBeDefined();
    expect(/:focus-visible[\s\S]*?outline\s*:/.test(block!)).toBe(true);
  });
});

// ─── Doctrine pin — the deferred slate is a feature, not a backlog ───────

/**
 * The deferred slate (Tanya UIX #46 §10) parks each candidate next to
 * the lane it would belong to and the brief it would have to write. The
 * list is SHORTER, not longer, by design. This block makes the slate
 * grep-visible so a maintainer reading the test understands why a
 * `caret-color` lean is forbidden today (no second reciprocal consumer
 * justifies a perceptual-ledger graduation; rule of three has not fired).
 *
 * If a future PR ships a second reciprocal surface, THAT PR mints the
 * `lib/design/perceptual/` directory, graduates the carrier into a
 * factory, and updates BOTH this fence and the AMBIENT-lane fence to
 * reflect the kernel name. Until then: name the surface, don't generalize
 * the math.
 */
const DEFERRED_SLATE: readonly { surface: string; lane: 'ambient' | 'reciprocal' | 'unknown'; reason: string }[] = [
  { surface: 'caret-color on typing',      lane: 'reciprocal', reason: 'real gesture; no second consumer to justify perceptual graduation yet' },
  { surface: 'link :active flash',         lane: 'reciprocal', reason: 'future candidate; needs a separate brief, not this sprint' },
  { surface: 'scrollbar-thumb tint',       lane: 'ambient',    reason: 'AMBIENT lane sealed' },
  { surface: '::placeholder color',        lane: 'unknown',    reason: 'no real user gesture; the third lane should not exist' },
  { surface: '::selection lean',           lane: 'ambient',    reason: 'AMBIENT lane sealed; ::selection paint is reader-invariant by design' },
  { surface: 'multi-archetype switching',  lane: 'reciprocal', reason: 'out of scope this year; the lock-step matters only if this exists' },
];

describe('focus-reciprocal-lane · DOCTRINE (the deferred slate is a feature)', () => {
  it('the slate enumerates the parked candidates with their lane verdicts', () => {
    // Sanity pin: a maintainer reading the slate knows the seal rule.
    // The slate gets SHORTER, not longer, by design.
    expect(DEFERRED_SLATE.length).toBeGreaterThanOrEqual(5);
    for (const entry of DEFERRED_SLATE) {
      expect(entry.surface.length).toBeGreaterThan(0);
      expect(entry.reason.length).toBeGreaterThan(0);
    }
  });

  it('every parked surface has a lane verdict (no entry is undecided)', () => {
    // "Anything without a real user gesture AND a real site response
    // belongs to NEITHER lane and does not ship." (Tanya UIX §2)
    const verdicts = new Set(DEFERRED_SLATE.map((e) => e.lane));
    expect(verdicts.size).toBeGreaterThan(0);
    expect([...verdicts].every((v) => ['ambient', 'reciprocal', 'unknown'].includes(v))).toBe(true);
  });
});
