/**
 * Book Narration Types — context for data-driven EvolutionThread whispers.
 *
 * These types define the signals available to the book-whisper-engine,
 * closing-line-engine, and chapter-break assembler. Zero runtime code.
 */

import type { ArchetypeKey } from './content';
import type { ResonanceWithArticle } from './resonance-display';

// ─── Season ─────────────────────────────────────────────

export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonInfo {
  key: SeasonKey;
  label: string;
  /** Mood tokens for whisper templates, e.g. ['quiet', 'still']. */
  mood: string[];
}

// ─── Narration Context ──────────────────────────────────

export interface BookNarrationContext {
  /** Index of the preceding resonance in the carrying array. */
  position: number;
  /** Total carrying resonances. */
  total: number;
  /** Days between previous resonance and current. Null for first entry. */
  gapDays: number | null;
  /** Previous resonance (null for first entry). */
  prev: ResonanceWithArticle | null;
  /** Current resonance. */
  curr: ResonanceWithArticle;
  /** Season at the time the current resonance was saved. */
  season: SeasonInfo;
  /** Reader's archetype from mirror snapshot, if available. */
  archetype: ArchetypeKey | null;
}

// ─── Closing Line Context ───────────────────────────────

export interface ClosingLineContext {
  /** The shaped (faded) resonance. */
  resonance: ResonanceWithArticle;
  /** Days this resonance was alive before it shaped. */
  daysLived: number;
  /** Season at the time it was saved. */
  season: SeasonInfo;
}

// ─── Chapter Boundary ───────────────────────────────────

export interface ChapterBoundary {
  daysGap: number;
  label: string;
}
