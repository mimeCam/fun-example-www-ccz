/**
 * Letter Engine — composes a Return Letter from mirror context.
 *
 * Pure function: LetterContext → Letter.
 * Composes from existing engine outputs (return-whisper, season).
 * Same trigger/template pattern as all mirror engines.
 * No React, no hooks, no DB, no side effects.
 */

import type { ArchetypeKey } from '@/types/content';
import type { LetterContext, Letter, SeasonKey } from '@/types/book-narration';
import { synthesizeReturnWhisper } from './return-whisper-engine';

// ─── Helpers ──────────────────────────────────────────────

const LABELS: Record<ArchetypeKey, string> = {
  'deep-diver': 'Deep Diver',
  'explorer': 'Explorer',
  'faithful': 'Faithful Reader',
  'resonator': 'Resonator',
  'collector': 'Collector',
};

function labelOf(key: ArchetypeKey): string {
  return LABELS[key] ?? key;
}

// ─── Salutation ───────────────────────────────────────────

const SALUTATIONS: Record<ArchetypeKey, string[]> = {
  'deep-diver': ['Dear Deep Diver', 'To the one who goes deeper'],
  'explorer': ['Dear Explorer', 'To the one who wanders wide'],
  'faithful': ['Dear Faithful Reader', 'To the one who always returns'],
  'resonator': ['Dear Resonator', 'To the one who echoes'],
  'collector': ['Dear Collector', 'To the one who gathers what matters'],
};

function pickSalutation(ctx: LetterContext): string {
  const bank = SALUTATIONS[ctx.archetype] ?? [`Dear ${labelOf(ctx.archetype)}`];
  return bank[ctx.visitCount % bank.length];
}

// ─── Opening ──────────────────────────────────────────────

function composeOpening(ctx: LetterContext): string {
  return synthesizeReturnWhisper({
    archetype: ctx.archetype,
    daysSinceLastVisit: ctx.daysSinceLastVisit,
    season: ctx.season.key,
    visitCount: ctx.visitCount,
  });
}

// ─── Body Templates ──────────────────────────────────────

interface BodyTemplate {
  trigger: (ctx: LetterContext) => boolean;
  text: (ctx: LetterContext) => string;
}

const resonanceBank: BodyTemplate[] = [
  { trigger: (c) => c.resonanceCount >= 3,
    text: (c) => `You carried ${c.resonanceCount} ideas with you. Some still breathe. Others have become part of how you think now.` },
  { trigger: (c) => c.resonanceCount === 2,
    text: () => 'Two ideas stayed with you. That\'s not a collection \u2014 that\'s a conviction.' },
  { trigger: (c) => c.resonanceCount === 1,
    text: () => 'One idea survived the distance. It must have mattered.' },
];

const evolutionBank: BodyTemplate[] = [
  { trigger: (c) => c.hasEvolution && c.evolutionTrajectory === 'rising',
    text: (c) => `You used to read as ${labelOf(c.previousArchetype ?? 'explorer')}. Now you go deeper. The mirror noticed before you did.` },
  { trigger: (c) => c.hasEvolution,
    text: (c) => `You started as ${labelOf(c.previousArchetype ?? 'explorer')}. Something shifted. The best readers evolve.` },
];

const absenceBank: BodyTemplate[] = [
  { trigger: (c) => c.daysSinceLastVisit > 14,
    text: (c) => `${c.daysSinceLastVisit} days. The words didn't change. But you did \u2014 every day shapes what you notice next.` },
  { trigger: (c) => c.daysSinceLastVisit > 7,
    text: (c) => `${c.daysSinceLastVisit} days away. Long enough to forget, short enough to remember why you came.` },
];

const seasonBank: BodyTemplate[] = [
  { trigger: (c) => c.season.key === 'winter',
    text: () => 'Winter strips things to what matters. Your reading reflects that.' },
  { trigger: (c) => c.season.key === 'spring',
    text: () => 'Spring is for beginning again. The next article is already here.' },
  { trigger: (c) => c.season.key === 'autumn',
    text: () => 'Autumn reading settles differently. Less urgency, more weight.' },
  { trigger: (c) => c.season.key === 'summer',
    text: () => 'Summer stretches time. Enough to read something that stays.' },
];

const archetypeBank: BodyTemplate[] = [
  { trigger: (c) => c.archetype === 'deep-diver' && c.visitCount >= 4,
    text: () => 'You don\'t skim. You go to the bottom and stay until the pressure makes sense of it.' },
  { trigger: (c) => c.archetype === 'explorer' && c.visitCount >= 3,
    text: () => 'You\'ve never taken the same path twice. That\'s not wandering \u2014 that\'s mapping by instinct.' },
  { trigger: (c) => c.archetype === 'faithful' && c.visitCount >= 5,
    text: () => 'Most readers drift. You return. That consistency is rarer than brilliance.' },
  { trigger: (c) => c.archetype === 'resonator',
    text: () => 'Something here echoes with who you are. That\'s not coincidence \u2014 it\'s recognition.' },
  { trigger: (c) => c.archetype === 'collector' && c.visitCount >= 3,
    text: () => 'Every visit adds to your personal library of ideas worth keeping.' },
];

const BODY_PIPELINE: BodyTemplate[][] = [
  resonanceBank,
  evolutionBank,
  absenceBank,
  seasonBank,
  archetypeBank,
];

function collectBody(ctx: LetterContext, max: number): string[] {
  const paragraphs: string[] = [];
  for (const bank of BODY_PIPELINE) {
    if (paragraphs.length >= max) break;
    for (const tpl of bank) {
      if (tpl.trigger(ctx)) { paragraphs.push(tpl.text(ctx)); break; }
    }
  }
  return paragraphs;
}

// ─── Closing ──────────────────────────────────────────────

const CLOSING_TEMPLATES: { trigger: (ctx: LetterContext) => boolean; text: string }[] = [
  { trigger: (c) => c.season.key === 'winter', text: 'The deepest reading happens when the world goes quiet.' },
  { trigger: (c) => c.season.key === 'spring', text: 'Spring is for beginning again. Something awaits.' },
  { trigger: (c) => c.archetype === 'deep-diver', text: 'The depths are waiting.' },
  { trigger: (c) => c.archetype === 'explorer', text: 'New territory. You know where to look.' },
  { trigger: (c) => c.archetype === 'faithful', text: 'You always return. Something new came with you.' },
  { trigger: (c) => c.archetype === 'resonator', text: 'The echo returns. So do you.' },
  { trigger: (c) => c.archetype === 'collector', text: 'Your shelves grow. What matters persists.' },
];

const FALLBACK_CLOSING = 'Something new is waiting.';

function pickClosing(ctx: LetterContext): string {
  for (const tpl of CLOSING_TEMPLATES) {
    if (tpl.trigger(ctx)) return tpl.text;
  }
  return FALLBACK_CLOSING;
}

// ─── Sign-off ─────────────────────────────────────────────

function composeSignOff(): string {
  return `Written for you on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
}

// ─── Public API ───────────────────────────────────────────

/** composeLetter — pure function. LetterContext → Letter. */
export function composeLetter(ctx: LetterContext): Letter {
  return {
    salutation: pickSalutation(ctx),
    opening: composeOpening(ctx),
    body: collectBody(ctx, 3),
    closing: pickClosing(ctx),
    signOff: composeSignOff(),
    archetype: ctx.archetype,
    date: new Date().toISOString(),
  };
}
