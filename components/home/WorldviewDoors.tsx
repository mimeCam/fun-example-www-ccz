/**
 * WorldviewDoors — 4 worldview discovery cards for the homepage.
 *
 * Second act of the Threshold: after the featured article,
 * 4 "doors" invite readers to explore by perspective.
 * Each card links directly to the best article for that worldview.
 *
 * Self-contained — imports worldview→article mapping from articleData.
 * Uses existing design tokens: gold for hover accent, mist for body text.
 */

import Link from 'next/link';
import { FilterType } from '@/types/filter';
import { getBestArticleForWorldview } from '@/lib/content/articleData';

// ─── Door configuration ────────────────────────────

interface DoorDef {
  type: FilterType;
  icon: string;
  label: string;
}

const DOORS: DoorDef[] = [
  { type: 'technical', icon: '\u2699', label: 'Deep Technical Dive' },
  { type: 'philosophical', icon: '\u2728', label: 'Philosophical Exploration' },
  { type: 'practical', icon: '\u26A1', label: 'Practical Application' },
  { type: 'contrarian', icon: '\u274C', label: 'Contrarian Viewpoint' },
];

// ─── Component ─────────────────────────────────────

export default function WorldviewDoors() {
  return (
    <nav className="mt-16 mb-8" aria-label="Explore by worldview">
      <p className="text-mist/40 text-xs text-center uppercase tracking-widest mb-6">
        Or explore by perspective
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {DOORS.map(door => (
          <DoorCard key={door.type} door={door} />
        ))}
      </div>
    </nav>
  );
}

function DoorCard({ door }: { door: DoorDef }) {
  const article = getBestArticleForWorldview(door.type);
  const href = article ? `/article/${article.id}` : '/articles';
  const teaser = article
    ? article.content.slice(0, 80).replace(/[#*_]/g, '').trim() + '…'
    : door.label;

  return (
    <Link
      href={href}
      className="block bg-surface/60 rounded-2xl p-4
        border border-fog/10
        hover:border-gold/40 hover:shadow-rise
        transition-all duration-300 group
        focus:ring-2 focus:ring-gold/30 focus:ring-offset-2
        focus:ring-offset-background outline-none"
      aria-label={`${door.label}: ${teaser}`}
    >
      <span className="text-2xl block mb-2" aria-hidden="true">
        {door.icon}
      </span>
      <h3 className="font-display text-sm font-bold text-white/80
        group-hover:text-gold transition-colors leading-tight">
        {door.label}
      </h3>
      <p className="text-mist/50 text-xs mt-1 leading-relaxed line-clamp-2">
        {teaser}
      </p>
    </Link>
  );
}
