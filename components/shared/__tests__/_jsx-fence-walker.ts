/**
 * _jsx-fence-walker — one-line shim around the canonical walker kernel.
 *
 * The JSX call-site primitives (`SCAN_EXTS`, `isScannableFile`,
 * `walk`, `collectJsxFiles`, `relativePath`,
 * `stripCommentsAndTemplates`, `lineAt`, `readBalancedDelimiters`,
 * `preloadFiles`, `formatBlock`, `FilePreload`) lifted to
 * `lib/design/__tests__/_fence.ts` (Mike #41 napkin — "consolidate
 * the two existing walker kernels into one canonical home"). This
 * shim keeps the prior import surface so the ~9 remaining JSX-call-
 * site fences (`voice-call-site-fence`, `alpha-call-site-fence`,
 * `divider-fence`, `dismiss-verb-fence`, `overlay-header-fence`,
 * `gesture-call-site-fence`, `label-swap-width-fence`,
 * `action-receipt-fence`, `action-receipt-allowlist`) compile
 * unchanged. The mechanical sweep that retires this shim is a follow-
 * up commit (Mike #41 §4 NOT-MUST — explicitly deferred so this
 * commit stays inside the ~500 LOC scope).
 *
 * The two-API split (`runLinePatterns` vs `runJsxBlocks`) lives in
 * `_fence.ts` — see that module's JSDoc for the strip-strategy table
 * and the felt-experience appendix Tanya wrote.
 *
 * TODO: when the nine JSX-call-site callers above are re-pointed at
 * `lib/design/__tests__/_fence`, delete this shim. Tracked in Mike #41
 * napkin §4 as the "remaining ~15 import-path patches" sweep —
 * independent, mechanical, low-risk.
 */

export {
  SCAN_EXTS,
  isScannableFile,
  walk,
  collectJsxFiles,
  relativePath,
  stripCommentsAndTemplates,
  lineAt,
  readBalancedDelimiters,
  preloadFiles,
  formatBlock,
  type FilePreload,
} from '../../../lib/design/__tests__/_fence';
