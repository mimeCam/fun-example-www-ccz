/**
 * ResonanceEntry — a single resonance card in the Book of You.
 * Two visual states: alive (carrying) with rose glow, or faded (shaped) with dimmed mist.
 */
'use client';

import Link from 'next/link';
import type { ResonanceWithArticle } from '@/types/resonance-display';

interface Props {
  resonance: ResonanceWithArticle;
  timeAgo: string;
  faded?: boolean;
}

/** Small gem icon for the card label. */
function CardGem({ faded }: { faded?: boolean }) {
  const color = faded ? 'text-mist/30' : 'text-rose/70';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={color}>
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M12 3l4 6-4 13-4-13z" />
    </svg>
  );
}

/** Vitality bar — rose gradient for alive, empty for faded. */
function VitalityBar({ vitality, faded }: { vitality: number; faded?: boolean }) {
  if (faded) return (
    <div className="h-1.5 rounded-full bg-fog/30 w-full" />
  );

  const pct = Math.min(100, Math.round((vitality / 30) * 100));
  return (
    <div className="h-1.5 rounded-full bg-fog/30 w-full overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-rose to-rose/60 transition-all duration-500"
        style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ResonanceEntry({ resonance, timeAgo, faded }: Props) {
  const base = 'rounded-3xl p-6 my-8 transition-all duration-300';
  const alive = 'bg-surface/60 border-l-4 border-rose shadow-rose-glow';
  const dimmed = 'bg-surface/30 border-l-4 border-rose/30 opacity-60';
  const cls = `${base} ${faded ? dimmed : alive}`;

  return (
    <div className={cls}>
      {/* Label */}
      <div className="flex items-center gap-2 mb-3">
        <CardGem faded={faded} />
        <span className="text-xs uppercase tracking-widest text-mist">
          {faded ? 'Faded' : 'Your resonance'}
        </span>
      </div>

      {/* Captured quote */}
      {resonance.quote && (
        <p className="text-[#f0f0f5]/70 italic text-[0.9375rem] max-w-[55ch] mb-3">
          &ldquo;{resonance.quote}&rdquo;
        </p>
      )}

      {/* Gold divider */}
      <div className="h-px max-w-[120px] bg-gold/30 mb-3" />

      {/* Reader's note */}
      <p className="text-rose italic text-[0.9375rem] leading-[1.7] mb-4">
        {resonance.resonanceNote}
      </p>

      {/* Fog divider */}
      <div className="h-px bg-fog mb-3" />

      {/* Article link + metadata */}
      <Link href={`/article/${resonance.articleId}`}
        className="text-primary hover:text-accent transition-colors text-sm font-medium">
        {resonance.articleTitle}
      </Link>

      <p className="text-mist/50 text-xs mt-1">
        {timeAgo} · Vitality: {resonance.vitality}
      </p>

      {/* Vitality bar */}
      <div className="mt-3">
        <VitalityBar vitality={resonance.vitality} faded={faded} />
      </div>
    </div>
  );
}
