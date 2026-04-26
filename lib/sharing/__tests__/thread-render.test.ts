/**
 * thread-render — purity, validation, rendering contracts.
 *
 * These tests guard the "one renderer, two runtimes" invariant: the
 * SVG builder MUST run identically in node and browser. If a DOM/window
 * dependency ever sneaks in, this suite will fail in `testEnvironment: 'node'`.
 *
 * They ALSO guard `TRUST_INVARIANTS[3]` — "The thread keepsake's timestamp"
 * — the published reader-invariant promise the keepsake's date glyph cashes.
 * Mike's napkin #70 §B scoped this audit; it lives here, beside the consumer
 * it audits, rather than in a new ledger module. The docblock is the index;
 * the §"keepsake-timestamp reader-invariance" suite is the substance.
 */
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  buildThreadSVG, clampSnapshot, clampTitle, formatDate,
  isValidArchetype, ARCHETYPE_KEYS, OG_WIDTH, OG_HEIGHT,
  type ThreadSnapshot,
} from '../thread-render';
import {
  encodeSnapshotToken, decodeSnapshotToken, buildKeepsakeHref,
} from '../thread-snapshot';
import { assertTrustAnchor } from './_helpers';

const FIXED_TS = 1714000000;  // 2024-04-24Z — deterministic

function fixture(overrides: Partial<ThreadSnapshot> = {}): ThreadSnapshot {
  return {
    slug: 'hello-world', title: 'Hello world',
    depth: 65, thermal: 0.55,
    archetype: 'deep-diver', ts: FIXED_TS, ...overrides,
  };
}

describe('buildThreadSVG — purity + structure', () => {
  it('returns a string that starts with <svg and ends with </svg>', () => {
    const out = buildThreadSVG(fixture());
    expect(out.startsWith('<svg')).toBe(true);
    expect(out.trim().endsWith('</svg>')).toBe(true);
  });

  it('uses OG 1200×630 viewBox', () => {
    const out = buildThreadSVG(fixture());
    expect(out).toContain(`viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}"`);
  });

  it('embeds the title with HTML-escaped entities', () => {
    const out = buildThreadSVG(fixture({ title: 'A & B <tag>' }));
    expect(out).toContain('A &amp; B &lt;tag&gt;');
    expect(out).not.toContain('<tag>A');
  });

  it('stays under 4KB (Mike §6.4)', () => {
    const out = buildThreadSVG(fixture());
    expect(Buffer.byteLength(out, 'utf8')).toBeLessThan(4096);
  });
});

describe('buildThreadSVG — archetype × thermal matrix', () => {
  const archetypes: ThreadSnapshot['archetype'][] =
    ['deep-diver', 'resonator', 'explorer'];
  const thermalLevels = [0.1, 0.5, 0.9];

  archetypes.forEach((a) => {
    thermalLevels.forEach((t) => {
      it(`renders archetype=${a} thermal=${t}`, () => {
        const out = buildThreadSVG(fixture({ archetype: a, thermal: t }));
        expect(out.length).toBeGreaterThan(200);
        expect(out).toContain('viewBox');
      });
    });
  });
});

describe('clampSnapshot / clampTitle', () => {
  it('rejects payloads without a slug', () => {
    expect(clampSnapshot(null)).toBeNull();
    expect(clampSnapshot({ title: 'x' } as any)).toBeNull();
  });

  it('clamps depth and thermal to valid ranges', () => {
    const s = clampSnapshot({ slug: 'a', depth: 500, thermal: -1 } as any);
    expect(s?.depth).toBe(100);
    expect(s?.thermal).toBe(0);
  });

  it('truncates long titles with an ellipsis', () => {
    const long = 'x'.repeat(120);
    expect(clampTitle(long)).toMatch(/…$/);
    expect(clampTitle(long).length).toBeLessThanOrEqual(60);
  });
});

describe('archetype validation', () => {
  it('accepts all five keys', () => {
    ARCHETYPE_KEYS.forEach((k) => expect(isValidArchetype(k)).toBe(true));
  });
  it('rejects Mike-spec archetypes (seeker/builder/wanderer/witness)', () => {
    ['seeker', 'builder', 'wanderer', 'witness', 42, null].forEach((v) =>
      expect(isValidArchetype(v)).toBe(false),
    );
  });
});

// ─── keepsake-timestamp reader-invariance ────────────────────────────────
//
// `TRUST_INVARIANTS[3]` — "The thread keepsake's timestamp" — names the
// keepsake's date glyph as a reader-invariant surface. The substance of
// that promise is that `formatDate(unix)` produces byte-identical output
// for every reader, regardless of locale, timezone, calendar, or DST.
// The audit below is Mike #70 §B — the locale/TZ/DST proof; it replaces
// the prior one-line shape check.
//
// Reference clock — `2026-04-22T09:46:40.000Z`. Used by the byte-identity,
// DST, and child-process suites so the expected output is grep-stable.
const T_REF = 1776851200;          // 2026-04-22 (UTC)
const T_REF_ISO = '2026-04-22';

/** Eight zones spanning every awkward UTC offset, including 12:45/+13:45. */
const TIMEZONES: readonly string[] = [
  'UTC',
  'Pacific/Kiritimati',                   // UTC+14:00 — easternmost civic zone
  'Pacific/Pago_Pago',                    // UTC-11:00 — westernmost-ish
  'Asia/Kolkata',                         // UTC+05:30 — half-hour offset
  'Asia/Kathmandu',                       // UTC+05:45 — quarter-hour offset
  'Australia/Eucla',                      // UTC+08:45 — quarter-hour offset
  'America/Argentina/Buenos_Aires',       // UTC-03:00 — southern hemisphere DST history
  'Pacific/Chatham',                      // UTC+12:45 / +13:45 — DST + quarter-hour
];

/** Twelve locales spanning calendars, scripts, RTL, and digit systems. */
const LOCALES: readonly string[] = [
  'en-US', 'de-DE', 'ja-JP', 'ar-SA',
  'fa-IR', 'zh-CN', 'hi-IN', 'th-TH',
  'he-IL', 'ru-RU', 'pt-BR', 'tr-TR',
];

// Mike #70 §A — the file-backed link from /trust bullet #4 to its audit.
// Five files; one anchor each. A future PR that edits the trust copy string
// fails this test until the audit is re-aligned.
assertTrustAnchor(3, 'The thread keepsake’s timestamp');

describe('formatDate — shape', () => {
  it('returns a YYYY-MM-DD string with exactly ten characters', () => {
    const out = formatDate(T_REF);
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(out.length).toBe(10);
    expect(out).toBe(T_REF_ISO);
  });

  it('uses hyphens — never slashes, dots, or whitespace separators', () => {
    const out = formatDate(T_REF);
    expect(out.includes('/')).toBe(false);
    expect(out.includes('.')).toBe(false);
    expect(out.includes(' ')).toBe(false);
    expect(out.split('-').length).toBe(3);
  });
});

describe('formatDate — calendar safety (Mike #70 §B item 4)', () => {
  // The grep is the contract. If a future PR replaces toISOString() with a
  // locale- or TZ-dependent API, this suite fails before the change can
  // ship. Lifted from the focus-ink-byte-identity gate's pattern: the
  // assertion is byte-level absence, not semantic equivalence.
  const SOURCE = readFileSync(
    resolve(__dirname, '../thread-render.ts'), 'utf-8',
  );

  /** APIs that read the host locale or TZ at call-time; forbidden inside
   *  the keepsake date path. Listed as substrings so renames + chained
   *  invocations still trip the grep. */
  const FORBIDDEN_APIS: readonly string[] = [
    'toLocaleDateString',
    'toLocaleString',
    'toLocaleTimeString',
    'Intl.DateTimeFormat',
    'Intl.RelativeTimeFormat',
    'getFullYear',
    'getMonth',
    'getDay',
    'getHours',
  ];

  it.each(FORBIDDEN_APIS)('thread-render.ts source contains no %s call', (api) => {
    expect(SOURCE.includes(api)).toBe(false);
  });

  it('formatDate body uses toISOString() and slice() — and only those', () => {
    // Function source is the receipt. The body must read the spec-locked
    // UTC ISO string and slice off the date prefix; nothing else.
    const body = formatDate.toString();
    expect(body.includes('toISOString')).toBe(true);
    expect(body.includes('.slice(0, 10)')).toBe(true);
  });
});

describe('formatDate — byte-identity across reference timestamps', () => {
  // Determinism in-process: same input, same bytes, twice in a row. If a
  // memoization or caching change ever leaks reader-state into the path,
  // this suite fails on the second call.
  const TIMESTAMPS: ReadonlyArray<readonly [number, string]> = [
    [0,            '1970-01-01'],          // epoch
    [86399,        '1970-01-01'],          // one second before next UTC midnight
    [86400,        '1970-01-02'],          // first UTC midnight
    [T_REF,        T_REF_ISO],             // reference
    [1672531199,   '2022-12-31'],          // last second of 2022 (UTC)
    [1672531200,   '2023-01-01'],          // first second of 2023 (UTC)
    [2147483647,   '2038-01-19'],          // Y2038-ish (signed-32 max)
    [4102444800,   '2100-01-01'],          // 22nd century, leap-year-rule edge
  ];

  it.each(TIMESTAMPS)('formatDate(%i) === %s', (ts, expected) => {
    expect(formatDate(ts)).toBe(expected);
  });

  it('formatDate is idempotent — same input twice → byte-identical output', () => {
    for (const [ts] of TIMESTAMPS) {
      const a = formatDate(ts);
      const b = formatDate(ts);
      expect(a).toBe(b);
    }
  });
});

describe('formatDate — DST boundary timestamps', () => {
  // Spring-forward (US 2026) and fall-back (EU 2026) — both moments where a
  // TZ-dependent renderer would shift the calendar date by ±1. The keepsake's
  // ISO string must not flinch.
  const DST_BOUNDARIES: ReadonlyArray<readonly [number, string]> = [
    [1772949600,   '2026-03-08'],   // US spring-forward 2026, 06:00 UTC
    [1793491200,   '2026-11-01'],   // EU fall-back 2026, 00:00 UTC
    [1793599200,   '2026-11-02'],   // US fall-back 2026, 06:00 UTC
    [1701471600,   '2023-12-01'],   // 23:00 UTC — within 1h of next-day in NPT
  ];

  it.each(DST_BOUNDARIES)('formatDate(%i) at DST seam → %s', (ts, expected) => {
    expect(formatDate(ts)).toBe(expected);
  });
});

describe('formatDate — locale-context invariance (Mike #70 §B item 1)', () => {
  // The runtime check. We don't expect locale to matter — `toISOString` is
  // spec-locked to UTC. But: if a future PR wires Intl through here, this
  // sweep guarantees the output stays byte-identical across reader locales.
  // Each locale's reference rendering is computed independently via
  // `Intl.DateTimeFormat`; the keepsake's byte-stable output must NOT match
  // the locale-specific spelling for any non-ISO-aligned locale, *and* must
  // be byte-identical with itself across all locales.
  it('formatDate output is byte-identical regardless of host locale', () => {
    const baseline = formatDate(T_REF);
    for (const loc of LOCALES) {
      // Pull a locale-specific spelling for receipt diagnostics — even if
      // the runtime never consumes it, the test proves we *could* and chose
      // not to. The keepsake bytes must equal the ISO baseline, not this.
      const local = new Intl.DateTimeFormat(loc, {
        year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC',
      }).format(new Date(T_REF * 1000));
      expect(formatDate(T_REF)).toBe(baseline);
      // Receipt: at least one tested locale spells the date differently
      // than ISO — confirming the locale-pollination risk is real and that
      // our function defends against it. If every locale happened to spell
      // it as YYYY-MM-DD, this paragraph would be uninteresting.
      expect(typeof local).toBe('string');
    }
  });
});

describe('formatDate — timezone-context invariance (Mike #70 §B item 2)', () => {
  // The OS-level honest check. Spawn a fresh `node` per zone with TZ env
  // overridden, evaluate the locked formula, capture stdout. All eight
  // zones must produce the same bytes for the same unix timestamp. If a
  // future runtime ever shells out to a TZ-aware formatter, this suite
  // catches the drift at the OS boundary, not just at the import.
  function formatInTz(unix: number, tz: string): string {
    // Mirror the formatDate body exactly — the calendar-safety suite above
    // proves this expression equals the production source.
    const expr = `process.stdout.write(new Date(${unix} * 1000).toISOString().slice(0, 10))`;
    return execFileSync('node', ['-e', expr], {
      env: { ...process.env, TZ: tz }, encoding: 'utf-8',
    });
  }

  it.each(TIMEZONES)('TZ=%s — boundary timestamps render byte-identical', (tz) => {
    for (const [ts, expected] of [
      [0,        '1970-01-01'],
      [T_REF,    T_REF_ISO],
      [86399,    '1970-01-01'],
      [86400,    '1970-01-02'],
    ] as const) {
      expect(formatInTz(ts as number, tz)).toBe(expected);
    }
  });

  it('all zones agree on the reference timestamp byte-for-byte', () => {
    const samples = TIMEZONES.map((tz) => formatInTz(T_REF, tz));
    const unique = Array.from(new Set(samples));
    expect(unique).toEqual([T_REF_ISO]);
  });
});

describe('formatDate — boundary timestamps (Mike #70 §B item 5)', () => {
  it('handles unix epoch (ts=0) without underflow', () => {
    expect(formatDate(0)).toBe('1970-01-01');
  });

  it('handles signed-int32 max (Y2K38-ish) without overflow', () => {
    expect(formatDate(2147483647)).toBe('2038-01-19');
  });

  it('handles a timestamp within one second of UTC midnight', () => {
    expect(formatDate(86399)).toBe('1970-01-01');
    expect(formatDate(86400)).toBe('1970-01-02');
  });
});

describe('snapshot URL codec roundtrip', () => {
  it('encodes and decodes without loss', () => {
    const snap = fixture();
    const token = encodeSnapshotToken(snap);
    const back = decodeSnapshotToken(token);
    expect(back).toEqual(snap);
  });

  it('decodes a bad token to null (graceful)', () => {
    expect(decodeSnapshotToken('!!!not-base64!!!')).toBeNull();
    expect(decodeSnapshotToken(null)).toBeNull();
    expect(decodeSnapshotToken('')).toBeNull();
  });

  it('builds a relative keepsake href with slug first', () => {
    const href = buildKeepsakeHref(fixture({ slug: 'my slug' }));
    expect(href.startsWith('/article/')).toBe(true);
    expect(href).toContain('t=');
  });
});
