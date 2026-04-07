/**
 * ResonancesClient — client shell for /resonances page.
 * Reads anon-reader-id from localStorage, fetches resonances + metrics + slots,
 * then renders sections: Carrying (alive), Shaped (faded), Evolution, Export.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  getResonancesWithArticleAction,
  getDepthMetricsAction,
  getSlotLimitsAction,
} from '@/app/actions/resonances';
import { getVitalityLabel } from '@/types/resonance-display';
import type { ResonanceWithArticle } from '@/types/resonance-display';
import type { DepthMetrics, SlotLimits } from '@/types/resonance';
import ResonanceEntry from './ResonanceEntry';
import EvolutionThread from './EvolutionThread';
import ResonanceExport from './ResonanceExport';

const ANON_KEY = 'anon-reader-id';

function getAnonId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ANON_KEY);
}

/** Separate resonances into carrying (alive) and shaped (faded). */
function splitByVitality(rs: ResonanceWithArticle[]) {
  const carrying = rs.filter(r => getVitalityLabel(r) === 'carrying');
  const shaped = rs.filter(r => getVitalityLabel(r) === 'shaped');
  return { carrying, shaped };
}

/** Format relative time: "Saved 3 days ago", "Saved today". */
function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Saved today';
  if (days === 1) return 'Saved yesterday';
  return `Saved ${days} days ago`;
}

/** Gem outline SVG — matches mirror page empty state icon. */
function GemIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M12 3l4 6-4 13-4-13z" />
    </svg>
  );
}

/** Slot indicator: filled ◆ and empty ◇ diamonds. */
function SlotIndicator({ used, total }: { used: number; total: number }) {
  return (
    <div className="text-center">
      <p className="text-xs text-mist">
        {Array.from({ length: total }, (_, i) =>
          i < used ? '◆' : '◇'
        ).join('')}
        <span className="ml-2">{used} of {total} resonances</span>
      </p>
      {used >= total && (
        <p className="text-xs text-gold/70 mt-1">
          Your resonance slots are full. Return to keep them breathing.
        </p>
      )}
    </div>
  );
}

export default function ResonancesClient() {
  const [resonances, setResonances] = useState<ResonanceWithArticle[]>([]);
  const [metrics, setMetrics] = useState<DepthMetrics | null>(null);
  const [slots, setSlots] = useState<SlotLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchData = useCallback(async () => {
    const id = getAnonId();
    if (!id) { setLoading(false); return; }

    const [rRes, mRes, sRes] = await Promise.all([
      getResonancesWithArticleAction(id),
      getDepthMetricsAction(id),
      getSlotLimitsAction(id),
    ]);

    if (rRes.success) setResonances(rRes.resonances ?? []);
    if (mRes.success) setMetrics(mRes.metrics ?? null);
    if (sRes.success) setSlots(sRes.slots ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { setMounted(true); fetchData(); }, [fetchData]);

  if (!mounted) return null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-80 h-48 rounded-3xl bg-gradient-to-b from-rose/10 to-surface/20 border border-rose/10 animate-pulse" />
    </div>
  );

  const { carrying, shaped } = splitByVitality(resonances);
  const isEmpty = resonances.length === 0;

  // Empty state — no resonances captured yet
  if (isEmpty) return (
    <div className="max-w-md mx-auto pt-20 text-center">
      <GemIcon className="mx-auto text-mist/30 mb-8" />
      <h1 className="text-2xl font-display font-bold text-[#f0f0f5] mb-3">
        Your chapter hasn&apos;t been written yet.
      </h1>
      <p className="text-mist text-sm mb-8 max-w-sm mx-auto leading-relaxed">
        Read something that stops you. Capture it. Tell it why it matters.
      </p>
      <Link href="/"
        className="inline-block px-6 py-3 bg-primary hover:bg-secondary text-white font-semibold rounded-xl transition-colors">
        Browse Articles →
      </Link>
    </div>
  );

  // Active state — render the Book of You
  return (
    <div className="max-w-2xl mx-auto pt-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <Link href="/" className="text-mist text-sm hover:text-primary transition-colors">
          &larr; Back
        </Link>
        <Link href="/mirror" className="text-mist text-sm hover:text-primary transition-colors">
          Your Mirror →
        </Link>
      </div>

      {/* Carrying section — alive resonances */}
      {carrying.length > 0 && (
        <section className="mb-10">
          <p className="text-xs uppercase tracking-widest text-mist mb-6">
            What you&apos;re still carrying
          </p>
          {carrying.map((r, i) => (
            <div key={r.id}>
              <ResonanceEntry resonance={r} timeAgo={formatTimeAgo(r.createdAt)} />
              {/* Whisper between entries */}
              {i < carrying.length - 1 && (
                <EvolutionThread position={i} total={carrying.length} />
              )}
            </div>
          ))}
        </section>
      )}

      {/* Divider between sections */}
      {carrying.length > 0 && shaped.length > 0 && (
        <div className="h-px bg-fog my-10" />
      )}

      {/* Shaped section — faded resonances */}
      {shaped.length > 0 && (
        <section className="mb-10">
          <p className="text-xs uppercase tracking-widest text-mist mb-6">
            What shaped you
          </p>
          {shaped.map((r) => (
            <ResonanceEntry key={r.id} resonance={r} timeAgo={formatTimeAgo(r.createdAt)} faded />
          ))}
        </section>
      )}

      {/* Slot indicator */}
      {slots && (
        <div className="my-10">
          <SlotIndicator used={slots.usedSlots} total={slots.currentSlots} />
        </div>
      )}

      {/* Export */}
      {resonances.length > 0 && (
        <div className="mb-10">
          <ResonanceExport resonances={resonances} />
        </div>
      )}

      {/* Footer navigation */}
      <div className="h-px bg-fog mb-8" />
      <div className="flex justify-center gap-6 text-xs pb-12">
        <Link href="/" className="text-primary hover:text-accent transition-colors">
          &larr; Back to Articles
        </Link>
        <Link href="/mirror" className="text-primary hover:text-accent transition-colors">
          Your Mirror →
        </Link>
      </div>
    </div>
  );
}
