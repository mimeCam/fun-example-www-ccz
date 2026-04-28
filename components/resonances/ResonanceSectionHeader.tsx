/**
 * ResonanceSectionHeader — section label for the Book of You.
 *
 * Appears as part of the page's SuspenseFade crossfade (120ms); no separate
 * entrance animation is needed. Motion vocabulary: the cards below rise,
 * the headers are structure. Keep it still.
 *
 * Two tones, both from the existing palette, both at the SAME `recede` rung
 * (Tanya UIX #80 §2 / #90 §3.1 — "two warmths, one volume"):
 *   gold — "what shaped you" (faded shaped section)
 *   mist — "what's carrying you" (alive carrying section)
 *
 * The tones differ by hue, not by volume. Temperature lives in the colour
 * family; the rung anchors both labels at the same step-back so the visitor
 * reads the chapter — never the label. The page has two chapters; both are
 * announced in one register. Sister-surface symmetry with `ResonanceEntry`'s
 * alive surface (`alphaClassOf('surface','recede','bg')` = `bg-surface/50`):
 * the section header is a sibling of the body, not a louder cousin.
 *
 * Felt-sentence calibration: `recede` = "the frame around the subject;
 * bylines, captions, attribution." If the rung reads too quiet on the void
 * background at the felt-sentence review (Tanya UIX #90 §3.1; Krystle
 * risk-register fallback), drop both tones to `quiet` together — drift on
 * one and you re-introduce the asymmetry the snap exists to fix.
 *
 * Credits: Mike K. (napkin #29 — original ResonanceSectionHeader spec; #115
 * — the snap, hoist, fence + grandfather-shrink napkin), Tanya D. (UIX #64
 * — motion.enter timing note + original tone palette; UIX #80 — role-based
 * 4-rung vocabulary; UIX #90 — "two warmths, one volume" layout-fix that
 * gave `mist` a real call-site), Elon M. (the §4 same-rung fence — naming
 * without measurement is the first place AAA quality starts to rot),
 * Paul K. ("section reads as a temperature signature, not a label slapped
 * above" — the felt-sentence review gate this rung calibration honours).
 */

import { alphaClassOf, type AlphaRung } from '@/lib/design/alpha';
import { wrapClassOf } from '@/lib/design/typography';

interface Props {
  label: string;
  tone?: 'gold' | 'mist';
}

/* ─── Alpha-ledger handles (JIT-safe literals via alphaClassOf) ─────────────
   Both tones land on the same rung — `recede` ("the frame around the
   subject"). The pair-rule lives in the pixel (`alphaOf(GOLD_RUNG) ===
   alphaOf(MIST_RUNG)`) rather than in a doc word; the per-file SSR pin's
   §4 is the only thing earning the symmetry's keep until a third call-site
   demands a named idiom (Mike #115 §1 / Elon §3 — rule of three). */
const GOLD_RUNG: AlphaRung = 'recede';
const MIST_RUNG: AlphaRung = 'recede';
const GOLD_TEXT = alphaClassOf('gold', GOLD_RUNG, 'text'); // text-gold/50
const MIST_TEXT = alphaClassOf('mist', MIST_RUNG, 'text'); // text-mist/50

const TONE_CLASS: Record<NonNullable<Props['tone']>, string> = {
  gold: GOLD_TEXT,
  mist: MIST_TEXT,
};

/* ─── Wrap policy — `caption` rhythm, `heading` break (Mike #122 §4) ────────
   Multi-word labels (`WHAT'S CARRYING YOU`) cannot orphan a final word at
   320 px; single-word labels (`BLEND`) get a silent CSS no-op. The literal
   `typo-wrap-heading` lives in `wrapClassOf` and `app/globals.css` only;
   pinned by `caption-heading-wrap-converges.fence.test.ts`. */
const HEADING_WRAP = wrapClassOf('heading');

/** Section label — micro uppercase, token-mapped tone, no animation. */
export function ResonanceSectionHeader({ label, tone = 'gold' }: Props) {
  return (
    <p className={`text-sys-micro uppercase tracking-sys-caption mb-sys-7 ${TONE_CLASS[tone]} ${HEADING_WRAP}`}>
      {label}
    </p>
  );
}

/**
 * Test seam — exposes the module-scope alpha-ledger handles so the per-file
 * adoption test can pin every rung tag without spinning up a renderer for
 * every assertion. Mirrors the `__testing__` idiom on `ResonanceEntry`,
 * `EvolutionThread`, and `ResonanceDrawer` (Mike #19 §5; #111 §4.1; #115 §3).
 */
export const __testing__ = {
  GOLD_RUNG,
  MIST_RUNG,
  GOLD_TEXT,
  MIST_TEXT,
  TONE_CLASS,
  HEADING_WRAP,
} as const;
