/**
 * DepthBar Component — structural tests.
 *
 * Tests that DepthBar exists, imports correctly, and uses the
 * shared useScrollDepth context (no articleId prop).
 *
 * Cannot render the component in Jest (no JSX transform configured),
 * but we verify the API contract.
 */

// Verify the component module exports correctly
test('DepthBar is a named export', () => {
  // The module uses 'use client' so we test the export shape
  // without rendering
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'DepthBar.tsx'),
    'utf-8',
  );

  // Should export DepthBar as a named function
  expect(src).toMatch(/export function DepthBar/);

  // Should import useScrollDepth (no args — reads from context)
  expect(src).toMatch(/useScrollDepth\(\)/);

  // Should NOT take articleId prop anymore
  expect(src).not.toMatch(/\{ articleId \}/);
  expect(src).not.toMatch(/articleId.*string/);

  // Should use rounded-md endpoints per Tanya's spec
  expect(src).toMatch(/rounded-md/);
});
