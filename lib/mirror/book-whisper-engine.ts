/**
 * Book Whisper Engine — narrator whispers for the Book of You.
 *
 * Same trigger/template pattern as whisper-engine.ts, but operating on
 * inter-resonance signals: time gaps, vitality transitions, topic echoes,
 * archetype alignment, seasons, and position in the sequence.
 *
 * Pure function: BookNarrationContext → string. No React, no hooks, no DB.
 */

import type { BookNarrationContext } from '@/types/book-narration';

// ─── Template Type ──────────────────────────────────────

interface BookWhisperTemplate {
  trigger: (ctx: BookNarrationContext) => boolean;
  text: (ctx: BookNarrationContext) => string;
}

// ─── Helpers ────────────────────────────────────────────

function sameArticle(a: string, b: string): boolean {
  return a === b;
}

function topicOverlap(titleA: string, titleB: string): boolean {
  const stop = new Set(['the','a','an','of','in','to','and','is','for','on','it','with']);
  const words = (s: string) =>
    s.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stop.has(w));
  const setA = new Set(words(titleA));
  return words(titleB).some(w => setA.has(w));
}

// ─── First Resonance Templates ──────────────────────────

const firstTemplates: BookWhisperTemplate[] = [
  {
    trigger: (c) => c.position === 0 && c.total === 1,
    text: () =>
      'One resonance. That\'s where it starts. The next will come differently.',
  },
  {
    trigger: (c) => c.position === 0,
    text: (c) =>
      c.season.key === 'winter'
        ? 'In the quiet of winter, something caught. That\'s rare.'
        : 'After your first resonance, you started reading differently. Slower.',
  },
];

// ─── Gap / Chapter Templates ────────────────────────────

const gapTemplates: BookWhisperTemplate[] = [
  {
    trigger: (c) => (c.gapDays ?? 0) >= 30,
    text: (c) =>
      `A month passed between these. You were elsewhere — but you came back.`,
  },
  {
    trigger: (c) => (c.gapDays ?? 0) >= 14,
    text: (c) => {
      const d = c.gapDays!;
      return `Two weeks apart. The thread didn't break — it stretched.`;
    },
  },
  {
    trigger: (c) => (c.gapDays ?? 0) >= 7,
    text: () =>
      'A week of silence, then this. Something drew you back.',
  },
];

// ─── Topic Echo Templates ───────────────────────────────

const echoTemplates: BookWhisperTemplate[] = [
  {
    trigger: (c) =>
      c.prev != null &&
      sameArticle(c.prev.articleId, c.curr.articleId),
    text: () =>
      'The same article, twice. You\'re not rereading — you\'re excavating.',
  },
  {
    trigger: (c) =>
      c.prev != null &&
      topicOverlap(c.prev.articleTitle, c.curr.articleTitle),
    text: (c) =>
      `A familiar thread — "${c.curr.articleTitle}" echoes something you carried before.`,
  },
];

// ─── Season Templates ───────────────────────────────────

const seasonTemplates: BookWhisperTemplate[] = [
  {
    trigger: (c) => c.season.key === 'winter' && (c.gapDays ?? 0) > 0,
    text: () =>
      'Saved in the quiet of winter. Ideas that take root now run deep.',
  },
  {
    trigger: (c) => c.season.key === 'autumn',
    text: () =>
      'An autumn resonance. Something about the letting-go season speaks to you.',
  },
  {
    trigger: (c) =>
      c.prev != null &&
      c.season.key === 'summer' && c.prev.createdAt !== c.curr.createdAt,
    text: () =>
      'Midsummer reading — unhurried, abundant. You had space for this.',
  },
];

// ─── Late Position Templates ────────────────────────────

const lateTemplates: BookWhisperTemplate[] = [
  {
    trigger: (c) => c.position >= c.total - 1 && c.total >= 5,
    text: () =>
      'A lattice, not a list. Each resonance built on the last.',
  },
  {
    trigger: (c) => c.position >= c.total - 1 && c.total >= 3,
    text: () =>
      'By now, you have a reading identity. It has a shape.',
  },
];

// ─── Archetype-Flavored Templates ───────────────────────

const archetypeTemplates: BookWhisperTemplate[] = [
  {
    trigger: (c) => c.archetype === 'deep-diver' && c.position > 0,
    text: () =>
      'Deep divers don\'t collect — they inhabit. This one lived in you.',
  },
  {
    trigger: (c) => c.archetype === 'explorer' && c.position > 0,
    text: () =>
      'Another territory mapped. Your reading has no borders.',
  },
  {
    trigger: (c) => c.archetype === 'resonator' && c.position > 0,
    text: () =>
      'You don\'t just read — you respond. Every resonance is a fingerprint.',
  },
];

// ─── Template Pipeline (first match wins) ───────────────

const PIPELINE: BookWhisperTemplate[][] = [
  firstTemplates,
  gapTemplates,
  echoTemplates,
  seasonTemplates,
  lateTemplates,
  archetypeTemplates,
];

const FALLBACK_WHISPERS = [
  'Your reading deepened. You started seeing connections others miss.',
  'Patterns formed. Ideas began to echo across articles.',
  'Something is forming between these. You can feel it.',
  'Each save is a sentence in a story you didn\'t know you were writing.',
];

// ─── Public API ─────────────────────────────────────────

/** Synthesize a narrator whisper from Book of You context. */
export function synthesizeBookWhisper(
  ctx: BookNarrationContext,
): string {
  for (const bank of PIPELINE) {
    for (const tpl of bank) {
      if (tpl.trigger(ctx)) return tpl.text(ctx);
    }
  }
  return FALLBACK_WHISPERS[ctx.position % FALLBACK_WHISPERS.length];
}

/** Detect chapter boundaries: 14+ day gaps between resonances. */
export function detectChapterBreak(
  prev: Date,
  curr: Date,
): { isBreak: boolean; daysGap: number; label: string } {
  const daysGap = Math.floor(
    (curr.getTime() - prev.getTime()) / 86400000,
  );
  if (daysGap < 14) return { isBreak: false, daysGap, label: '' };

  if (daysGap >= 30)
    return { isBreak: true, daysGap, label: 'A month passed. You were elsewhere.' };
  return { isBreak: true, daysGap, label: 'Two weeks passed. The thread stretched.' };
}
