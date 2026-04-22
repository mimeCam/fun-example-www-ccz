/**
 * ResonanceEntry — a single resonance card in the Book of You.
 * Two visual states: alive (carrying) with rose glow, or faded (shaped) with dimmed mist.
 */
'use client';

import { TextLink } from '@/components/shared/TextLink';
import { GemIcon } from '@/components/shared/GemIcon';
import type { ResonanceWithArticle } from '@/types/resonance-display';

interface Props {
  resonance: ResonanceWithArticle;
  timeAgo: string;
  faded?: boolean;
  closingLine?: string;
}

/** Small gem icon for the card label. */
function CardGem({ faded }: { faded?: boolean }) {
  const color = faded ? 'text-mist/30' : 'text-rose/70';
  return <GemIcon size="xs" className={color} />;
}

/** Vitality bar — rose gradient for alive, empty for faded. */
function VitalityBar({ vitality, faded }: { vitality: number; faded?: boolean }) {
  if (faded) return (
    <div className="h-1.5 rounded-sys-full bg-fog/30 w-full" />
  );

  const pct = Math.min(100, Math.round((vitality / 30) * 100));
  return (
    <div className="h-1.5 rounded-sys-full bg-fog/30 w-full overflow-hidden">
      <div className="h-full rounded-sys-full bg-gradient-to-r from-rose to-rose/60 transition-all duration-fade"
        style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ResonanceEntry({ resonance, timeAgo, faded, closingLine }: Props) {
  // `shadow-rose-glow` is a tinted accent outside the six-beat ledger
  // (TINTED_ACCENTS in lib/design/elevation.ts); this file is one of two
  // allow-listed homes for it — the reader's own voice carrying warmth.
  const base = 'rounded-sys-medium p-sys-7 my-sys-8 transition-all duration-enter';
  const alive = 'bg-surface/60 border-l-4 border-rose shadow-rose-glow';
  const dimmed = 'bg-surface/30 border-l-4 border-rose/30 opacity-60';
  const cls = `${base} ${faded ? dimmed : alive}`;

  return (
    <div className={cls}>
      {/* Label */}
      <div className="flex items-center gap-sys-3 mb-sys-4">
        <CardGem faded={faded} />
        <span className="text-sys-micro uppercase tracking-widest text-mist">
          {faded ? 'Faded' : 'Something that stayed with you'}
        </span>
      </div>

      {/* Captured quote */}
      {resonance.quote && (
        <p className="text-foreground/70 italic text-sys-body max-w-prose-sm mb-sys-4">
          &ldquo;{resonance.quote}&rdquo;
        </p>
      )}

      {/* Gold divider */}
      <div className="h-px max-w-divider bg-gold/20 mb-sys-4" />

      {/* Reader's note */}
      <p className="text-rose italic text-sys-body leading-[var(--token-line-height)] mb-sys-5">
        {resonance.resonanceNote}
      </p>

      {/* Fog divider */}
      <div className="h-px bg-fog mb-sys-4" />

      {/* Article link + metadata */}
      <TextLink variant="inline" href={`/article/${resonance.articleId}`}
        className="text-sys-caption font-sys-accent">
        {resonance.articleTitle}
      </TextLink>

      <p className="text-mist/50 text-sys-micro mt-sys-1">
        {timeAgo}
      </p>

      {/* Vitality bar */}
      <div className="mt-sys-4">
        <VitalityBar vitality={resonance.vitality} faded={faded} />
      </div>

      {/* Closing line — farewell for shaped resonances */}
      {faded && closingLine && (
        <p className="mt-sys-5 text-gold/50 italic text-sys-micro typo-caption">
          {closingLine}
        </p>
      )}
    </div>
  );
}
