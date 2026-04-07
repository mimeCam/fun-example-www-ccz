/**
 * Season Engine — date → season key + mood tokens.
 *
 * Pure function using astronomical solstices/equinoxes, not calendar months.
 * The *feeling* of a season changes at the solstice, not on the 1st.
 */

import type { SeasonKey, SeasonInfo } from '@/types/book-narration';

// ─── Solstice / Equinox Approximations (Northern Hemisphere) ────

interface SeasonBoundary {
  key: SeasonKey;
  /** Approximate start month (1-based) and day. */
  startMonth: number;
  startDay: number;
  label: string;
  mood: string[];
}

const SEASONS: SeasonBoundary[] = [
  { key: 'spring', startMonth: 3, startDay: 20,
    label: 'Spring', mood: ['waking', 'unfolding', ' tentative'] },
  { key: 'summer', startMonth: 6, startDay: 21,
    label: 'Summer', mood: ['abundant', 'bright', 'unhurried'] },
  { key: 'autumn', startMonth: 9, startDay: 22,
    label: 'Autumn', mood: ['reflective', 'settling', 'quieting'] },
  { key: 'winter', startMonth: 12, startDay: 21,
    label: 'Winter', mood: ['quiet', 'still', 'dormant'] },
];

// ─── Public API ─────────────────────────────────────────

/** Return the season for a given date. */
export function getSeason(date: Date): SeasonInfo {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfYear = month * 100 + day; // 101 = Jan 1, 1231 = Dec 31

  // Find which season we're in by walking backwards through boundaries.
  // Order: winter(Dec 21) → spring(Mar 20) → summer(Jun 21) → autumn(Sep 22)
  if (dayOfYear >= 1221 || dayOfYear < 320)
    return toInfo(SEASONS[3]); // winter
  if (dayOfYear < 621)
    return toInfo(SEASONS[0]); // spring
  if (dayOfYear < 922)
    return toInfo(SEASONS[1]); // summer
  return toInfo(SEASONS[2]);   // autumn
}

function toInfo(s: SeasonBoundary): SeasonInfo {
  return { key: s.key, label: s.label, mood: s.mood };
}
