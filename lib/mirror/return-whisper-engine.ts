/**
 * Return Whisper Engine — archetype-aware whispers for returning readers.
 *
 * Pure function: archetype + daysSince + season + visitCount → whisper string.
 * No React, no hooks, no DB, no side effects.
 *
 * Same trigger/template pattern as whisper-engine.ts.
 * First matching template wins. Falls back to a static string per archetype.
 */

import type { ArchetypeKey } from '@/types/content';
import type { SeasonKey } from '@/types/book-narration';

export interface ReturnWhisperContext {
  archetype: ArchetypeKey;
  daysSinceLastVisit: number;
  season: SeasonKey;
  visitCount: number;
}

interface WhisperTemplate {
  trigger: (ctx: ReturnWhisperContext) => boolean;
  text: (ctx: ReturnWhisperContext) => string;
}

// ─── Deep Diver ──────────────────────────────────────────

const deepDiverTemplates: WhisperTemplate[] = [
  {
    trigger: (c) => c.daysSinceLastVisit > 14,
    text: () => "The deep end hasn\u2019t moved. Neither has your instinct for it.",
  },
  {
    trigger: (c) => c.daysSinceLastVisit > 7 && c.season === 'winter',
    text: () => "Winter didn\u2019t freeze your depth. It concentrated it.",
  },
  {
    trigger: (c) => c.visitCount >= 4,
    text: (c) => `${c.visitCount} visits. Each one, a deeper layer.`,
  },
];

// ─── Explorer ────────────────────────────────────────────

const explorerTemplates: WhisperTemplate[] = [
  {
    trigger: (c) => c.daysSinceLastVisit > 7,
    text: () => "New trails since you left. Then again, you were never here for the map.",
  },
  {
    trigger: (c) => c.season === 'spring' && c.visitCount >= 2,
    text: () => "Spring. The season of exploring without a destination.",
  },
  {
    trigger: (c) => c.visitCount >= 3,
    text: (c) => `${c.visitCount} visits, each one a different path through the same ideas.`,
  },
];

// ─── Faithful ────────────────────────────────────────────

const faithfulTemplates: WhisperTemplate[] = [
  {
    trigger: (c) => c.visitCount >= 5,
    text: () => "Visit six. Or seven. You stopped counting \u2014 so did we.",
  },
  {
    trigger: (c) => c.daysSinceLastVisit <= 2,
    text: () => "Back already. Some people return out of habit. You return out of care.",
  },
  {
    trigger: (c) => c.season === 'autumn',
    text: () => "Autumn readers are faithful by nature. You prove it.",
  },
];

// ─── Resonator ───────────────────────────────────────────

const resonatorTemplates: WhisperTemplate[] = [
  {
    trigger: () => true,
    text: () => "Something resonated last time. That echo is still here.",
  },
  {
    trigger: (c) => c.daysSinceLastVisit > 10 && c.season === 'winter',
    text: () => "Even in winter, some echoes don\u2019t fade.",
  },
  {
    trigger: (c) => c.visitCount >= 3,
    text: () => "Each return visit adds another note to the chord.",
  },
];

// ─── Collector ───────────────────────────────────────────

const collectorTemplates: WhisperTemplate[] = [
  {
    trigger: (c) => c.visitCount >= 3,
    text: (c) => `${c.visitCount} visits. Your personal library grows.`,
  },
  {
    trigger: (c) => c.daysSinceLastVisit > 7,
    text: () => "The shelves have new arrivals. A collector always returns.",
  },
  {
    trigger: (c) => c.season === 'summer',
    text: () => "Summer is for gathering. Your shelves show it.",
  },
];

// ─── Registry ────────────────────────────────────────────

const TEMPLATES: Record<ArchetypeKey, WhisperTemplate[]> = {
  'deep-diver': deepDiverTemplates,
  'explorer': explorerTemplates,
  'faithful': faithfulTemplates,
  'resonator': resonatorTemplates,
  'collector': collectorTemplates,
};

const FALLBACK: Record<ArchetypeKey, string> = {
  'deep-diver': "You don\u2019t skim surfaces. Welcome back to the deep end.",
  'explorer': "The territory expanded while you were away.",
  'faithful': "Consistency is quiet. And unmistakable.",
  'resonator': "Some echoes last longer than the original sound.",
  'collector': "Every return adds another volume to your collection.",
};

// ─── Public API ──────────────────────────────────────────

function matchFirst(archetype: ArchetypeKey, ctx: ReturnWhisperContext): string | null {
  const templates = TEMPLATES[archetype] ?? [];
  for (const tpl of templates) {
    if (tpl.trigger(ctx)) return tpl.text(ctx);
  }
  return null;
}

/**
 * synthesizeReturnWhisper — pure function.
 * archetype + context → behavior-aware return whisper.
 */
export function synthesizeReturnWhisper(ctx: ReturnWhisperContext): string {
  return matchFirst(ctx.archetype, ctx) ?? FALLBACK[ctx.archetype];
}
