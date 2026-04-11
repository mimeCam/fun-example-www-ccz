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
  evolution?: MirrorEvolution;
  challenges?: ReadingChallenge[];
  snapshot?: SnapshotMeta;
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

export interface MirrorSnapshot {
  id: number;
  emailFingerprint: string;
  archetype: string;
  scores: { depth: number; breadth: number; consistency: number };
  topicDNA: { topic: string; weight: number }[];
  createdAt: string;
}

export interface MirrorEvolution {
  previousArchetype: string | null;
  hasShifted: boolean;
  shifts: EvolutionShift[];
  trajectory: 'rising' | 'stable' | 'declining';
}

export interface EvolutionShift {
  dimension: string;
  delta: number;
  direction: 'up' | 'down';
}

export interface ReadingChallenge {
  target: string;
  description: string;
  progress: number;
  max: number;
}

export interface SnapshotMeta {
  visitCount: number;
  firstVisitAt: string | null;
  previousVisitAt: string | null;
}

/** Quiet Zone — prevents mirror over-reveal across articles/sessions. */
export interface QuietZoneState {
  lastArticleId: string;
  lastRevealAt: number;       // epoch ms
  articlesSince: number;
}

export interface QuietZoneConfig {
  articleCooldown: number;    // skip next N unique articles after reveal
  timeCooldownMs: number;     // ms of silence after last reveal
  sessionTtlMs: number;       // ms before quiet zone fully resets
}
