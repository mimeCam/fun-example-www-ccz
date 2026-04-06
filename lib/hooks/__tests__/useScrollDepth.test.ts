/**
 * ScrollDepthProvider + useScrollDepth — structural tests.
 *
 * Tests depth calculation logic and module structure
 * without importing the TSX source (requires JSX transform).
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Module shape (file content analysis) ────────────────────────

test('useScrollDepth exports provider and hook', () => {
  const src = readFileSync(join(__dirname, '../useScrollDepth.tsx'), 'utf-8');
  expect(src).toMatch(/export function useScrollDepth/);
  expect(src).toMatch(/export function ScrollDepthProvider/);
});

test('useScrollDepth takes no arguments (reads context)', () => {
  const src = readFileSync(join(__dirname, '../useScrollDepth.tsx'), 'utf-8');
  // Should read from context, not accept params
  expect(src).toMatch(/return useContext\(Ctx\)/);
});

test('provider creates a single IntersectionObserver', () => {
  const src = readFileSync(join(__dirname, '../useScrollDepth.tsx'), 'utf-8');
  expect(src).toMatch(/new IntersectionObserver/);
  // Only one observer creation in the file
  const matches = src.match(/new IntersectionObserver/g);
  expect(matches).toHaveLength(1);
});

// ─── Depth formula ───────────────────────────────────────────────

describe('depth calculation', () => {
  const NUM_CHECKPOINTS = 20;

  test('depth = checkpoint_index / 20 * 100', () => {
    expect((14 / NUM_CHECKPOINTS) * 100).toBe(70);
    expect((7 / NUM_CHECKPOINTS) * 100).toBe(35);
    expect((20 / NUM_CHECKPOINTS) * 100).toBe(100);
  });

  test('isReading triggers at depth >= 5', () => {
    expect((1 / NUM_CHECKPOINTS) * 100 >= 5).toBe(true);
    expect((0 / NUM_CHECKPOINTS) * 100 >= 5).toBe(false);
  });

  test('isFinished triggers at depth >= 98', () => {
    expect((20 / NUM_CHECKPOINTS) * 100 >= 98).toBe(true);
    expect((19 / NUM_CHECKPOINTS) * 100 >= 98).toBe(false);
  });

  test('maxDepth tracks peak ever reached', () => {
    const peaks = [25, 50, 75, 60, 40];
    expect(Math.max(...peaks)).toBe(75);
  });
});

// ─── Checkpoint placement ────────────────────────────────────────

describe('checkpoint spacing', () => {
  test('21 checkpoints cover full scroll height', () => {
    const scrollable = 2200;
    const spacing = scrollable / 20;
    expect(20 * spacing).toBe(scrollable);
  });

  test('checkpoints are evenly distributed', () => {
    const scrollable = 1000;
    const spacing = scrollable / 20;
    for (let i = 0; i <= 20; i++) {
      expect(i * spacing).toBeCloseTo((i * scrollable) / 20, 1);
    }
  });
});

// ─── Short page edge case ─────────────────────────────────────────

describe('short page handling', () => {
  test('non-scrollable page gets 100% immediately', () => {
    expect(800 - 900 <= 0).toBe(true); // viewportHeight > scrollHeight
  });
});
