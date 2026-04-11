/**
 * ResonancesClient — client shell for /resonances page.
 * Reads anon-reader-id from localStorage, fetches resonances + metrics + slots,
 * then renders sections: Carrying (alive), Shaped (faded), Evolution, Export.
 *
 * Now builds BookNarrationContext for data-driven EvolutionThread whispers
 * and ClosingLineContext for shaped resonances.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { GemHome } from '@/components/navigation/GemHome';
import {
  getResonancesWithArticleAction,
  getDepthMetricsAction,
  getSlotLimitsAction,
} from '@/app/actions/resonances';
import { getVitalityLabel } from '@/types/resonance-display';
import type { ResonanceWithArticle } from '@/types/resonance-display';
import type { DepthMetrics, SlotLimits } from '@/types/resonance';
import type { BookNarrationContext, ClosingLineContext } from '@/types/book-narration';
import type { ArchetypeKey } from '@/types/content';
import { getSeason } from '@/lib/mirror/season-engine';
import { synthesizeClosingLine } from '@/lib/mirror/closing-line-engine';
import { detectChapterBreak } from '@/lib/mirror/book-whisper-engine';
import ResonanceEntry from './ResonanceEntry';
import EvolutionThread from './EvolutionThread';
import ResonanceExport from './ResonanceExport';
import WhisperFooter from '@/components/shared/WhisperFooter';

const ANON_KEY = 'anon-reader-id';
const MIRROR_KEY = 'quick-mirror-result';

function getAnonId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ANON_KEY);
}

/** Read archetype from localStorage mirror snapshot. */
function readArchetype(): ArchetypeKey | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MIRROR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed?.archetype as ArchetypeKey) ?? null;
  } catch { return null; }
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

/** Build narration context for each gap between carrying resonances. */
function buildNarrationContexts(
  carrying: ResonanceWithArticle[],
  archetype: ArchetypeKey | null,
): BookNarrationContext[] {
  return carrying.map((curr, i) => {
    const prev = i > 0 ? carrying[i - 1] : null;
    const gapDays = prev
      ? Math.floor(
          (new Date(curr.createdAt).getTime() -
           new Date(prev.createdAt).getTime()) / 86400000,
        )
      : null;
    return {
      position: i,
      total: carrying.length,
      gapDays,
      prev,
      curr,
      season: getSeason(new Date(curr.createdAt)),
      archetype,
    };
  });
}

/** Build closing line context for a shaped resonance. */
function buildClosingCtx(r: ResonanceWithArticle): ClosingLineContext {
  const created = new Date(r.createdAt);
  const now = new Date();
  const daysLived = Math.floor(
    (now.getTime() - created.getTime()) / 86400000,
  );
  return {
    resonance: r,
    daysLived,
    season: getSeason(created),
  };
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
      <GemHome />
      <div className="w-80 h-48 rounded-lg bg-gradient-to-b from-rose/10 to-surface/20 border border-rose/10 animate-pulse" />
    </div>
  );

  const { carrying, shaped } = splitByVitality(resonances);
  const isEmpty = resonances.length === 0;
  const archetype = readArchetype();
  const contexts = buildNarrationContexts(carrying, archetype);

  // Empty state — no resonances captured yet
  if (isEmpty) return (
    <div className="max-w-md mx-auto pt-20 text-center">
      <GemHome />
      <GemIcon className="mx-auto text-mist/30 mb-8" />
      <h1 className="text-2xl font-display font-bold text-foreground mb-3">
        Your chapter hasn&apos;t been written yet.
      </h1>
      <p className="text-mist text-sm mb-8 max-w-sm mx-auto leading-relaxed">
        Read something that stops you. Capture it. Tell it why it matters.
      </p>
      <Link href="/"
        className="inline-block px-6 py-3 border border-gold/40 text-gold hover:bg-gold/10 font-semibold rounded-lg transition-colors">
        Browse Articles →
      </Link>
    </div>
  );

  // Active state — render the Book of You
  return (
    <div className="max-w-2xl mx-auto pt-8">
      <GemHome />
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div />
        <Link href="/mirror" className="text-mist text-sm hover:text-primary transition-colors">
          Your Mirror →
        </Link>
      </div>

      {/* Page title */}
      <div className="mb-10">
        <h1 className="text-gold text-3xl font-display font-light lowercase">
          the book of you
        </h1>
        <p className="text-mist text-md italic mt-1">What you&apos;re still carrying</p>
      </div>

      {/* Carrying section — alive resonances */}
      {carrying.length > 0 && (
        <section className="mb-10">
          {carrying.map((r, i) => {
            const ctx = contexts[i];
            // Detect chapter break before this entry
            const prev = i > 0 ? carrying[i - 1] : null;
            const brk = prev
              ? detectChapterBreak(
                  new Date(prev.createdAt),
                  new Date(r.createdAt),
                )
              : null;

            return (
              <div key={r.id}>
                {/* Chapter break marker */}
                {brk?.isBreak && (
                  <div className="my-10 text-center">
                    <div className="h-px bg-gold/20 max-w-divider mx-auto" />
                    <p className="text-mist/50 text-xs italic mt-2">
                      {brk.label}
                    </p>
                  </div>
                )}
                <ResonanceEntry resonance={r} timeAgo={formatTimeAgo(r.createdAt)} />
                {/* Data-driven whisper between entries */}
                {i < carrying.length - 1 && (
                  <EvolutionThread context={contexts[i]} />
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Divider between sections — spacing, no line */}
      {carrying.length > 0 && shaped.length > 0 && (
        <div className="my-16" />
      )}

      {/* Shaped section — faded resonances with closing lines */}
      {shaped.length > 0 && (
        <section className="mb-10">
          <p className="text-xs uppercase tracking-widest text-gold/40 mb-6">
            what shaped you
          </p>
          {shaped.map((r) => {
            const closingCtx = buildClosingCtx(r);
            const closing = synthesizeClosingLine(closingCtx);
            return (
              <ResonanceEntry
                key={r.id}
                resonance={r}
                timeAgo={formatTimeAgo(r.createdAt)}
                faded
                closingLine={closing}
              />
            );
          })}
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

      {/* Footer */}
      <WhisperFooter />
    </div>
  );
}
