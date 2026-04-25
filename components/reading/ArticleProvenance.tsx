/**
 * ArticleProvenance — the room's quiet bow at the TOP of the printed page.
 * Greeting bow, paired with the parting `ReadersMark` colophon. Renders
 * ONLY in print; hidden on screen via the shared `.print-only` cascade.
 *
 *   ─────────────────              ← top hairline      (16ch · 0.4pt #000)
 *   by Anton ·  25 April 2026      ← byline · long-form date
 *   example.com/articles/foo       ← canonical URL, plain text
 *   ─────────────────              ← bottom hairline   (16ch · 0.4pt #000)
 *
 * Why paper-only (Tanya UX #8 §2 — "the asymmetry is the design"):
 *   - The screen already has `<h1>` + read-time. Doubling that with a
 *     byline + date + URL would compete with the centerpiece.
 *   - Paper is permanent and deserves provenance.
 *   - Same DOM serves two readers — the scroller and the printer —
 *     without either feeling shortchanged.
 *
 * Reader-invariant by deliberate scope (Mike #20 §6.1):
 *   - Provenance is article-invariant, not reader-variant. We do NOT
 *     subscribe to the thread driver here. Mixing article- and reader-
 *     variant data on paper would force a 2nd carve-out and erode
 *     ReadersMark's status as the *only* per-reader artifact in print.
 *   - Always renders (no zero-state). The article had a title and an
 *     author the moment the page loaded; there is no "earned vs unearned"
 *     question for the greeting bow.
 *
 * Geometry mirrors `ReadersMark` byte-for-byte at the hairline (16ch /
 * 0.4pt #000). The two bows are typographically identical so the printed
 * page reads as bracketed by one hand at top and bottom (Tanya §3.1, the
 * visual rhyme that is the entire deliverable).
 *
 * Class hooks only — no inline color or letter-spacing literals. All
 * visual styling lives in `lib/design/print-surface.css` so the
 * color-adoption and typography-adoption ledgers stay clean (Mike #20
 * §6.3). The shared hairline rule is `.print-hairline`, consumed by
 * BOTH this component and ReadersMark.
 *
 * Credits: Tanya D. (UX #8 — bracketed-page rhyme, paper-only asymmetry,
 * 16ch hairline parity, long-form locale-aware date, no-caption
 * discipline), Mike K. (#20 — napkin shape, `.print-hairline` rename,
 * stateless / no-thread-driver carve-out, JSDoc-first scaffold), Paul K.
 * (the bracketed-page outcome), Elon M. (the boring class name, the
 * preamble trim), Krystle C. (the original component spec), Jason F.
 * (the two-paper-gestures-paired-bows intuition).
 */
'use client';

import { useEffect, useState } from 'react';
import type { Article } from '@/lib/content/ContentTagger';
import { formatReaderLongDate } from '@/lib/utils/reader-locale';

/** Default byline when the Article record has no `author` field. */
const DEFAULT_AUTHOR = 'Anton';

/** Interpunct-with-spaces — same separator the rest of the codebase uses
 *  for inline meta. Lives at module scope so tests can pin the literal. */
const META_SEPARATOR = ' · ';

/**
 * Format an ISO date as a long-form, locale-aware string. Delegates to
 * the reader-locale substrate (`formatReaderLongDate`) so the printer's
 * locale picks up the same way it does on screen — UK → "25 April 2026",
 * US → "April 25, 2026". Both are correct on paper. The substrate is
 * comment-blind, the centrality guard now covers the paper too. Five-
 * character edit at the call site, zero pixel delta on paper (Tanya §5).
 */
export function formatLongDate(iso: string | undefined): string {
  return formatReaderLongDate(iso);
}

/** Compose the byline · date line. Pure, deterministic, ≤10 LOC. */
export function buildMetaLine(author: string, dateLong: string): string {
  const left = `by ${author}`;
  return dateLong ? left + META_SEPARATOR + dateLong : left;
}

/**
 * Resolve the canonical URL on the client. SSR fallback is the route
 * path so the printed page is never blank when JS is disabled. ≤10 LOC.
 */
function useCanonicalHref(fallbackPath: string): string {
  const [href, setHref] = useState<string>(fallbackPath);
  useEffect(() => {
    if (typeof window !== 'undefined') setHref(window.location.href);
  }, []);
  return href;
}

/** Hairline rule — geometry pinned in `print-surface.css` (.print-hairline). */
function HairlineRule() {
  return <hr aria-hidden="true" className="print-hairline" />;
}

/** The body of the greeting bow — meta line + canonical URL line. */
function ProvenanceBody({ meta, href }: { meta: string; href: string }) {
  return (
    <div className="article-provenance-body">
      <span className="article-provenance-meta">{meta}</span>
      <span className="article-provenance-href">{href}</span>
    </div>
  );
}

/**
 * ArticleProvenance — paper-only greeting bow. Always renders (no zero-
 * state). Wrapper class `.print-only` (display:none unless @media print)
 * lives in print-surface.css; `data-article-provenance` is the component's
 * stable hook for tests + future consumers.
 */
export function ArticleProvenance({ article }: { article: Article }) {
  const author = ((article as { author?: string }).author ?? DEFAULT_AUTHOR).trim() || DEFAULT_AUTHOR;
  const dateLong = formatLongDate(article.publishedAt);
  const meta = buildMetaLine(author, dateLong);
  const href = useCanonicalHref(`/article/${article.id}`);
  return (
    <aside
      data-article-provenance
      className="print-only article-provenance"
      aria-hidden="true"
    >
      <HairlineRule />
      <ProvenanceBody meta={meta} href={href} />
      <HairlineRule />
    </aside>
  );
}

/** Re-exported for tests — keeps the pure helpers reachable without
 *  exposing the React component's internal seams. */
export const __testing__ = { formatLongDate, buildMetaLine, DEFAULT_AUTHOR, META_SEPARATOR };
