/**
 * Whisper Engine — behavior-specific archetype whispers.
 *
 * Pure function: archetype + signalBag + paragraphMap → whisper string.
 * No React, no hooks, no DB, no side effects.
 *
 * Each archetype has a bank of templates keyed to observable behaviors.
 * The first template whose trigger returns true wins.
 * If nothing matches, falls back to the static whisper — zero regression risk.
 */

import type { ArchetypeKey } from '@/types/content';
import type { ParagraphEngagementMap } from '@/types/content';
import type { BehavioralSignalBag } from '@/lib/hooks/useBehavioralSignals';

export interface WhisperContext {
  signalBag: BehavioralSignalBag;
  paragraphMap: ParagraphEngagementMap;
}

interface WhisperTemplate {
  trigger: (ctx: WhisperContext) => boolean;
  text: (ctx: WhisperContext) => string;
}

// ─── Helpers ──────────────────────────────────────────────

function visitedCount(map: ParagraphEngagementMap): number {
  return Object.values(map).filter(e => !e.skipped).length;
}

function skippedCount(map: ParagraphEngagementMap): number {
  return Object.values(map).filter(e => e.skipped).length;
}

function totalParagraphs(map: ParagraphEngagementMap): number {
  return Object.keys(map).length;
}

function deepReadCount(map: ParagraphEngagementMap): number {
  return Object.values(map).filter(e => e.isDeepRead).length;
}

function peakParagraphDwell(map: ParagraphEngagementMap): number {
  const dwells = Object.values(map).filter(e => !e.skipped).map(e => e.dwellMs);
  return dwells.length > 0 ? Math.max(...dwells) : 0;
}

function dwellSecs(n: number): number {
  return Math.round(n / 1000);
}

// ─── Deep Diver Templates ─────────────────────────────────

const deepDiverTemplates: WhisperTemplate[] = [
  {
    trigger: (c) => (c.signalBag.deepReadRatio ?? 0) > 0.6 && c.signalBag.pace > 1.3,
    text: () => "You didn\u2019t just read \u2014 you studied. Paragraph by paragraph.",
  },
  {
    trigger: (c) => c.signalBag.reReadCount >= 3,
    text: (c) => `You went back ${c.signalBag.reReadCount} times. That\u2019s not doubt \u2014 that\u2019s depth.`,
  },
  {
    trigger: (c) => (c.signalBag.deepReadRatio ?? 0) > 0.5,
    text: (c) => {
      const n = deepReadCount(c.paragraphMap);
      return `You camped on ${n} paragraph${n === 1 ? '' : 's'}. Most people breeze through.`;
    },
  },
  {
    trigger: (c) => c.signalBag.pace > 1.5 && c.signalBag.velocity < 0.5,
    text: () => "Slow and thorough. You gave every word its moment.",
  },
  {
    trigger: (c) => c.signalBag.maxDepth >= 90 && c.signalBag.reReadCount >= 1,
    text: () => "You finished \u2014 then went back for what you missed. That\u2019s a deep diver.",
  },
];

// ─── Explorer Templates ───────────────────────────────────

const explorerTemplates: WhisperTemplate[] = [
  {
    trigger: (c) => (c.signalBag.engagementVariance ?? 0) > 0.3 && c.signalBag.velocity > 1.5,
    text: () => "You sampled everything. Some paragraphs got a nod, others got nothing.",
  },
  {
    trigger: (c) => (c.signalBag.skipRatio ?? 0) > 0.4 && (c.signalBag.peakParagraphCount ?? 0) >= 2,
    text: (c) => {
      const skipped = skippedCount(c.paragraphMap);
      return `You skipped ${skipped} paragraphs but the ones you read? You really read them.`;
    },
  },
  {
    trigger: (c) => c.signalBag.velocity > 2.0 && c.signalBag.pace < 0.7,
    text: () => "Fast eyes, sharp instincts. You knew what you were looking for.",
  },
  {
    trigger: (c) => c.signalBag.maxDepth > 30 && c.signalBag.maxDepth < 70,
    text: (c) => {
      const visited = visitedCount(c.paragraphMap);
      return `You touched ${visited} paragraphs and kept moving. A scout, not a settler.`;
    },
  },
];

// ─── Faithful Templates ───────────────────────────────────

const faithfulTemplates: WhisperTemplate[] = [
  {
    trigger: (c) => (c.signalBag.engagementVariance ?? 1) <= 0.2 && c.signalBag.maxDepth >= 90,
    text: () => "Steady and thorough. Every paragraph got its due.",
  },
  {
    trigger: (c) => c.signalBag.pace >= 0.9 && c.signalBag.pace <= 1.1 && c.signalBag.velocity > 0.4,
    text: () => "You read this at exactly the pace it was written. That\u2019s rare.",
  },
  {
    trigger: (c) => (c.signalBag.skipRatio ?? 1) <= 0.1 && c.signalBag.maxDepth >= 85,
    text: (c) => {
      const total = totalParagraphs(c.paragraphMap);
      return total > 0 ? `All ${total} paragraphs. Not a single skip. That\u2019s commitment.` : "Every paragraph. Not a single skip. That\u2019s commitment.";
    },
  },
  {
    trigger: (c) => c.signalBag.reReadCount >= 1 && c.signalBag.reReadCount <= 2 && c.signalBag.velocity >= 0.5,
    text: () => "You re-read a passage or two \u2014 not from confusion, but care.",
  },
];

// ─── Resonator Templates ──────────────────────────────────

const resonatorTemplates: WhisperTemplate[] = [
  {
    trigger: (c) => c.signalBag.reReadCount >= 4,
    text: (c) => `You kept coming back. ${c.signalBag.reReadCount} times. Something here resonated.`,
  },
  {
    trigger: (c) => (c.signalBag.deepReadRatio ?? 0) >= 0.3 && (c.signalBag.engagementVariance ?? 0) >= 0.4,
    text: (c) => {
      const secs = dwellSecs(peakParagraphDwell(c.paragraphMap));
      return secs > 0
        ? `One paragraph held you for ${secs} second${secs === 1 ? '' : 's'}. You felt something there.`
        : "One paragraph held you longer than the rest. You felt something there.";
    },
  },
  {
    trigger: (c) => c.signalBag.reReadCount >= 2 && c.signalBag.pace > 1.2,
    text: () => "You re-read \u2014 not checking facts, checking feelings. That\u2019s resonance.",
  },
  {
    trigger: (c) => (c.signalBag.peakParagraphCount ?? 0) >= 3 && c.signalBag.velocity < 1.0,
    text: (c) => {
      const peaks = c.signalBag.peakParagraphCount ?? 0;
      return `${peaks} paragraphs made you pause. You don\u2019t just read \u2014 you respond.`;
    },
  },
];

// ─── Collector Templates ──────────────────────────────────

const collectorTemplates: WhisperTemplate[] = [
  {
    trigger: (c) => (c.signalBag.skipRatio ?? 0) >= 0.5,
    text: (c) => {
      const skipped = skippedCount(c.paragraphMap);
      return `You breezed through ${skipped} paragraphs \u2014 gathering, not ignoring. A curator\u2019s instinct.`;
    },
  },
  {
    trigger: (c) => c.signalBag.pace < 0.5 && c.signalBag.velocity > 1.5,
    text: () => "Quick eyes, broad sweep. You took it all in without getting stuck.",
  },
  {
    trigger: (c) => (c.signalBag.deepReadRatio ?? 1) <= 0.2 && c.signalBag.maxDepth < 40,
    text: (c) => {
      const visited = visitedCount(c.paragraphMap);
      return `You touched ${visited} sections but didn\u2019t linger. A surveyor, not a settler.`;
    },
  },
];

// ─── Template Registry ────────────────────────────────────

const TEMPLATES: Record<ArchetypeKey, WhisperTemplate[]> = {
  'deep-diver': deepDiverTemplates,
  'explorer': explorerTemplates,
  'faithful': faithfulTemplates,
  'resonator': resonatorTemplates,
  'collector': collectorTemplates,
};

/** Fallback whispers — identical to the previous static WHISPERS map. */
const FALLBACK_WHISPERS: Record<ArchetypeKey, string> = {
  'deep-diver': "You don\u2019t skim surfaces \u2014 you dive deep and emerge transformed.",
  'explorer': "Your curiosity has no borders \u2014 every topic is uncharted territory.",
  'faithful': "Day after day, you show up. Consistency is your quiet superpower.",
  'resonator': "You don\u2019t just read \u2014 you feel. Every resonance is a fingerprint of your mind.",
  'collector': "Your appetite for ideas is boundless \u2014 a personal library in the making.",
};

// ─── Public API ───────────────────────────────────────────

/**
 * Find the first matching template for this archetype.
 * Returns the rendered string, or null if no template matched.
 */
function matchTemplate(
  archetype: ArchetypeKey,
  ctx: WhisperContext,
): string | null {
  const templates = TEMPLATES[archetype] ?? [];
  for (const tpl of templates) {
    if (tpl.trigger(ctx)) return tpl.text(ctx);
  }
  return null;
}

/**
 * synthesizeWhisper — the core pure function.
 *
 * Takes archetype + behavioral data → returns a behavior-specific whisper.
 * If no template matches observed behavior, falls back to the static whisper.
 */
export function synthesizeWhisper(
  archetype: ArchetypeKey,
  signalBag: BehavioralSignalBag,
  paragraphMap: ParagraphEngagementMap,
): string {
  const ctx: WhisperContext = { signalBag, paragraphMap };
  return matchTemplate(archetype, ctx) ?? FALLBACK_WHISPERS[archetype];
}
