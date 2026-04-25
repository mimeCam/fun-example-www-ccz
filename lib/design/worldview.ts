/**
 * Worldview chip-class manifest — single typed home for the four worldview
 * voices the Explore card paints.
 *
 * Lifted from `components/explore/ExploreArticleCard.tsx` per Mike napkin #51
 * and Tanya UX #58 §6. The `Record<FilterType, string>` shape is the
 * compile-time guard: a fifth worldview added to `types/filter.ts` flips
 * this file red on the same PR — the type system is the centrality fence.
 *
 * Three exports (Tanya §7):
 *   • WORLDVIEW_COLORS       — chip background+text Tailwind classes per worldview
 *   • WORLDVIEW_CHIP_LABELS  — capitalized human-readable labels (no raw keys)
 *   • WORLDVIEW_FALLBACK_BG  — chip background when worldview is undefined
 *
 * One helper:
 *   • worldviewChipClass(w?) — full class string with fallback baked in
 *
 * JIT-safety: every class string is emitted by `alphaClassOf` (a fixed-table
 * literal factory) or written verbatim — Tailwind's JIT cannot see template
 * interpolations like `bg-${family}/${pct}`. See `lib/design/alpha.ts:252`.
 *
 * Layout policy (Tanya UX §4): the worldview chip is the ONLY surface that
 * paints worldview color. Resonance, Mirror, Threshold, Thread, Keepsake,
 * Letter, Whisper — none of them adopt worldview hue. Ever. By spec.
 *
 * Credits:
 *   • Mike K. — architect napkin #51 (the shape, the pair rule, the
 *     `Record<FilterType, string>` typing call, the helper-owns-fallback
 *     polish, "polymorphism is a killer" — keep it a `Record`).
 *   • Tanya D. — UX spec #58 §3.3 (the `WORLDVIEW_CHIP_LABELS` upgrade —
 *     stops the chip from rendering raw lowercase identifiers; AAA polish),
 *     §4 (layout invariant — chip is not a theme), §6 (one register, four
 *     voices — all four chips share the `muted` rung).
 *   • Elon M. — first-principles teardown that named `Record<string,string>`
 *     as the typo trap; this module fixes it via `FilterType`.
 *   • Krystle C. (VP-Product) — original sprint pick: lift the manifest out
 *     of the component, type by `FilterType`, byte-identical render.
 */

import { alphaClassOf } from '@/lib/design/alpha';
import type { FilterType } from '@/types/filter';

// ─── Chip backgrounds — one register, four voices (muted rung, /30 alpha) ──

/**
 * Tailwind class string for each worldview chip — `bg-<family>/30 text-<voice>`.
 *
 * All four backgrounds resolve to the `muted` (0.30) rung — "the tag is
 * ambient chrome; the worldview is the voice." The text color carries the
 * voice. Routes through `alphaClassOf` so the JIT-visible literal is owned
 * by the alpha ledger, not by handwritten strings.
 *
 * Family map (Tanya UX §2):
 *   technical     → primary bg / accent text  (violet on muted-violet)
 *   philosophical → primary bg / primary text (violet on muted-violet, monochrome)
 *   practical     → cyan bg    / cyan text
 *   contrarian    → rose bg    / rose text
 *
 * The known overlap (technical+philosophical share the `primary` family) is
 * the four-vs-three-voices contradiction; Tanya UX §6 keeps them at the same
 * rung so the register reads as "one voice, two intents." A future taxonomy
 * collapse would touch this map and `types/filter.ts` together.
 */
export const WORLDVIEW_COLORS: Record<FilterType, string> = {
  technical:     `${alphaClassOf('primary', 'muted', 'bg')} text-accent`,
  philosophical: `${alphaClassOf('primary', 'muted', 'bg')} text-primary`,
  practical:     `${alphaClassOf('cyan',    'muted', 'bg')} text-cyan`,
  contrarian:    `${alphaClassOf('rose',    'muted', 'bg')} text-rose`,
};

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
