/**
 * ResonanceSectionHeader — section label for the Book of You.
 *
 * Appears as part of the page's SuspenseFade crossfade (120ms); no separate
 * entrance animation is needed. Motion vocabulary: the cards below rise,
 * the headers are structure. Keep it still.
 *
 * Two tones, both from the existing palette:
 *   gold — "what shaped you" (faded shaped section)
 *   mist — "carrying" style (alive carrying section, if ever needed)
 *
 * Credits: Mike K. (napkin #29 — ResonanceSectionHeader spec),
 *          Tanya D. (UIX #64 — motion.enter timing note, gold/40 palette).
 */

interface Props {
  label: string;
  tone?: 'gold' | 'mist';
}

const TONE_CLASS: Record<NonNullable<Props['tone']>, string> = {
  gold: 'text-gold/40',
  mist: 'text-mist/60',
};

/** Section label — micro uppercase, token-mapped tone, no animation. */
export function ResonanceSectionHeader({ label, tone = 'gold' }: Props) {
  return (
    <p className={`text-sys-micro uppercase tracking-sys-caption mb-sys-7 ${TONE_CLASS[tone]}`}>
      {label}
    </p>
  );
}
