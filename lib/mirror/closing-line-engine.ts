/**
 * Closing Line Engine — farewell text for shaped (faded) resonances.
 *
 * Same trigger/template pattern as whisper-engine.ts.
 * Pure function: ClosingLineContext → string | null.
 */

import type { ClosingLineContext } from '@/types/book-narration';

// ─── Template Type ──────────────────────────────────────

interface ClosingTemplate {
  trigger: (ctx: ClosingLineContext) => boolean;
  text: (ctx: ClosingLineContext) => string;
}

// ─── Templates ──────────────────────────────────────────

const TEMPLATES: ClosingTemplate[] = [
  {
    trigger: (c) => c.daysLived >= 20,
    text: (c) =>
      `You carried this for ${c.daysLived} days. That's longer than most.`,
  },
  {
    trigger: (c) => c.daysLived >= 10,
    text: () =>
      "It stopped resonating. That's not loss — that's movement.",
  },
  {
    trigger: (c) => c.season.key === 'winter',
    text: () =>
      "This idea cooled, but it warmed the ones that came after.",
  },
  {
    trigger: (c) => c.season.key === 'autumn',
    text: () =>
      "Some ideas are seasonal. This one served its turn.",
  },
  {
    trigger: (c) => c.daysLived < 5,
    text: () =>
      "Brief, but not without trace. It shaped what followed.",
  },
];

const FALLBACK =
  "This idea cooled, but it warmed the ones that came after.";

// ─── Public API ─────────────────────────────────────────

/** Synthesize a closing line for a shaped resonance. */
export function synthesizeClosingLine(
  ctx: ClosingLineContext,
): string {
  for (const tpl of TEMPLATES) {
    if (tpl.trigger(ctx)) return tpl.text(ctx);
  }
  return FALLBACK;
}
