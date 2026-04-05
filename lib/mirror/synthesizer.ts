/**
 * Reading Mirror — synthesizes reader data into a reader identity.
 * Pure functions, no DB calls. All data comes in via MirrorInput.
 */

import type { MirrorInput, ReaderMirror } from '../../types/mirror';

const ARCHETYPES: Record<string, string> = {
  'deep-diver': 'The Deep Diver',
  'explorer': 'The Explorer',
  'faithful': 'The Faithful',
  'resonator': 'The Resonator',
  'collector': 'The Collector',
};

const WHISPERS: Record<string, string> = {
  'deep-diver': "You don\u2019t skim surfaces \u2014 you dive deep and emerge transformed.",
  'explorer': "Your curiosity has no borders \u2014 every topic is uncharted territory.",
  'faithful': "Day after day, you show up. Consistency is your quiet superpower.",
  'resonator': "You don\u2019t just read \u2014 you feel. Every resonance is a fingerprint of your mind.",
  'collector': "Your appetite for ideas is boundless \u2014 a personal library in the making.",
};

function scoreArchetypes(i: MirrorInput): Record<string, number> {
  return {
    'deep-diver': i.avgCompletion * 80,
    'explorer': i.topicCount * 20,
    'faithful': i.longestStreak * 15,
    'resonator': i.resonanceCount * 25,
    'collector': i.totalArticles * 10,
  };
}

function pickArchetype(scores: Record<string, number>): string {
  return Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0];
}

function extractTopicDNA(
  topics: MirrorInput['topics']
): ReaderMirror['topicDNA'] {
  const total = topics.reduce((s, t) => s + t.count, 0) || 1;
  return topics.map(t => ({
    topic: t.topic,
    weight: Math.round((t.count / total) * 100),
  }));
}

function countMeaningfulWords(notes: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  const stop = new Set([
    'the', 'and', 'that', 'this', 'with', 'for', 'are', 'but', 'not', 'you',
  ]);
  notes.join(' ').toLowerCase().split(/\s+/)
    .filter(w => w.length > 3 && !stop.has(w))
    .forEach(w => (freq[w] = (freq[w] || 0) + 1));
  return freq;
}

function extractThemes(notes: string[]): string[] {
  return Object.entries(countMeaningfulWords(notes))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([w]) => w);
}

function buildScores(i: MirrorInput) {
  const depth = Math.min(100, Math.round(i.avgCompletion * 100));
  const breadth = Math.min(100, Math.round((i.topicCount / 6) * 100));
  const consistency = i.longestStreak === 0
    ? 0
    : Math.min(100, Math.round((i.currentStreak / i.longestStreak) * 100));
  return { depth, breadth, consistency };
}

export function synthesize(input: MirrorInput): ReaderMirror {
  const archetype = pickArchetype(scoreArchetypes(input));
  return {
    archetype,
    archetypeLabel: ARCHETYPES[archetype] || 'The Reader',
    whisper: WHISPERS[archetype] || WHISPERS['explorer'],
    topicDNA: extractTopicDNA(input.topics),
    scores: buildScores(input),
    resonanceThemes: extractThemes(input.resonanceNotes),
  };
}
