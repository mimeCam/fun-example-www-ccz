/**
 * Reading Mirror — synthesis of all reader data into a reader identity
 */

export interface ReaderMirror {
  archetype: string;
  archetypeLabel: string;
  whisper: string;
  topicDNA: { topic: string; weight: number }[];
  scores: { depth: number; breadth: number; consistency: number };
  resonanceThemes: string[];
}

export interface MirrorInput {
  totalArticles: number;
  totalReadingTime: number;
  currentStreak: number;
  longestStreak: number;
  avgCompletion: number;
  topicCount: number;
  resonanceCount: number;
  insightCount: number;
  resonanceNotes: string[];
  topics: { topic: string; count: number }[];
}
