/**
 * GoldenThread Component — structural tests.
 *
 * Verifies GoldenThread exists, imports correctly, and uses the
 * shared useScrollDepth context (no articleId prop).
 * Thermal glow is handled by CSS selectors — no useThermal needed.
 */

test('GoldenThread is a named export using useScrollDepth', () => {
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'GoldenThread.tsx'),
    'utf-8',
  );

  // Should export GoldenThread as a named function
  expect(src).toMatch(/export function GoldenThread/);

  // Should import useScrollDepth (reads from context)
  expect(src).toMatch(/useScrollDepth\(\)/);

  // Should NOT take any props
  expect(src).not.toMatch(/\{ articleId \}/);

  // Should use golden-thread-glow class for CSS-gated glow
  expect(src).toMatch(/golden-thread-glow/);

  // Should use --token-accent for thermal color interpolation
  expect(src).toMatch(/--token-accent/);

  // Should NOT import useThermal (CSS handles thermal gating)
  expect(src).not.toMatch(/useThermal/);
});
