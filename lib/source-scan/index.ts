/**
 * `lib/source-scan/` — pure, build-time helpers for honest text scans
 * over TypeScript / TSX source. **Not** reader-runtime: callers are
 * scripts under `scripts/` (audit, codegen). Distinct domain from
 * `lib/utils/` (reader-runtime helpers) and from `lib/content/`
 * (markdown→prose pipeline). One file per concern.
 *
 * Today's only export is `stripCommentsAndStrings` — the next scanner
 * inherits the same masked substrate (Mike #2 §1).
 */

export { stripCommentsAndStrings } from './strip-comments';

/**
 * `ScrubbedSource` — branded alias to mark "this string has had its
 * comment + string bodies blanked." Useful at scanner boundaries so a
 * regex consumer can require honest input by type, not by convention.
 */
export type ScrubbedSource = string & { readonly __scrubbed: unique symbol };
