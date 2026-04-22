/**
 * thread-render — purity, validation, rendering contracts.
 *
 * These tests guard the "one renderer, two runtimes" invariant: the
 * SVG builder MUST run identically in node and browser. If a DOM/window
 * dependency ever sneaks in, this suite will fail in `testEnvironment: 'node'`.
 */
import {
  buildThreadSVG, clampSnapshot, clampTitle, formatDate,
  isValidArchetype, ARCHETYPE_KEYS, OG_WIDTH, OG_HEIGHT,
  type ThreadSnapshot,
} from '../thread-render';
import {
  encodeSnapshotToken, decodeSnapshotToken, buildKeepsakeHref,
} from '../thread-snapshot';

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

describe('formatDate', () => {
  it('returns a YYYY-MM-DD UTC string', () => {
    expect(formatDate(FIXED_TS)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
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
