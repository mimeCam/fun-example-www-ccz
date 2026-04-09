/**
 * WorldviewDoors — 4 worldview discovery cards for the homepage.
 *
 * Second act of the Threshold: after the featured article,
 * 4 "doors" invite readers to explore by perspective.
 * Each card links to /articles?type=<worldview>.
 *
 * Self-contained — imports worldview definitions from types/filter.
 * Uses existing design tokens: gold for hover accent, mist for body text.
 */

import Link from 'next/link';
import { FilterType, FILTER_TEMPLATES } from '@/types/filter';

// ─── Door configuration ────────────────────────────

interface DoorDef {
  type: FilterType;
  icon: string;
  belief: string;
}

const DOORS: DoorDef[] = [
  { type: 'technical', icon: '\u2699', belief: 'Implementation matters more than theory' },
  { type: 'philosophical', icon: '\u2728', belief: 'First principles beat best practices' },
  { type: 'practical', icon: '\u26A1', belief: 'Done is better than perfect' },
  { type: 'contrarian', icon: '\u274C', belief: 'Popular opinions are usually wrong' },
];

function doorHref(type: FilterType): string {
  return `/articles?type=${type}`;
}

function doorTitle(d: DoorDef): string {
  return FILTER_TEMPLATES[d.type].title;
}

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
  return (
    <Link
      href={doorHref(door.type)}
      className="block bg-surface/60 rounded-2xl p-4
        border border-fog/10
        hover:border-gold/40 hover:shadow-rise
        transition-all duration-300 group
        focus:ring-2 focus:ring-gold/30 focus:ring-offset-2
        focus:ring-offset-background outline-none"
      aria-label={`${doorTitle(door)}: ${door.belief}`}
    >
      <span className="text-2xl block mb-2" aria-hidden="true">
        {door.icon}
      </span>
      <h3 className="font-display text-sm font-bold text-white/80
        group-hover:text-gold transition-colors leading-tight">
        {doorTitle(door)}
      </h3>
      <p className="text-mist/50 text-xs mt-1 leading-relaxed line-clamp-2">
        {door.belief}
      </p>
    </Link>
  );
}
