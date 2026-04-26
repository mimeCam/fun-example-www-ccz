/**
 * ResonancesClient — client shell for /resonances page.
 * Reads anon-reader-id from localStorage, fetches resonances + metrics + slots,
 * then renders sections: Carrying (alive), Shaped (faded), Evolution, Export.
 *
 * Now builds BookNarrationContext for data-driven EvolutionThread whispers
 * and ClosingLineContext for shaped resonances.
 *
 * Visited foreshadow (Tanya UIX #98, Mike #31): owns the in-memory Set
 * of resonance ids whose quote-card has been Saved this session.
 * Refresh forgets, by intent — the contract is session-scope, not
 * persistence (Tanya §6, Mike §7.6). The Set is held as a tiny hook
 * (`useVisitedLaunchers`) below; it stays here until a second
 * consumer earns a lift (rule of three; Mike §7.3).
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { GemHome } from '@/components/navigation/GemHome';
import { EmptySurface } from '@/components/shared/EmptySurface';
import { emptyPhrase } from '@/lib/sharing/empty-phrase';
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
import { ResonanceSectionHeader } from '@/components/resonances/ResonanceSectionHeader';
import ResonanceExport from './ResonanceExport';
import { TextLink } from '@/components/shared/TextLink';
import { Skeleton } from '@/components/shared/Skeleton';
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

/**
 * Visited launchers — session-scoped membership Set keyed by resonance id.
 * One owner (this hook on `ResonancesClient`). Refresh clears. No
 * persistence, no localStorage, no new ledger (Tanya #98 §6, Mike
 * #31 §7 PoI #3, Elon #31 §3.5: pragmatic-not-principled). ≤ 10 LOC.
 */
function useVisitedLaunchers() {
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const markVisited = useCallback((id: string) => {
    setVisited((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);
  const isVisited = useCallback((id: string) => visited.has(id), [visited]);
  return { isVisited, markVisited };
}

/** Slot indicator: filled ◆ and empty ◇ diamonds. */
function SlotIndicator({ used, total }: { used: number; total: number }) {
  return (
    <div className="text-center">
      <p className="text-sys-micro text-mist">
        {Array.from({ length: total }, (_, i) =>
          i < used ? '◆' : '◇'
        ).join('')}
        <span className="ml-sys-2">{used} of {total} resonances</span>
      </p>
      {used >= total && (
        <p className="text-sys-micro text-gold/70 mt-sys-1">
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
  const { isVisited, markVisited } = useVisitedLaunchers();

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
      {/* Thermal-aware card surface — rose warmth arrives ambiently via the
          thermal system (inline blocking script at app/layout.tsx), not via
          a hand-wired gradient. Per Mike §5 #5 — do NOT accept a tone prop. */}
      <Skeleton variant="card" className="w-80 h-48" />
    </div>
  );

  const { carrying, shaped } = splitByVitality(resonances);
  const isEmpty = resonances.length === 0;
  const archetype = readArchetype();
  const contexts = buildNarrationContexts(carrying, archetype);

  // Empty state — no resonances captured yet. Frame + voice via EmptySurface.
  if (isEmpty) return <EmptyResonances />;

  // Active state — render the Book of You
  return (
    <div className="max-w-2xl mx-auto pt-sys-8">
      <GemHome />
      {/* Header */}
      <div className="flex justify-between items-center mb-sys-9">
        <div />
        <TextLink variant="passage" href="/mirror" className="text-sys-caption">
          Your Mirror →
        </TextLink>
      </div>

      {/* Page title */}
      <div className="mb-sys-9">
        <h1 className="text-[var(--token-accent)] text-sys-h3 font-display font-sys-body lowercase">
          the book of you
        </h1>
        <p className="text-mist text-sys-body italic mt-sys-1">What you&apos;re still carrying</p>
      </div>

      {/* Carrying section — alive resonances */}
      {carrying.length > 0 && (
        <section className="mb-sys-9">
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
                  <div className="my-sys-9 text-center">
                    <div className="h-px bg-gold/20 max-w-divider mx-auto" />
                    <p className="text-mist/50 text-sys-micro italic mt-sys-3">
                      {brk.label}
                    </p>
                  </div>
                )}
                <ResonanceEntry
                  resonance={r}
                  timeAgo={formatTimeAgo(r.createdAt)}
                  index={i}
                  visited={isVisited(r.id)}
                  onSaved={() => markVisited(r.id)}
                />
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
        <div className="my-sys-11" />
      )}

      {/* Shaped section — faded resonances with closing lines.
          Section-local index resets to 0 (independent stagger wave). */}
      {shaped.length > 0 && (
        <section className="mb-sys-9">
          <ResonanceSectionHeader label="what shaped you" tone="gold" />
          {shaped.map((r, i) => {
            const closingCtx = buildClosingCtx(r);
            const closing = synthesizeClosingLine(closingCtx);
            return (
              <ResonanceEntry
                key={r.id}
                resonance={r}
                timeAgo={formatTimeAgo(r.createdAt)}
                faded
                closingLine={closing}
                index={i}
              />
            );
          })}
        </section>
      )}

      {/* Slot indicator */}
      {slots && (
        <div className="my-sys-9">
          <SlotIndicator used={slots.usedSlots} total={slots.currentSlots} />
        </div>
      )}

      {/* Export */}
      {resonances.length > 0 && (
        <div className="mb-sys-9">
          <ResonanceExport resonances={resonances} />
        </div>
      )}

      {/* Footer */}
      <WhisperFooter />
    </div>
  );
}

/** Empty branch — no resonances yet. Delegates frame + voice to EmptySurface. */
function EmptyResonances() {
  const { headline, whisper } = emptyPhrase('empty-resonances');
  return (
    <EmptySurface
      kind="empty-resonances"
      headline={headline}
      whisper={whisper}
      primary={{ kind: 'link', href: '/articles', label: 'Browse Articles →' }}
      secondary={{ href: '/mirror', label: 'Read the Mirror' }}
      tint="rose"
    />
  );
}
