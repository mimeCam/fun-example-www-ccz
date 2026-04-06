'use client';

import { useState, useEffect } from 'react';
import type { EvolutionData, GoldenThread } from '@/lib/hooks/useEvolution';

// ── Types ──────────────────────────────────────────────────

interface Props {
  data: EvolutionData;
}

interface SideProps {
  label: string;
  archetype: string;
  whisper: string;
  faded: boolean;
  delay: number;
}

// ── Component ──────────────────────────────────────────────

export default function EvolutionCard({ data }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  return (
    <div className="evolution-card w-full mt-8 p-6 rounded-2xl bg-void/60 border border-fog/20
                    shadow-void hover:shadow-rise transition-shadow duration-300">
      {/* Two-column: THEN | NOW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <SideColumn
          label="THEN"
          archetype={data.then.archetypeLabel}
          whisper={data.then.whisper}
          faded
          delay={0}
        />
        <SideColumn
          label="NOW"
          archetype={data.now.archetypeLabel}
          whisper={data.now.whisper}
          faded={false}
          delay={150}
        />
      </div>

      {/* Golden thread */}
      <GoldenThreadLine />
      <ThreadStats thread={data.thread} />
    </div>
  );
}

// ── Sub-components (pure, ≤10 lines each) ──────────────────

function SideColumn({ label, archetype, whisper, faded, delay }: SideProps) {
  const cls = faded
    ? 'opacity-60'
    : '';
  const nameCls = faded
    ? 'text-sm font-display font-bold text-mist'
    : 'text-lg font-display font-bold text-accent';
  const quoteCls = faded
    ? 'text-xs text-mist/60 italic mt-1'
    : 'text-sm text-gray-300 italic mt-1';

  return (
    <div className={`evolution-side text-center sm:text-left ${cls}`}
         style={{ animationDelay: `${delay}ms` }}>
      <p className="text-xs uppercase tracking-widest text-mist/50 mb-1">{label}</p>
      <p className={nameCls}>{archetype}</p>
      <p className={quoteCls}>&ldquo;{whisper}&rdquo;</p>
    </div>
  );
}

function GoldenThreadLine() {
  return (
    <div className="my-4 h-px bg-gradient-to-r from-gold/10 via-gold/40 to-gold/10
                    evolution-thread transition-all duration-300" />
  );
}

function ThreadStats({ thread }: { thread: GoldenThread }) {
  return (
    <p className="text-xs text-mist/60 tracking-wide text-center evolution-stats">
      {thread.visits} visits &middot; {thread.articles} articles &middot; {thread.days} days
    </p>
  );
}
