/**
 * WorldviewFilter — filter chip bar for worldview-based article discovery.
 *
 * Renders a row of clickable worldview chips. Active chip filters the grid.
 * Uses "useSearchParams" so the selection is URL-driven and shareable.
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FilterType } from '@/types/filter';

interface ChipDef {
  type: FilterType;
  icon: string;
  label: string;
}

const CHIPS: ChipDef[] = [
  { type: 'technical', icon: '\u2699', label: 'Technical' },
  { type: 'philosophical', icon: '\u2728', label: 'Philosophical' },
  { type: 'practical', icon: '\u26A1', label: 'Practical' },
  { type: 'contrarian', icon: '\u274C', label: 'Contrarian' },
];

export default function WorldviewFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get('worldview') as FilterType | null;

  function select(type: FilterType | null) {
    const next = type ? `?worldview=${type}` : '';
    router.push(`/articles${next}`, { scroll: false });
  }

  return (
    <div
      className="flex flex-wrap gap-2 mb-8"
      role="group"
      aria-label="Filter articles by worldview"
    >
      <Chip
        active={active === null}
        label="All"
        onSelect={() => select(null)}
      />
      {CHIPS.map(c => (
        <Chip
          key={c.type}
          active={active === c.type}
          icon={c.icon}
          label={c.label}
          onSelect={() => select(c.type)}
        />
      ))}
    </div>
  );
}

function Chip({
  active,
  icon,
  label,
  onSelect,
}: {
  active: boolean;
  icon?: string;
  label: string;
  onSelect: () => void;
}) {
  const base = 'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200';
  const style = active
    ? 'bg-gold/10 border-gold/30 text-gold'
    : 'bg-surface/60 border-fog/10 text-mist/60 hover:border-fog/30 hover:text-mist';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${base} ${style}`}
      aria-pressed={active}
    >
      {icon && <span className="mr-1" aria-hidden="true">{icon}</span>}
      {label}
    </button>
  );
}
