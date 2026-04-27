/**
 * _adoption-fence — one-line shim around the canonical walker kernel.
 *
 * The line-pattern API (`runFence`, `formatViolations`, `FencePattern`,
 * `FenceDecl`, `Violation`) lifted to `./_fence.ts` (Mike #41 napkin —
 * "consolidate the two existing walker kernels into one canonical
 * home"). This shim keeps the prior import surface so the ~5
 * remaining line-pattern callers
 * (`caption-metric-adoption`, `numeric-features-adoption`,
 * `filled-glyph-lift-adoption`, `swap-width-adoption`) compile
 * unchanged. The mechanical sweep that retires this shim is a follow-
 * up commit (Mike #41 §4 NOT-MUST — explicitly deferred so this
 * commit stays inside the ~500 LOC scope).
 *
 * The two-API split (`runLinePatterns` vs `runJsxBlocks`) lives in
 * `_fence.ts` — see that module's JSDoc for the strip-strategy table
 * and the felt-experience appendix Tanya wrote.
 *
 * TODO: when the four line-pattern callers above are re-pointed at
 * `./_fence`, delete this shim. Tracked in Mike #41 napkin §4 as the
 * "remaining ~15 import-path patches" sweep — independent, mechanical,
 * low-risk.
 */

export {
  runLinePatterns as runFence,
  formatViolations,
  type FencePattern,
  type FenceDecl,
  type Violation,
} from './_fence';
