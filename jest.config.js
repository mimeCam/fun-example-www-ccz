/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  // ts-jest override — compile JSX to runnable JS for the test runtime.
  // The project tsconfig keeps `jsx: preserve` so Next.js can own that
  // pass at build time; the test runtime needs the React 18 automatic
  // runtime so primitives (Skeleton, SuspenseFade) can be exercised
  // under `react-dom/server` without a separate compile step.
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
};
