/**
 * Canonical article excerpt — the cold open's typographic contract.
 *
 * Strips markdown, collapses whitespace, clips at the last word boundary,
 * appends a single `…` (U+2026) only when truncation actually happened.
 * Sentence-terminated clips omit the ellipsis on purpose — three periods
 * after a period is the most common typographic crime in CMS-driven blogs.
 *
 * Pure · synchronous · archetype-blind. The cold open precedes the Mirror
 * by design; warming the excerpt would betray that promise.
 *
 * Code-point-correct length math (`Array.from(s).length`, never `s.length`)
 * — emoji and CJK never break a surrogate pair at the clip.
 *
 * Use this; do not re-implement. Excerpts are a single-source contract:
 * if you need a different shape, extend this function — do not fork it.
 */

const ELLIPSIS = '…';
const DEFAULT_MAX = 160;
const SENTENCE_END = /[.?!]$/;
const SOFT_TAIL = /[,;:]+$/;

function stripImages(s: string): string {
  return s.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
}

function stripLinks(s: string): string {
  return s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

/** Strip *paired* emphasis only — preserves stray glyphs like `*nix`. */
function stripEmphasis(s: string): string {
  return s
    .replace(/\*\*([^\s*][^*]*?)\*\*/g, '$1')
    .replace(/\*([^\s*][^*]*?)\*/g, '$1')
    .replace(/__([^\s_][^_]*?)__/g, '$1')
    .replace(/_([^\s_][^_]*?)_/g, '$1');
}

function stripCode(s: string): string {
  return s.replace(/`([^`]+)`/g, '$1');
}

function stripLineMarkers(s: string): string {
  return s.replace(/^[ \t]*(#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s*)/gm, '');
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function normalize(content: string): string {
  const stripped = stripCode(
    stripEmphasis(stripLinks(stripImages(stripLineMarkers(content)))),
  );
  return collapseWhitespace(stripped);
}

/** Code-point-correct clip; word-honest when whitespace exists in window. */
function clipToBudget(s: string, max: number): string {
  // BMP fast-path: s.length is an upper bound on code-point count.
  if (s.length <= max) return s;
  const points = Array.from(s);
  if (points.length <= max) return s;
  const head = points.slice(0, max).join('');
  const lastSpace = head.lastIndexOf(' ');
  return lastSpace > 0 ? head.slice(0, lastSpace) : head;
}

/** Trim soft-tail punctuation — never render `…dawn,…`. */
function trimSoftTail(s: string): string {
  return s.replace(SOFT_TAIL, '').trimEnd();
}

function withTail(clipped: string, plain: string): string {
  if (clipped === plain) return clipped;
  const trimmed = trimSoftTail(clipped);
  return SENTENCE_END.test(trimmed) ? trimmed : trimmed + ELLIPSIS;
}

/**
 * Canonical article excerpt. Strips markdown, collapses whitespace,
 * clips at the last word boundary, appends a typographic ellipsis only
 * when truncation actually happened.
 *
 * @param content - Raw article body (may contain markdown).
 * @param max     - Soft character ceiling. Default 160.
 * @returns Cleaned excerpt; never longer than `max + 1` (the ellipsis).
 */
export function excerpt(content: string, max: number = DEFAULT_MAX): string {
  if (!content) return '';
  const plain = normalize(content);
  if (!plain) return '';
  return withTail(clipToBudget(plain, max), plain);
}
