/**
 * Canonical article prose pipeline — single owner of the markdown→prose
 * contract. Two public, composable siblings:
 *
 *   • `stripMarkdownTokens(s)` — markdown tokens only.
 *     **Preserves `\n\n`** so callers that care about paragraph rhythm
 *     (e.g. PortalHero, the Threshold) can split on blank lines AFTER
 *     the strip, not before.
 *
 *   • `collapseWhitespace(s)` — squashes every whitespace run to a
 *     single space and trims the ends. Use it AFTER the strip when a
 *     surface needs flowing prose (cards, search snippets, RSS).
 *
 * `excerpt()` is a recomposition of both, plus the word-honest clip
 * and the typographic-ellipsis policy. Pure · synchronous · archetype-blind.
 *
 * Centrality rule (enforced by `centrality-guard.test.ts`):
 *   No surface re-derives the strip pipeline. Import these functions;
 *   do not re-implement them. If a new surface needs a different shape,
 *   compose these — do not fork.
 *
 * Code-point-correct length math (`Array.from(s).length`, never `s.length`)
 * lives only in `clipToBudget` — strip operates on regex, not code points.
 */

const ELLIPSIS = '…';
const DEFAULT_MAX = 160;
const SENTENCE_END = /[.?!]$/;
const SOFT_TAIL = /[,;:]+$/;

// ─── markdown-only strips (paragraph breaks preserved) ─────────────

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

/**
 * Strip markdown tokens; preserve paragraph breaks (`\n\n`).
 *
 * The whitespace policy is the caller's choice — pair with
 * `collapseWhitespace` for flowing prose, or split on `/\n\n+/` for
 * paragraph-honest surfaces (e.g. PortalHero).
 *
 * Order matters:
 *   1. line markers first — `# ` / `> ` / `- ` must be stripped before
 *      `*` / `_` emphasis runs to avoid `**` (paired bold) being read
 *      as `* ` (list bullet) at line start.
 *   2. images before links — image syntax is a superset of link syntax
 *      (`![alt](u)` would otherwise match the link regex, leaving `!`).
 *   3. emphasis before code — backticks inside emphasis are content,
 *      not a code fence; stripping emphasis first keeps the inner text.
 */
export function stripMarkdownTokens(s: string): string {
  if (!s) return '';
  return stripCode(
    stripEmphasis(stripLinks(stripImages(stripLineMarkers(s)))),
  );
}

/** Collapse every whitespace run to a single space; trim. */
export function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

// ─── excerpt() — the flowing-prose composition ─────────────────────

/** Code-point-correct clip; word-honest when whitespace exists in window. */
function clipToBudget(s: string, max: number): string {
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
  const plain = collapseWhitespace(stripMarkdownTokens(content));
  if (!plain) return '';
  return withTail(clipToBudget(plain, max), plain);
}
