/**
 * Inline Restore Sync Test
 *
 * Verifies that the auto-generated INLINE_RESTORE_SCRIPT produces
 * identical token values as the full thermal pipeline.
 *
 * If this test fails, someone changed thermal anchors without
 * regenerating the inline script. Run: npx tsx scripts/generate-inline-restore.ts
 *
 * Strategy:
 *  1. Execute the IIFE in a mock DOM context
 *  2. Extract CSS custom properties the script sets
 *  3. Run the full pipeline (computeThermalScore → computeThermalTokens)
 *  4. Assert every token matches within epsilon
 *  5. Test at boundary scores: 0, 18, 50, 80, 100
 */

import { computeThermalScore, type ThermalInput } from '@/lib/thermal/thermal-score';
import { computeThermalTokens } from '@/lib/thermal/thermal-tokens';
import { INLINE_RESTORE_SCRIPT } from '@/lib/thermal/inline-restore';

// ─── Mock DOM context ────────────────────────────────────

function createMockDom() {
  const props: Record<string, string> = {};
  const attrs: Record<string, string> = {};

  return {
    style: {
      setProperty: (name: string, value: string) => { props[name] = value; },
    },
    setAttribute: (name: string, value: string) => { attrs[name] = value; },
    getProperties: () => ({ ...props }),
    getAttributes: () => ({ ...attrs }),
  };
}

/** Build mock history JSON from ThermalInput values. */
function buildHistoryJson(input: ThermalInput): string {
  return JSON.stringify({
    articleIds: Array.from({ length: input.articlesRead }, (_, i) => `art-${i}`),
    articleDepths: Object.fromEntries(
      Array.from({ length: input.articlesRead }, (_, i) => [`art-${i}`, input.avgScrollDepth]),
    ),
    visitDays: Array.from({ length: input.visitDays }, (_, i) => `2026-04-${i + 1}`),
    resonanceCount: input.resonanceCount,
    totalDwellSecs: input.totalDwellSecs,
  });
}

/** Execute the inline script in a sandboxed context. */
function executeScript(input: ThermalInput): Record<string, string> {
  const mockEl = createMockDom();
  const mockRoot = {
    style: mockEl.style,
    setAttribute: mockEl.setAttribute,
  };
  const mockDoc = { documentElement: mockRoot };

  const historyJson = buildHistoryJson(input);
  const storage = {
    'thermal-history': historyJson,
    getItem: (key: string) => storage[key] ?? null,
  };

  // Create the execution sandbox
  const fn = new Function(
    'localStorage', 'document',
    INLINE_RESTORE_SCRIPT,
  );
  fn(storage, mockDoc);

  return mockEl.getProperties();
}

// ─── Token comparison helpers ─────────────────────────────

/** Compare two hex colors (case-insensitive). */
function hexEqual(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** Compare numeric values within epsilon. */
function numClose(a: string, b: string, eps: number): boolean {
  const va = parseFloat(a);
  const vb = parseFloat(b);
  if (isNaN(va) || isNaN(vb)) return a === b;
  return Math.abs(va - vb) <= eps;
}

/** Compare full token strings — handles hex, px, rem, em, none, rgba. */
function tokenMatch(a: string, b: string): boolean {
  // Exact match for 'none' and rgba(...)
  if (a === b) return true;

  // Strip units and compare numerically
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  if (!isNaN(numA) && !isNaN(numB)) {
    return Math.abs(numA - numB) < 0.01;
  }

  // Hex color comparison
  if (a.startsWith('#') && b.startsWith('#')) {
    return hexEqual(a, b);
  }

  return a === b;
}

// ─── Test inputs at boundaries ────────────────────────────

// Boundary inputs — must have articlesRead >= 1 (inline script exits on empty history).
// Scores are approximate; we verify token-by-token accuracy, not exact score match.
const BOUNDARY_INPUTS: [string, ThermalInput][] = [
  ['near-dormant (1)',  { articlesRead: 1, avgScrollDepth: 5,   visitDays: 1, resonanceCount: 0, totalDwellSecs: 30 }],
  ['stirring (18)',     { articlesRead: 1, avgScrollDepth: 10,  visitDays: 1, resonanceCount: 0, totalDwellSecs: 300 }],
  ['warm (50)',         { articlesRead: 3, avgScrollDepth: 60,  visitDays: 4, resonanceCount: 1, totalDwellSecs: 900 }],
  ['luminous (80)',     { articlesRead: 5, avgScrollDepth: 85,  visitDays: 6, resonanceCount: 2, totalDwellSecs: 1800 }],
  ['max (100)',         { articlesRead: 8, avgScrollDepth: 100, visitDays: 8, resonanceCount: 4, totalDwellSecs: 3600 }],
];

// ─── Tests ────────────────────────────────────────────────

describe('inline-restore sync with full thermal pipeline', () => {
  // Tokens that the inline script produces (excludes spacing lift)
  const TOKEN_KEYS = [
    '--token-bg', '--token-surface', '--token-foreground',
    '--token-accent', '--token-border', '--token-glow',
    '--token-shadow', '--token-line-height', '--token-shadow-depth',
    '--token-radius-soft', '--token-accent-opacity',
    '--token-font-weight', '--token-letter-spacing',
    '--token-para-rhythm', '--para-offset', '--token-text-glow',
  ];

  test.each(BOUNDARY_INPUTS)('tokens match at %s', (_label, input) => {
    const { score, state } = computeThermalScore(input);
    const pipelineTokens = computeThermalTokens(score, state);
    const scriptTokens = executeScript(input);

    for (const key of TOKEN_KEYS) {
      const pipeline = pipelineTokens[key];
      const script = scriptTokens[key];

      expect(typeof pipeline).toBe('string');
      expect(typeof script).toBe('string');

      if (!tokenMatch(pipeline, script)) {
        // Provide detailed error for debugging
        expect({ key, pipeline, script }).toEqual({
          key, pipeline, script: pipeline,
        });
      }
    }
  });

  test.each(BOUNDARY_INPUTS)('spacing lift tokens match at %s', (_label, input) => {
    const { score, state } = computeThermalScore(input);
    const pipelineTokens = computeThermalTokens(score, state);
    const scriptTokens = executeScript(input);

    for (let n = 1; n <= 12; n++) {
      const key = `--token-space-lift-${n}`;
      const pipeline = pipelineTokens[key];
      const script = scriptTokens[key];

      if (!numClose(pipeline, script, 0.02)) {
        expect({ key, pipeline, script }).toEqual({
          key, pipeline, script: pipeline,
        });
      }
    }
  });
});

describe('inline-restore data attributes', () => {
  test.each([
    ['returning=false for new reader', { articlesRead: 1, avgScrollDepth: 20, visitDays: 1, resonanceCount: 0, totalDwellSecs: 60 }, 'false'],
    ['returning=true for multi-day reader', { articlesRead: 3, avgScrollDepth: 50, visitDays: 3, resonanceCount: 1, totalDwellSecs: 600 }, 'true'],
  ])('%s', (_label, input, expectedReturning) => {
    const mockEl = createMockDom();
    const mockRoot = { style: mockEl.style, setAttribute: mockEl.setAttribute };
    const mockDoc = { documentElement: mockRoot };
    const historyJson = buildHistoryJson(input as ThermalInput);
    const storage = { 'thermal-history': historyJson, getItem: (key: string) => storage[key] ?? null };

    const fn = new Function('localStorage', 'document', INLINE_RESTORE_SCRIPT);
    fn(storage, mockDoc);

    expect(mockEl.getAttributes()['data-returning']).toBe(expectedReturning);
  });
});

describe('inline-restore edge cases', () => {
  it('returns nothing when no history exists', () => {
    const mockEl = createMockDom();
    const mockRoot = { style: mockEl.style, setAttribute: mockEl.setAttribute };
    const mockDoc = { documentElement: mockRoot };
    const storage: Record<string, string> = {};
    const ls = { ...storage, getItem: (key: string) => storage[key] ?? null };

    const fn = new Function('localStorage', 'document', INLINE_RESTORE_SCRIPT);
    fn(ls, mockDoc);

    expect(Object.keys(mockEl.getProperties())).toHaveLength(0);
  });

  it('returns nothing when no articles read', () => {
    const mockEl = createMockDom();
    const mockRoot = { style: mockEl.style, setAttribute: mockEl.setAttribute };
    const mockDoc = { documentElement: mockRoot };
    const storage = { 'thermal-history': JSON.stringify({ articleIds: [], articleDepths: {}, visitDays: [], resonanceCount: 0, totalDwellSecs: 0 }) };
    const ls = { ...storage, getItem: (key: string) => storage[key] ?? null };

    const fn = new Function('localStorage', 'document', INLINE_RESTORE_SCRIPT);
    fn(ls, mockDoc);

    expect(Object.keys(mockEl.getProperties())).toHaveLength(0);
  });
});

describe('inline-restore source structure', () => {
  it('is a non-empty string', () => {
    expect(typeof INLINE_RESTORE_SCRIPT).toBe('string');
    expect(INLINE_RESTORE_SCRIPT.length).toBeGreaterThan(100);
  });

  it('is an IIFE', () => {
    expect(INLINE_RESTORE_SCRIPT.startsWith('(function(){')).toBe(true);
    expect(INLINE_RESTORE_SCRIPT.endsWith('})()')).toBe(true);
  });

  it('contains all expected token keys', () => {
    const keys = [
      '--token-bg', '--token-surface', '--token-foreground',
      '--token-accent', '--token-border', '--token-glow',
      '--token-shadow', '--token-line-height', '--token-shadow-depth',
      '--token-radius-soft', '--token-accent-opacity',
      '--token-font-weight', '--token-letter-spacing',
      '--token-para-rhythm', '--para-offset', '--token-text-glow',
    ];
    for (const key of keys) {
      expect(INLINE_RESTORE_SCRIPT).toContain(`'${key}'`);
    }
  });

  it('sets data-thermal attribute', () => {
    expect(INLINE_RESTORE_SCRIPT).toContain("data-thermal");
    expect(INLINE_RESTORE_SCRIPT).toContain("'luminous'");
    expect(INLINE_RESTORE_SCRIPT).toContain("'warm'");
    expect(INLINE_RESTORE_SCRIPT).toContain("'stirring'");
    expect(INLINE_RESTORE_SCRIPT).toContain("'dormant'");
  });

  it('sets data-thermal-score attribute', () => {
    expect(INLINE_RESTORE_SCRIPT).toContain("data-thermal-score");
  });
});
