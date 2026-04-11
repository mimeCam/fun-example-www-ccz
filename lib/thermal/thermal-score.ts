/**
 * Thermal Score Engine — pure function computing reader engagement warmth.
 *
 * Takes accumulated reading history, produces a 0-100 score with
 * discrete thermal state and confidence level. No React, no DOM, no DB.
 *
 * Weighted dimensions (max 100):
 *   breadth      = min(articlesRead / 6, 1) × 25
 *   depth        = avgScrollDepth / 100 × 30
 *   consistency  = min(visitDays / 7, 1) × 20
 *   resonance    = min(resonancesSaved / 3, 1) × 15
 *   dwell        = min(totalDwellMins / 30, 1) × 10
 */

export type ThermalState = 'dormant' | 'stirring' | 'warm' | 'luminous';

export interface ThermalInput {
  articlesRead: number;
  totalDwellSecs: number;
  avgScrollDepth: number;       // 0-100
  resonanceCount: number;
  visitDays: number;            // unique calendar days
}

export interface ThermalResult {
  score: number;                // 0-100 continuous
  state: ThermalState;
  confidence: number;           // 0-1 (gap between top dimensions)
}

const STATE_THRESHOLDS: [number, ThermalState][] = [
  [80, 'luminous'],
  [50, 'warm'],
  [25, 'stirring'],
  [0, 'dormant'],
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function dimension(raw: number, divisor: number, weight: number): number {
  return Math.min(raw / divisor, 1) * weight;
}

export function computeThermalScore(input: ThermalInput): ThermalResult {
  const dims = [
    dimension(input.articlesRead, 6, 25),
    dimension(input.avgScrollDepth, 100, 30),
    dimension(input.visitDays, 7, 20),
    dimension(input.resonanceCount, 3, 15),
    dimension(input.totalDwellSecs / 60, 30, 10),
  ];
  const score = clamp(dims.reduce((a, b) => a + b, 0), 0, 100);
  const sorted = [...dims].sort((a, b) => b - a);
  const confidence = sorted.length >= 2
    ? clamp((sorted[0] - sorted[1]) / 25, 0, 1) : 0;

  const state = STATE_THRESHOLDS.find(([t]) => score >= t)?.[1] ?? 'dormant';
  return { score, state, confidence };
}
