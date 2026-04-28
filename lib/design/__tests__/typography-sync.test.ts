/**
 * Typography Sync Test — CSS ↔ TS drift guard.
 *
 * Reads `app/globals.css`, parses every `--sys-lead-*` declaration plus
 * `--sys-tick`, asserts they match `TYPOGRAPHY` / `SYS_TICK_PX` exactly.
 * If someone edits a number in either mirror but not the other, this test
 * fails fast and names the beat.
 *
 * Mirrors the strategy of `motion-sync.test.ts`, `elevation-sync.test.ts`,
 * `color-constants-sync.test.ts`. No build step, no codegen — a plain
 * regex read from disk at test time.
 *
 * Mirror discipline: every beat in CSS appears in TS, every beat in TS
 * appears in CSS, leading values are integer multiples of `--sys-tick`,
 * and the per-beat `text-wrap` / `font-feature-settings` declarations in
 * the `.typo-<beat>` rules match the TS `wrap` / `kern` properties.
 *
 * Credits: Mike K. (the sync-test pattern, lifted from elevation/motion),
 * Krystle C. (six-beat lock, sprint shape), Elon M. (the integer-multiple
 * invariant — `--sys-tick * N` — that survived first principles), Tanya D.
 * (the per-beat wrap/kern lock so the polish details cannot drift),
 * Jason F. (the wrap+kern atoms whose presence this test enforces).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  TYPOGRAPHY,
  TYPOGRAPHY_ORDER,
  SYS_TICK_PX,
  TypographyBeatName,
  THERMAL_LEADING_VAR,
  THERMAL_TRACK_VAR,
  leadingOf,
  cssVarOf,
  classesOf,
  leadingClassOf,
  trackOf,
  cssTrackVarOf,
  trackingClassOf,
  isKerned,
  isBalanced,
  passageThermalClass,
  typographyInvariantHolds,
  wrapClassOf,
  hyphensClassOf,
  HYPHENATE_LIMIT_CHARS,
  hangPunctClassOf,
  HANGING_PUNCTUATION,
} from '../typography';

const CSS = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf-8');

// ─── Parser helpers — pure, each ≤ 10 LOC ─────────────────────────────────

/** Extract `--sys-tick: <n>px;` from the CSS. Returns numeric px. */
function readTick(): number | undefined {
  const match = CSS.match(/--sys-tick:\s*(\d+)px;/);
  return match ? Number(match[1]) : undefined;
}

/** Extract `--sys-lead-<name>: calc(var(--sys-tick) * <n>);` — returns N. */
function readLeadMultiplier(name: string): number | undefined {
  const rx = new RegExp(`--sys-lead-${name}:\\s*calc\\(var\\(--sys-tick\\)\\s*\\*\\s*(\\d+)\\)`);
  const match = CSS.match(rx);
  return match ? Number(match[1]) : undefined;
}

/** Extract `--sys-track-<name>: <n>em;` — returns em as a number. */
function readTrackEm(name: string): number | undefined {
  const rx = new RegExp(`--sys-track-${name}:\\s*(-?\\d*\\.?\\d+)em`);
  const match = CSS.match(rx);
  return match ? Number(Number(match[1]).toFixed(3)) : undefined;
}

/** Extract the body of a `.typo-<beat> { … }` block. */
function readTypoBlock(beat: string): string | undefined {
  const rx = new RegExp(`\\.typo-${beat}\\s*\\{([^}]*)\\}`);
  const match = CSS.match(rx);
  return match ? match[1] : undefined;
}

/** True iff a declaration block contains a given declaration. */
function blockHas(block: string | undefined, decl: RegExp): boolean {
  return Boolean(block && decl.test(block));
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('SYS_TICK ↔ globals.css --sys-tick sync', () => {
  it('--sys-tick exists in CSS and is a positive integer px', () => {
    const css = readTick();
    expect(css).toBeDefined();
    expect(css).toBeGreaterThan(0);
  });

  it('SYS_TICK_PX matches --sys-tick exactly', () => {
    expect(readTick()).toBe(SYS_TICK_PX);
  });
});

describe('TYPOGRAPHY ↔ globals.css --sys-lead-* sync', () => {
  TYPOGRAPHY_ORDER.forEach((beat) => {
    it(`TYPOGRAPHY.${beat}.leadN matches --sys-lead-${beat} multiplier`, () => {
      const cssN = readLeadMultiplier(beat);
      expect(cssN).toBeDefined();
      expect(cssN).toBe(TYPOGRAPHY[beat].leadN);
    });
  });

  it('every --sys-lead-* in CSS is represented in TYPOGRAPHY', () => {
    const cssBeats = Array.from(CSS.matchAll(/--sys-lead-([a-z]+):/g)).map((m) => m[1]);
    const tsBeats = Object.keys(TYPOGRAPHY);
    cssBeats.forEach((b) => expect(tsBeats).toContain(b));
  });

  it('all six tokens exist in CSS', () => {
    TYPOGRAPHY_ORDER.forEach((b) => expect(readLeadMultiplier(b)).toBeDefined());
  });
});

describe('TYPOGRAPHY ↔ globals.css --sys-track-* sync', () => {
  TYPOGRAPHY_ORDER.forEach((beat) => {
    it(`TYPOGRAPHY.${beat}.track matches --sys-track-${beat} (em)`, () => {
      const cssEm = readTrackEm(beat);
      expect(cssEm).toBeDefined();
      expect(cssEm).toBe(Number(TYPOGRAPHY[beat].track.toFixed(3)));
    });
  });

  it('every --sys-track-* in CSS is represented in TYPOGRAPHY', () => {
    const cssBeats = Array.from(CSS.matchAll(/--sys-track-([a-z]+):/g)).map((m) => m[1]);
    const tsBeats = Object.keys(TYPOGRAPHY);
    cssBeats.forEach((b) => expect(tsBeats).toContain(b));
  });

  it('all six track tokens exist in CSS', () => {
    TYPOGRAPHY_ORDER.forEach((b) => expect(readTrackEm(b)).toBeDefined());
  });
});

describe('TYPOGRAPHY structural invariants', () => {
  it('typographyInvariantHolds() is true', () => {
    expect(typographyInvariantHolds()).toBe(true);
  });

  it('every leadN is a positive integer (locked to the 4px tick)', () => {
    TYPOGRAPHY_ORDER.forEach((b) => {
      const n = TYPOGRAPHY[b].leadN;
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThan(0);
    });
  });

  it('order is non-decreasing tightest → loosest', () => {
    for (let i = 1; i < TYPOGRAPHY_ORDER.length; i++) {
      const prev = TYPOGRAPHY[TYPOGRAPHY_ORDER[i - 1]].leadN;
      const curr = TYPOGRAPHY[TYPOGRAPHY_ORDER[i]].leadN;
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it('caption is the tightest beat, display is the loosest', () => {
    expect(TYPOGRAPHY.caption.leadN).toBeLessThanOrEqual(TYPOGRAPHY.body.leadN);
    expect(TYPOGRAPHY.display.leadN).toBeGreaterThanOrEqual(TYPOGRAPHY.heading.leadN);
  });
});

describe('typography helpers', () => {
  it('leadingOf returns leadN × SYS_TICK_PX (px) for each beat', () => {
    TYPOGRAPHY_ORDER.forEach((b) => {
      expect(leadingOf(b)).toBe(TYPOGRAPHY[b].leadN * SYS_TICK_PX);
    });
  });

  it('cssVarOf returns the matching CSS custom-property reference', () => {
    expect(cssVarOf('caption')).toBe('var(--sys-lead-caption)');
    expect(cssVarOf('display')).toBe('var(--sys-lead-display)');
  });

  it('classesOf returns the typo-<beat> bundle class', () => {
    expect(classesOf('body')).toBe('typo-body');
    expect(classesOf('display')).toBe('typo-display');
  });

  it('leadingClassOf returns the Tailwind leading utility', () => {
    expect(leadingClassOf('body')).toBe('leading-sys-body');
    expect(leadingClassOf('caption')).toBe('leading-sys-caption');
  });

  it('trackOf returns TYPOGRAPHY[beat].track verbatim', () => {
    TYPOGRAPHY_ORDER.forEach((b) => {
      expect(trackOf(b)).toBe(TYPOGRAPHY[b].track);
    });
  });

  it('cssTrackVarOf returns the matching CSS custom-property reference', () => {
    expect(cssTrackVarOf('caption')).toBe('var(--sys-track-caption)');
    expect(cssTrackVarOf('display')).toBe('var(--sys-track-display)');
  });

  it('trackingClassOf returns the Tailwind tracking utility', () => {
    expect(trackingClassOf('caption')).toBe('tracking-sys-caption');
    expect(trackingClassOf('display')).toBe('tracking-sys-display');
  });

  it('isKerned classifies kern: auto beats correctly', () => {
    expect(isKerned('lede')).toBe(true);
    expect(isKerned('heading')).toBe(true);
    expect(isKerned('display')).toBe(true);
    expect(isKerned('caption')).toBe(false);
    expect(isKerned('body')).toBe(false);
    expect(isKerned('passage')).toBe(false);
  });

  it('isBalanced classifies wrap: balance beats correctly', () => {
    expect(isBalanced('heading')).toBe(true);
    expect(isBalanced('display')).toBe(true);
    expect(isBalanced('body')).toBe(false);
    expect(isBalanced('passage')).toBe(false);
    expect(isBalanced('caption')).toBe(false);
  });
});

describe('thermal carve-out — .typo-passage-thermal CSS ↔ TS sync', () => {
  /** Reuse readTypoBlock by feeding the suffix `passage-thermal`. */
  function readThermalBlock(): string | undefined {
    const rx = /\.typo-passage-thermal\s*\{([^}]*)\}/;
    const match = CSS.match(rx);
    return match ? match[1] : undefined;
  }

  it('passageThermalClass() returns "typo-passage-thermal"', () => {
    expect(passageThermalClass()).toBe('typo-passage-thermal');
  });

  it('.typo-passage-thermal exists in globals.css', () => {
    expect(readThermalBlock()).toBeDefined();
  });

  it('.typo-passage-thermal binds line-height to --token-line-height (PRIMARY thermal signal)', () => {
    const block = readThermalBlock();
    const decl = new RegExp(`line-height:\\s*var\\(${THERMAL_LEADING_VAR}\\)`);
    expect(blockHas(block, decl)).toBe(true);
  });

  it('.typo-passage-thermal binds letter-spacing to --token-letter-spacing (body track carve-out)', () => {
    const block = readThermalBlock();
    const decl = new RegExp(`letter-spacing:\\s*var\\(${THERMAL_TRACK_VAR}\\)`);
    expect(blockHas(block, decl)).toBe(true);
  });

  it('.typo-passage-thermal inherits passage wrap discipline (text-wrap: pretty)', () => {
    const block = readThermalBlock();
    expect(blockHas(block, /text-wrap:\s*pretty/)).toBe(true);
  });

  it('.typo-passage-thermal carries no static --sys-lead-* / --sys-track-* (thermal-only binding)', () => {
    const block = readThermalBlock();
    expect(blockHas(block, /var\(--sys-lead-/)).toBe(false);
    expect(blockHas(block, /var\(--sys-track-/)).toBe(false);
  });

  it('.typo-passage-thermal appears AFTER .typo-passage in source order (cascade tip)', () => {
    const idxStatic = CSS.indexOf('.typo-passage {');
    const idxThermal = CSS.indexOf('.typo-passage-thermal');
    expect(idxStatic).toBeGreaterThan(0);
    expect(idxThermal).toBeGreaterThan(idxStatic);
  });
});

describe('wrap-only adoption — .typo-wrap-<beat> CSS ↔ TS sync', () => {
  /** Extract the body of a `.typo-wrap-<beat> { … }` block. */
  function readWrapBlock(beat: string): string | undefined {
    const rx = new RegExp(`\\.typo-wrap-${beat}\\s*\\{([^}]*)\\}`);
    const match = CSS.match(rx);
    return match ? match[1] : undefined;
  }

  TYPOGRAPHY_ORDER.forEach((beat) => {
    it(`wrapClassOf('${beat}') returns 'typo-wrap-${beat}'`, () => {
      expect(wrapClassOf(beat)).toBe(`typo-wrap-${beat}`);
    });

    it(`.typo-wrap-${beat} exists in globals.css`, () => {
      expect(readWrapBlock(beat)).toBeDefined();
    });

    it(`.typo-wrap-${beat} declares the TS-specified text-wrap`, () => {
      const block = readWrapBlock(beat);
      const wrap = TYPOGRAPHY[beat as TypographyBeatName].wrap;
      const decl = new RegExp(`text-wrap:\\s*${wrap}`);
      expect(blockHas(block, decl)).toBe(true);
    });

    it(`.typo-wrap-${beat} carries ONLY text-wrap (no leading, no track, no kern)`, () => {
      const block = readWrapBlock(beat);
      expect(blockHas(block, /line-height:/)).toBe(false);
      expect(blockHas(block, /letter-spacing:/)).toBe(false);
      expect(blockHas(block, /font-feature-settings:/)).toBe(false);
    });
  });

  it('every .typo-wrap-* in CSS is represented in TYPOGRAPHY', () => {
    const cssBeats = Array.from(CSS.matchAll(/\.typo-wrap-([a-z]+)\s*\{/g)).map((m) => m[1]);
    const tsBeats = Object.keys(TYPOGRAPHY);
    cssBeats.forEach((b) => expect(tsBeats).toContain(b));
  });
});

describe('hyphens-only adoption — .typo-hyphens-<beat> CSS ↔ TS sync', () => {
  /** Extract the body of a `.typo-hyphens-<beat> { … }` block. ≤ 10 LoC. */
  function readHyphensBlock(beat: string): string | undefined {
    const rx = new RegExp(`\\.typo-hyphens-${beat}\\s*\\{([^}]*)\\}`);
    const match = CSS.match(rx);
    return match ? match[1] : undefined;
  }

  TYPOGRAPHY_ORDER.forEach((beat) => {
    it(`hyphensClassOf('${beat}') returns 'typo-hyphens-${beat}'`, () => {
      expect(hyphensClassOf(beat)).toBe(`typo-hyphens-${beat}`);
    });

    it(`.typo-hyphens-${beat} exists in globals.css (JIT-emission symmetry)`, () => {
      // Five non-`passage` blocks are empty stubs this sprint — `passage` is
      // the only beat with declarations. The block must exist (so the JIT
      // emits the utility) even when its body is empty.
      expect(readHyphensBlock(beat)).toBeDefined();
    });
  });

  it('.typo-hyphens-passage declares hyphens: auto (the lang-bound switch)', () => {
    const block = readHyphensBlock('passage');
    expect(blockHas(block, /hyphens:\s*auto/)).toBe(true);
  });

  it('.typo-hyphens-passage declares hyphenate-limit-chars matching HYPHENATE_LIMIT_CHARS', () => {
    const block = readHyphensBlock('passage');
    const decl = new RegExp(`hyphenate-limit-chars:\\s*${HYPHENATE_LIMIT_CHARS.replace(/ /g, '\\s+')}`);
    expect(blockHas(block, decl)).toBe(true);
  });

  it('.typo-hyphens-passage declares overflow-wrap: break-word (NOT anywhere — Elon §3)', () => {
    // `anywhere` mid-breaks URLs and ALL-CAPS acronyms; `break-word` is the
    // gentler floor that still kills the worst body-prose orphans.
    const block = readHyphensBlock('passage');
    expect(blockHas(block, /overflow-wrap:\s*break-word/)).toBe(true);
    expect(blockHas(block, /overflow-wrap:\s*anywhere/)).toBe(false);
  });

  it('every .typo-hyphens-* in CSS is represented in TYPOGRAPHY', () => {
    const cssBeats = Array.from(CSS.matchAll(/\.typo-hyphens-([a-z]+)\s*\{/g)).map((m) => m[1]);
    const tsBeats = Object.keys(TYPOGRAPHY);
    cssBeats.forEach((b) => expect(tsBeats).toContain(b));
  });

  it('HYPHENATE_LIMIT_CHARS is the canonical "8 4 4" load-bearing literal', () => {
    expect(HYPHENATE_LIMIT_CHARS).toBe('8 4 4');
  });
});

describe('hang adoption — .typo-hang-<beat> CSS ↔ TS sync', () => {
  /** Extract the body of a `.typo-hang-<beat> { … }` block. ≤ 10 LoC. */
  function readHangBlock(beat: string): string | undefined {
    const rx = new RegExp(`\\.typo-hang-${beat}\\s*\\{([^}]*)\\}`);
    const match = CSS.match(rx);
    return match ? match[1] : undefined;
  }

  TYPOGRAPHY_ORDER.forEach((beat) => {
    it(`hangPunctClassOf('${beat}') returns 'typo-hang-${beat}'`, () => {
      expect(hangPunctClassOf(beat)).toBe(`typo-hang-${beat}`);
    });

    it(`.typo-hang-${beat} exists in globals.css (JIT-emission symmetry)`, () => {
      // Five non-`passage` blocks are empty stubs this sprint — `passage` is
      // the only beat with a live declaration. The block must exist (so the
      // JIT emits the utility) even when its body is empty.
      expect(readHangBlock(beat)).toBeDefined();
    });
  });

  it('.typo-hang-passage declares hanging-punctuation matching HANGING_PUNCTUATION', () => {
    const block = readHangBlock('passage');
    const decl = new RegExp(`hanging-punctuation:\\s*${HANGING_PUNCTUATION.replace(/ /g, '\\s+')}`);
    expect(blockHas(block, decl)).toBe(true);
  });

  it('.typo-hang-passage carries ONLY hanging-punctuation (no leading, track, kern, wrap)', () => {
    // Disjoint-property invariant: hang composes alongside wrap + hyphens
    // by declaring NONE of their properties. If a future PR adds e.g.
    // `text-wrap` here, the compose-not-migrate contract breaks silently —
    // pin it loud (Mike napkin §3 POI #3, Tanya UX §2.2 box-unchanged).
    const block = readHangBlock('passage');
    expect(blockHas(block, /line-height:/)).toBe(false);
    expect(blockHas(block, /letter-spacing:/)).toBe(false);
    expect(blockHas(block, /font-feature-settings:/)).toBe(false);
    expect(blockHas(block, /text-wrap:/)).toBe(false);
    expect(blockHas(block, /hyphens:/)).toBe(false);
  });

  it('every .typo-hang-* in CSS is represented in TYPOGRAPHY', () => {
    const cssBeats = Array.from(CSS.matchAll(/\.typo-hang-([a-z]+)\s*\{/g)).map((m) => m[1]);
    const tsBeats = Object.keys(TYPOGRAPHY);
    cssBeats.forEach((b) => expect(tsBeats).toContain(b));
  });

  it('HANGING_PUNCTUATION is the canonical "first last allow-end" load-bearing literal', () => {
    expect(HANGING_PUNCTUATION).toBe('first last allow-end');
  });
});

describe('per-beat .typo-<beat> CSS class blocks', () => {
  TYPOGRAPHY_ORDER.forEach((beat) => {
    it(`.typo-${beat} declares line-height: var(--sys-lead-${beat})`, () => {
      const block = readTypoBlock(beat);
      const decl = new RegExp(`line-height:\\s*var\\(--sys-lead-${beat}\\)`);
      expect(blockHas(block, decl)).toBe(true);
    });

    it(`.typo-${beat} declares the TS-specified text-wrap`, () => {
      const block = readTypoBlock(beat);
      const wrap = TYPOGRAPHY[beat as TypographyBeatName].wrap;
      const decl = new RegExp(`text-wrap:\\s*${wrap}`);
      expect(blockHas(block, decl)).toBe(true);
    });

    it(`.typo-${beat} declares font-feature-settings iff kern: auto`, () => {
      const block = readTypoBlock(beat);
      const wantsKern = TYPOGRAPHY[beat as TypographyBeatName].kern === 'auto';
      const hasKern = blockHas(block, /font-feature-settings:\s*['"]kern['"]/);
      expect(hasKern).toBe(wantsKern);
    });

    it(`.typo-${beat} declares letter-spacing: var(--sys-track-${beat})`, () => {
      const block = readTypoBlock(beat);
      const decl = new RegExp(`letter-spacing:\\s*var\\(--sys-track-${beat}\\)`);
      expect(blockHas(block, decl)).toBe(true);
    });

    it(`.typo-${beat} has no hardcoded letter-spacing literal (must use var)`, () => {
      const block = readTypoBlock(beat);
      const literal = /letter-spacing:\s*-?\d*\.?\d+(em|px|rem)/;
      expect(blockHas(block, literal)).toBe(false);
    });
  });
});
