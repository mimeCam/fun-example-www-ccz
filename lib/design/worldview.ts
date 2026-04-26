/**
 * Worldview chip-class manifest — single typed home for the four worldview
 * voices the Explore card paints.
 *
 * **Adopted policy (Tanya UX #10 §4.2 — replaces the prior manifesto).**
 * Worldview color is rendered exclusively by the Explore chip. No other
 * surface in the journey adopts worldview hue. `accent` continues to serve
 * as a recognition-surface color in `ReturnLetter` and `NextRead` per their
 * existing usage; it is not promoted to "the philosophical register of the
 * system." See `lib/design/voice-ledger.ts` — `chip` is the only Surface
 * row that lists `worldview.*` voices.
 *
 * Lifted from `components/explore/ExploreArticleCard.tsx` per Mike napkin #51
 * and Tanya UX #58 §6. The `Record<FilterType, string>` shape is the
 * compile-time guard: a fifth worldview added to `types/filter.ts` flips
 * this file red on the same PR — the type system is the centrality fence.
 *
 * Four exports:
 *   • WORLDVIEW_COLORS       — chip background+text Tailwind classes per worldview
 *   • WORLDVIEW_CHIP_LABELS  — capitalized human-readable labels (no raw keys)
 *   • WORLDVIEW_GLYPHS       — abstract leadin glyph per worldview (Tanya UX #10 §2)
 *   • WORLDVIEW_FALLBACK_BG  — chip background when worldview is undefined
 *
 * Helpers:
 *   • worldviewChipClass(w?) — full class string with fallback baked in
 *   • worldviewChipLabel(w?) — human-readable label
 *   • worldviewChipGlyph(w?) — semiotic discriminator (principle #7)
 *
 * JIT-safety: every class string is emitted by `alphaClassOf` (a fixed-table
 * literal factory) or written verbatim — Tailwind's JIT cannot see template
 * interpolations like `bg-${family}/${pct}`. See `lib/design/alpha.ts:252`.
 *
 * Credits:
 *   • Mike K. — architect napkin #51 + #54 (the `Record<…>` shape, the
 *     "polymorphism is a killer" call, the Voice Ledger fence the
 *     `philosophical → accent` realignment lands inside).
 *   • Tanya D. — UX spec #58 §3.3 + #10 §2 (the `WORLDVIEW_CHIP_LABELS`
 *     upgrade, the glyph layer per principle #7 "don't rely on color
 *     alone", the honest layout-policy paragraph above).
 *   • Krystle C. / Jason F. — #66 / #71 (the philosophical → accent
 *     mechanical realignment that ships as one row of this map).
 *   • Elon M. — first-principles teardown that named "two violets at chip
 *     size = two violets" — the perceptual driver behind the glyph layer.
 */

import { alphaClassOf } from '@/lib/design/alpha';
import type { FilterType } from '@/types/filter';

// ─── Chip backgrounds — one register, four voices (hairline rung, /10) ───

/**
 * Tailwind class string for each worldview chip — `bg-<family>/10 text-<voice>`.
 *
 * All four backgrounds resolve to the `hairline` (0.10) rung — "the tag is
 * geometry; the worldview is the voice." The text color carries the voice.
 * Routes through `alphaClassOf` so the JIT-visible literal is owned by the
 * alpha ledger, not by handwritten strings.
 *
 * **Fall-path receipt (2026-04-26):** the family rung stepped *muted (0.30)
 * → hairline (0.10)* atomically — all four chips + the `fog`/`mist`
 * fallback together — when `chip-contrast-audit.test.ts` proved the `cyan`
 * and `rose` pairs dipped below the WCAG 4.5:1 floor against
 * `THERMAL.surface` and `THERMAL_WARM.surface` at the prior rung
 * (worst case before step: `voice.rose / worldview.rose @ warm = 3.52:1`).
 * After the step every pair clears the floor with headroom (see the
 * audit's worst-case console line). One register, four voices, one PR
 * — Tanya UX #62 §2 ("no per-chip override; the audit catches, the human
 * steps"); Krystle's audit-spec; Mike napkin #95 §"Atomic fail-path".
 *
 * Family map (Tanya UX #10 §2.2 — Krystle/Jason realignment lands here):
 *   technical     → primary bg / accent text  (violet on hairline-violet)
 *   philosophical → primary bg / accent text  (was `text-primary`; flipped
 *                   to share `accent` with technical so the chip stops
 *                   asserting two perceptually-identical violets)
 *   practical     → cyan bg    / cyan text
 *   contrarian    → rose bg    / rose text
 *
 * The known overlap (technical+philosophical share the `primary` family AND
 * now `text-accent`) is the four-vs-three-voices contradiction. The glyph
 * layer (`WORLDVIEW_GLYPHS` below) is the non-color discriminator that lets
 * the four chips read as four voices regardless of monitor / color-vision
 * (principle #7 — don't rely on color alone). A future taxonomy collapse to
 * three worldviews would touch this map, `WORLDVIEW_GLYPHS`, and
 * `types/filter.ts` together — see AGENTS.md follow-ons.
 */
export const WORLDVIEW_COLORS: Record<FilterType, string> = {
  technical:     `${alphaClassOf('primary', 'hairline', 'bg')} text-accent`,
  philosophical: `${alphaClassOf('primary', 'hairline', 'bg')} text-accent`,
  practical:     `${alphaClassOf('cyan',    'hairline', 'bg')} text-cyan`,
  contrarian:    `${alphaClassOf('rose',    'hairline', 'bg')} text-rose`,
};

// ─── Chip glyphs — semiotic discriminator (Tanya UX #10 §2.3) ─────────────

/**
 * Single-character abstract glyph leading the chip label. The glyph is the
 * non-color discriminator that survives:
 *   • color-blindness — two violets become identical to a deuteranope; `▣`
 *     vs `◇` does not.
 *   • chip size — at 11px text, color differences below ~8 ΔE blur. Shape
 *     contrast is binary, never blurry.
 *   • screenshots — keepsake-like share moments where the chip ends up on
 *     a phone in sunlight: shape carries.
 *
 * Picked from the existing geometric repertoire (no new icon font, no SVG
 * asset) — one Unicode character in the chip's existing text node. Per
 * `prefer-icons-over-text.md` (Picture Superiority): the reader registers
 * the worldview in one glance.
 *
 * Glyphs are deliberately ABSTRACT (not literal icons). Worldview is a
 * register, not a topic — abstract shapes don't lie about meaning.
 *
 * Accessibility: the glyph is `aria-hidden` at the call site — a screen
 * reader hears `Technical`, not "Technical, square inside square."
 */
export const WORLDVIEW_GLYPHS: Record<FilterType, string> = {
  technical:     '▣',
  philosophical: '◇',
  practical:     '▲',
  contrarian:    '◯',
};

/** Fallback glyph — a centered dot, lowest visual weight, no register. */
const WORLDVIEW_FALLBACK_GLYPH = '·';

// ─── Chip labels — capitalized, present-tense (Tanya UX §3.3) ──────────────

/**
 * Human-readable label for each worldview chip. The chip used to render
 * `{article.worldview}` directly — i.e. the raw lowercase key `"technical"`,
 * `"philosophical"`, etc. — which read as a debug tag, not a tasteful label.
 *
 * `FILTER_TEMPLATES.title` doesn't fit a `text-sys-micro` chip — those are
 * long ("Deep Technical Dive") and built for the filter card. Two surfaces,
 * two labels. This map owns the chip-sized label.
 */
export const WORLDVIEW_CHIP_LABELS: Record<FilterType, string> = {
  technical:     'Technical',
  philosophical: 'Philosophical',
  practical:     'Practical',
  contrarian:    'Contrarian',
};

// ─── Fallback chrome — when worldview is undefined or unrecognized ─────────

/**
 * Chip background when no worldview is set on the article. Same `muted` rung
 * as the four named voices (one register), but `fog` family — neutral, no
 * voice. Paired with `text-mist` at the call site via `worldviewChipClass`.
 */
export const WORLDVIEW_FALLBACK_BG: string = alphaClassOf('fog', 'muted', 'bg');

/** Fallback text color — neutral mist, no voice. */
const WORLDVIEW_FALLBACK_TEXT = 'text-mist';

// ─── Helper — fallback baked in so call sites cannot forget it ─────────────

/**
 * Full chip class string for a worldview. Pure, ≤ 10 LOC.
 *
 * `worldviewChipClass(undefined)` returns the fallback chrome — the
 * fallback lives INSIDE the helper so a forgetful call site cannot ship a
 * blank chip. Mike napkin #51 §5 #4 — "one less footgun."
 */
export function worldviewChipClass(w?: FilterType): string {
  if (w === undefined) return `${WORLDVIEW_FALLBACK_BG} ${WORLDVIEW_FALLBACK_TEXT}`;
  return WORLDVIEW_COLORS[w] ?? `${WORLDVIEW_FALLBACK_BG} ${WORLDVIEW_FALLBACK_TEXT}`;
}

/**
 * Chip text label for a worldview. Pure, ≤ 10 LOC.
 *
 * Falls back to an em-dash when undefined — the chip is still visible
 * (chrome is painted by `worldviewChipClass`) but carries no voice.
 */
export function worldviewChipLabel(w?: FilterType): string {
  if (w === undefined) return '—';
  return WORLDVIEW_CHIP_LABELS[w] ?? '—';
}

/**
 * Chip glyph for a worldview — non-color discriminator (principle #7).
 * Falls back to a centered dot when undefined. Pure, ≤ 10 LOC.
 *
 * The glyph element MUST be marked `aria-hidden` at the call site
 * (Tanya UX #10 §7.2). Screen readers hear the label; sighted readers
 * register the shape.
 */
export function worldviewChipGlyph(w?: FilterType): string {
  if (w === undefined) return WORLDVIEW_FALLBACK_GLYPH;
  return WORLDVIEW_GLYPHS[w] ?? WORLDVIEW_FALLBACK_GLYPH;
}

// ─── Glyph optical compensation (Tanya UX #62 §4.1) ───────────────────────

/**
 * Per-glyph Tailwind nudge utilities. Filled glyphs (`▣`) sit visibly
 * lower than line-only glyphs (`◇`, `◯`) at `text-sys-micro` because
 * their ink density centres below the optical line. A 0.5px lift
 * brings `▣` onto the same baseline rhythm as the others.
 *
 * `▲` (Practical) deliberately gets no nudge — its downward point reads
 * as "forward," and that suits the worldview voice (Tanya §4.1 table).
 *
 * One Tailwind utility, no per-glyph component, no ceremony. The
 * `relative -top-[0.5px]` literal must appear verbatim in source for
 * the JIT scanner to emit it (no template interpolation).
 */
const WORLDVIEW_GLYPH_NUDGE: Partial<Record<FilterType, string>> = {
  technical: 'relative -top-[0.5px]',
};

/**
 * Glyph-span className for the chip leadin — base spacing + per-glyph
 * optical compensation. Pure, ≤ 10 LOC. The chip call site spreads
 * this onto the `<span aria-hidden>` that wraps the glyph character.
 */
export function worldviewChipGlyphClass(w?: FilterType): string {
  const base = 'mr-sys-1';
  const nudge = w ? (WORLDVIEW_GLYPH_NUDGE[w] ?? '') : '';
  return nudge ? `${base} ${nudge}` : base;
}
