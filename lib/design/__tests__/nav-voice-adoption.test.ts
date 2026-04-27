/**
 * Nav-Voice Adoption — drift fence + ledger-coverage audit for the
 * navigation chrome (`GemHome`, `AmbientNav`, `NavPulseDot`).
 *
 * Mike napkin #90 §5 #1 — the fence is the deliverable, not the refactor.
 * Without this audit the next PR re-introduces the `text-mist/20` /
 * `text-gold/60` / `text-gold/80` / per-route hover literals tomorrow.
 * This file mirrors `chip-to-keepsake-audit.test.ts` — same shape, same
 * grep approach, same exhaustive-Record assertion.
 *
 * What it audits:
 *
 *   1. **Component sources are literal-free** — `GemHome.tsx` and
 *      `AmbientNav.tsx` contain ZERO `text-(mist|gold|rose|fog)/<N>`
 *      Tailwind literals (after stripping comments). The paint dialect
 *      lives in `lib/design/nav-paint.ts`, not in the components.
 *      AmbientNav's chassis fence is widened (Mike #110, Tanya UIX #43)
 *      to also forbid `bg-void/<N>` and `border-fog/<N>` literals — the
 *      bottom-bar frame now routes through `navBarChassis()`, with the
 *      scrim's exempt token living inside the resolver.
 *
 *   2. **Resolver paints every licensed family** — for each of `gem` /
 *      `nav` / `navPulseDot`, the families resolved at runtime by the
 *      paint helpers cover the families licensed in `VOICE_LEDGER`.
 *      No voice ships without a runtime emitter; no emitter ships
 *      without a license.
 *
 *   3. **State → className snapshot** — pin the `(state, quiet)` map
 *      for the gem and the `(href)` map for the nav. Drift becomes a
 *      deliberate review (snapshot diff), not a silent regression.
 *
 *   4. **Ledger row shape** — the three new Surface members are present,
 *      their voice rows are non-empty, and every voice resolves to a
 *      Tailwind family AND a CSS custom property. (Mike napkin #90 §1
 *      "exhaustive `Record<Surface, readonly Voice[]>` shape.")
 *
 * Verify-on-introduction: insert a raw `text-gold/40` into `GemHome.tsx`
 * → this test goes red (Tanya UX #42 §5 #2 — the fence must fail when a
 * literal is reintroduced; demonstrated by the section-1 grep test).
 *
 * Credits: Mike K. (napkin #90 — fence-shape, "polymorphism is a killer"
 * with `Record<Surface, readonly Voice[]>` discipline, audit-as-deliverable
 * framing); Tanya D. (UX #42 §5 — acceptance criteria 1–4, the literal-
 * free / rung-snap / pair-rule trio this test enforces); Paul K. (#100 —
 * carrier-wave purity outcome); Elon M. (#53 §3 — global → chrome → page
 * ordering, plain-English).
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  licenseFor,
  familiesFor,
  tailwindFamilyOf,
  cssVarOf,
  VOICE_LEDGER,
  type Surface,
  type Voice,
} from '../voice-ledger';
import {
  gemPaint,
  gemShadow,
  navBarChassis,
  navItemPaint,
  navItemActivePaint,
} from '../nav-paint';
import type { ThermalState } from '@/lib/thermal/thermal-score';

// ─── Tiny pure helpers — ≤ 10 LOC each ─────────────────────────────────────

const ROOT = path.join(__dirname, '..', '..', '..');

/** Read source file from repo root — components consumed by source. */
function readSource(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

/** Strip block comments + JSX comments — voice grep should not flag prose. */
function stripComments(src: string): string {
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')   // JSX block comments
    .replace(/\/\*[\s\S]*?\*\//g, '')       // JS block comments
    .replace(/(^|\s)\/\/[^\n]*/g, '$1');     // line comments
}

/** Pull every Tailwind family literal (e.g. 'gold', 'mist') out of a class string. */
function familiesIn(src: string): Set<string> {
  const RX = /\b(?:bg|text|border|shadow)-([a-z]+)(?:\/\d+)?\b/g;
  const found = new Set<string>();
  for (const m of src.matchAll(RX)) found.add(m[1]);
  return found;
}

/**
 * Match a TEXT-color-alpha literal (`text-mist/20` style); used by §1
 * fence on `text-` paint dialect. The paint-dialect graduation (Mike #90)
 * moved these literals into `nav-paint.ts`.
 */
const COLOR_ALPHA_LITERAL_RX =
  /\btext-(?:mist|gold|rose|fog)\/\d+\b/g;

/**
 * Match a CHROME-FRAME literal — `bg-void/<N>` or `border-fog/<N>`. Used
 * by §1 fence on `AmbientNav.tsx` only; the chassis graduation (Mike #110
 * §4 + Tanya UIX #43) moved both literals into `navBarChassis()` inside
 * `nav-paint.ts`. The hairline now routes through `alphaClassOf`; the
 * scrim earns an inline `// alpha-ledger:exempt — structural scrim`
 * token at the resolver's call site (Elon #80 option (a)).
 *
 * NOT widened to other files this sprint — the remaining grandfathered
 * paths come off the list one by one (Mike #110 §6, "no while-we're-in-
 * there for the other 19 grandfathered files").
 */
const CHROME_FRAME_LITERAL_RX =
  /\b(?:bg-void|border-fog)\/\d+\b/g;

/** Closed list of every thermal state, for resolver enumeration. */
const ALL_STATES: readonly ThermalState[] =
  ['dormant', 'stirring', 'warm', 'luminous'] as const;

/** Closed list of every nav route the audit pins. */
const NAV_ROUTES = ['/', '/articles', '/mirror', '/resonances'] as const;

// ─── 1 · Components are literal-free — drift fence ─────────────────────────

describe('navigation chrome — no raw color-alpha literals in component source', () => {
  const gemSrc = stripComments(readSource('components/navigation/GemHome.tsx'));
  const navSrc = stripComments(readSource('components/navigation/AmbientNav.tsx'));
  const dotSrc = stripComments(readSource('components/navigation/NavPulseDot.tsx'));

  it('GemHome.tsx contains zero `text-(mist|gold|rose|fog)/<N>` literals', () => {
    const hits = Array.from(gemSrc.matchAll(COLOR_ALPHA_LITERAL_RX)).map((m) => m[0]);
    expect(hits).toEqual([]);
  });

  it('AmbientNav.tsx contains zero `text-(mist|gold|rose|fog)/<N>` literals', () => {
    const hits = Array.from(navSrc.matchAll(COLOR_ALPHA_LITERAL_RX)).map((m) => m[0]);
    expect(hits).toEqual([]);
  });

  it('AmbientNav.tsx contains zero `bg-void/<N>` or `border-fog/<N>` literals', () => {
    // Chassis fence (Mike #110 §4 + Tanya UIX #43): both the scrim and the
    // hairline now route through `navBarChassis()` in `nav-paint.ts`. The
    // component should grep clean for both chrome-frame literals — the
    // scrim's exempt token lives at the resolver, not here.
    const hits = Array.from(navSrc.matchAll(CHROME_FRAME_LITERAL_RX)).map((m) => m[0]);
    expect(hits).toEqual([]);
  });

  it('NavPulseDot.tsx contains zero Tailwind text-color literals (CSS-only)', () => {
    const hits = Array.from(dotSrc.matchAll(/\btext-[a-z]+(?:\/\d+)?\b/g)).map((m) => m[0]);
    expect(hits).toEqual([]);
  });

  it('GemHome.tsx imports the paint resolver from `lib/design/nav-paint`', () => {
    const raw = readSource('components/navigation/GemHome.tsx');
    expect(raw).toContain("from '@/lib/design/nav-paint'");
    expect(raw).toMatch(/\bgemPaint\b/);
    expect(raw).toMatch(/\bgemShadow\b/);
  });

  it('AmbientNav.tsx imports the paint resolver from `lib/design/nav-paint`', () => {
    const raw = readSource('components/navigation/AmbientNav.tsx');
    expect(raw).toContain("from '@/lib/design/nav-paint'");
    expect(raw).toMatch(/\bnavBarChassis\b/);
    expect(raw).toMatch(/\bnavItemPaint\b/);
    expect(raw).toMatch(/\bnavItemActivePaint\b/);
  });
});

// ─── 2 · Resolver paints every licensed family for each surface ───────────

describe('nav-paint resolver — runtime paint covers the surface license', () => {
  /** Families resolved by `gemPaint` across every (state, quiet) tuple. */
  function gemFamilies(): Set<string> {
    const out = new Set<string>();
    ALL_STATES.forEach((s) => {
      [false, true].forEach((q) => familiesIn(gemPaint(s, q)).forEach((f) => out.add(f)));
    });
    return out;
  }

  /** Families resolved by `navItemPaint` across every known route. */
  function navFamilies(): Set<string> {
    const out = new Set<string>();
    NAV_ROUTES.forEach((r) => familiesIn(navItemPaint(r)).forEach((f) => out.add(f)));
    return out;
  }

  it('gem resolver paints every family the `gem` license names', () => {
    const licensed = familiesFor('gem');
    gemFamilies().forEach((f) => expect(licensed.has(f)).toBe(true));
  });

  it('every family in the `gem` license is reached by some (state, quiet) tuple', () => {
    const reached = gemFamilies();
    familiesFor('gem').forEach((f) => expect(reached.has(f)).toBe(true));
  });

  it('nav resolver paints every family the `nav` license names (modulo CSS-only `accent`)', () => {
    const licensed = familiesFor('nav');
    // `accent` is painted via the active-state CSS class
    // (`.nav-active-link` → `var(--token-accent)`). Tailwind side covers
    // the four hover voices; verify the inactive + four hover voices.
    const reached = navFamilies();
    reached.forEach((f) => expect(licensed.has(f)).toBe(true));
  });

  it('nav active resolver returns the on-ledger `.nav-active-link` class', () => {
    expect(navItemActivePaint()).toBe('nav-active-link');
  });

  it('navPulseDot is CSS-only — license is exactly { thermal.accent }', () => {
    expect(licenseFor('navPulseDot')).toEqual(['thermal.accent']);
  });
});

// ─── 3 · State → className snapshot — drift becomes a deliberate review ───

describe('nav-paint — (state, quiet) → className snapshot', () => {
  it('gemPaint (state, quiet) map is byte-pinned', () => {
    const matrix: Record<string, string> = {};
    ALL_STATES.forEach((s) => {
      matrix[`${s}|quiet=false`] = gemPaint(s, false);
      matrix[`${s}|quiet=true`] = gemPaint(s, true);
    });
    expect(matrix).toMatchSnapshot();
  });

  it('gemShadow (state, quiet) map is byte-pinned (luminous halo, all else bare)', () => {
    const matrix: Record<string, string> = {};
    ALL_STATES.forEach((s) => {
      matrix[`${s}|quiet=false`] = gemShadow(s, false);
      matrix[`${s}|quiet=true`] = gemShadow(s, true);
    });
    expect(matrix).toMatchSnapshot();
  });

  it('navItemPaint (route) map is byte-pinned', () => {
    const matrix: Record<string, string> = {};
    NAV_ROUTES.forEach((r) => { matrix[r] = navItemPaint(r); });
    expect(matrix).toMatchSnapshot();
  });

  it('navBarChassis() output is byte-pinned (chassis graduation)', () => {
    // Mike #110 §4e + Tanya UIX #43 §6.5: the chassis className is a
    // single string with a structural scrim and an on-ledger hairline.
    // Drift on either token (rung change, exempt-token loss, geometry
    // edit) becomes a deliberate review via the snapshot diff — never
    // a silent regression.
    expect(navBarChassis()).toMatchSnapshot();
  });
});

// ─── 4 · Ledger row shape — the three new Surface members exist ───────────

describe('voice-ledger — gem / nav / navPulseDot rows are well-formed', () => {
  const NEW_SURFACES: readonly Surface[] = ['gem', 'nav', 'navPulseDot'] as const;

  it.each(NEW_SURFACES)('VOICE_LEDGER has a non-empty row for `%s`', (s) => {
    expect(VOICE_LEDGER[s].length).toBeGreaterThan(0);
  });

  it.each(NEW_SURFACES)('every voice in the `%s` row resolves both address modes', (s) => {
    licenseFor(s).forEach((v: Voice) => {
      expect(tailwindFamilyOf(v).length).toBeGreaterThan(0);
      expect(cssVarOf(v).startsWith('--')).toBe(true);
    });
  });

  it('gem license is exactly { nav.dormant, nav.warmth }', () => {
    expect(licenseFor('gem')).toEqual(['nav.dormant', 'nav.warmth']);
  });

  it('nav license includes the four hover voices + thermal.accent for active', () => {
    const row = new Set<Voice>(licenseFor('nav'));
    expect(row.has('nav.dormant')).toBe(true);
    expect(row.has('nav.warmth')).toBe(true);
    expect(row.has('nav.hover-mist')).toBe(true);
    expect(row.has('nav.hover-rose')).toBe(true);
    expect(row.has('thermal.accent')).toBe(true);
  });

  it('navPulseDot license is exactly { thermal.accent } — CSS-only surface', () => {
    expect(licenseFor('navPulseDot')).toEqual(['thermal.accent']);
  });
});

// ─── 5 · Cross-surface invariant — nav voices stay in the nav row ─────────

describe('nav voices — nav.* atoms appear ONLY in nav-related Surface rows', () => {
  const NAV_VOICES: readonly Voice[] = [
    'nav.dormant', 'nav.warmth', 'nav.hover-mist', 'nav.hover-rose',
  ] as const;

  it.each(NAV_VOICES)('voice `%s` lives only on gem / nav surfaces', (v) => {
    const homes = (Object.keys(VOICE_LEDGER) as Surface[]).filter((s) =>
      VOICE_LEDGER[s].includes(v),
    );
    homes.forEach((h) => expect(['gem', 'nav']).toContain(h));
  });
});
